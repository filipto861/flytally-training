"use client";

import { useEffect, useMemo, useState } from "react";

import { AirportRunwaySelector } from "./airport-runway-selector";
import { MetarStatus } from "./metar-status";

import {
  airportAutoFill,
  calculateRunwayMarginFt,
  manualSourcedValue,
  metarAutoFill,
} from "@/lib/aviation/runway-context";
import {
  altimeterToHpa,
  calculatePressureAltitudeFt,
  hpaToInHg,
  type AltimeterSetting,
  type AltimeterUnit,
} from "@/lib/aviation/pressure-altitude";
import type { SelectedRunwayContext, SourcedValue } from "@/lib/aviation/airport-types";
import {
  calculatePilotTakeoffSummary,
  formatPilotTakeoffMetric,
  type PilotTakeoffCalculatorDefinition,
  type PilotTakeoffMetricResult,
} from "@/lib/pilot-takeoff-calculator";
import type { PerformanceDataset } from "@/lib/universal-aircraft-content";
import { formatThousands, formatThousandsWithUnit } from "@/lib/format/numbers";
import type { MetarSnapshot } from "@/lib/weather/metar-types";

import styles from "./pilot-takeoff-calculator.module.css";

function numberFromInput(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function altimeterSetting(unit: AltimeterUnit, value: number): AltimeterSetting {
  return unit === "hPa" ? { unit: "hPa", value } : { unit: "inHg", value };
}

function Metric({
  label,
  result,
  hint,
}: Readonly<{
  label: string;
  result: PilotTakeoffMetricResult;
  hint?: string;
}>) {
  const detail = result.reason ?? hint;
  return (
    <div className={styles.metric} data-result={label} data-status={result.status}>
      <span>{label}</span>
      <strong>{formatPilotTakeoffMetric(result)}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}

export function PilotTakeoffCalculator({
  datasets,
  definition,
}: Readonly<{
  datasets: readonly PerformanceDataset[];
  definition: PilotTakeoffCalculatorDefinition;
}>) {
  const [pressureAltitude, setPressureAltitude] = useState<SourcedValue<string>>({
    value: "",
    source: "manual",
    dirty: false,
  });
  const [runwayContext, setRunwayContext] = useState<SelectedRunwayContext>();
  const [selectedIcao, setSelectedIcao] = useState<string | null>(null);
  const [metarSnapshot, setMetarSnapshot] = useState<MetarSnapshot | null>(null);
  const [availableTakeoffLengthFt, setAvailableTakeoffLengthFt] = useState("");
  const [qnh, setQnh] = useState<SourcedValue<string>>({ value: "1013.25", source: "manual", dirty: false });
  const [qnhUnit, setQnhUnit] = useState<AltimeterUnit>("hPa");
  const [oat, setOat] = useState<SourcedValue<string>>({ value: "", source: "manual", dirty: false });
  const [takeoffWeight, setTakeoffWeight] = useState("");
  const [flaps, setFlaps] = useState(definition.flapOptions[0]?.value ?? "");
  const [antiIce, setAntiIce] = useState(false);

  const calculatedPressureAltitude = useMemo(() => {
    if (!runwayContext) return undefined;
    const value = numberFromInput(qnh.value);
    if (value === undefined) return undefined;
    try {
      return Math.round(calculatePressureAltitudeFt(
        runwayContext.airportElevationFt,
        altimeterSetting(qnhUnit, value),
      ));
    } catch {
      return undefined;
    }
  }, [qnh.value, qnhUnit, runwayContext]);

  useEffect(() => {
    if (calculatedPressureAltitude === undefined) return;
    setPressureAltitude((current) => airportAutoFill(current, String(calculatedPressureAltitude)));
  }, [calculatedPressureAltitude]);

  const summary = useMemo(
    () => calculatePilotTakeoffSummary(datasets, definition, {
      pressureAltitude: numberFromInput(pressureAltitude.value),
      oat: numberFromInput(oat.value),
      takeoffWeight: numberFromInput(takeoffWeight),
      flaps,
      antiIce,
    }),
    [antiIce, datasets, definition, flaps, oat.value, pressureAltitude.value, takeoffWeight],
  );

  const handleRunwayContext = (context: SelectedRunwayContext | undefined) => {
    setRunwayContext(context);
    setAvailableTakeoffLengthFt(context ? String(context.surfaceLengthFt) : "");
    if (!context) {
      setPressureAltitude((current) =>
        current.dirty ? current : { value: "", source: "airport-db", dirty: false },
      );
    }
  };

  const handleQnhUnitChange = (nextUnit: AltimeterUnit) => {
    if (nextUnit === qnhUnit) return;
    const numeric = numberFromInput(qnh.value);
    if (numeric !== undefined) {
      const hpa = altimeterToHpa(altimeterSetting(qnhUnit, numeric));
      const converted = nextUnit === "hPa" ? hpa : hpaToInHg(hpa);
      setQnh((current) => ({ ...current, value: converted.toFixed(2) }));
    }
    setQnhUnit(nextUnit);
  };

  const formatMetarQnh = (snapshot: MetarSnapshot): string | undefined => {
    if (qnhUnit === "hPa") return snapshot.qnhHpa === undefined ? undefined : String(Math.round(snapshot.qnhHpa * 100) / 100);
    return snapshot.altimeterInHg === undefined ? undefined : snapshot.altimeterInHg.toFixed(2);
  };

  const handleMetarApply = (snapshot: MetarSnapshot) => {
    setMetarSnapshot(snapshot);
    if (snapshot.temperatureC !== undefined) {
      setOat((current) => metarAutoFill(current, String(snapshot.temperatureC)));
    }
    const metarQnh = formatMetarQnh(snapshot);
    if (metarQnh !== undefined) {
      setQnh((current) => metarAutoFill(current, metarQnh));
    }
  };

  const forceMetarOat = () => {
    if (metarSnapshot?.temperatureC === undefined) return;
    setOat((current) => metarAutoFill(current, String(metarSnapshot.temperatureC), true));
  };

  const forceMetarQnh = () => {
    if (!metarSnapshot) return;
    const metarQnh = formatMetarQnh(metarSnapshot);
    if (metarQnh === undefined) return;
    setQnh((current) => metarAutoFill(current, metarQnh, true));
  };

  const handleAirportSelection = (icao: string | null) => {
    setSelectedIcao(icao);
    setMetarSnapshot(null);
  };

  const runwayMargin = useMemo(() => {
    const available = numberFromInput(availableTakeoffLengthFt);
    if (
      !runwayContext
      || available === undefined
      || available <= 0
      || summary.takeoffDistance.status !== "ready"
      || summary.takeoffDistance.value === undefined
    ) return undefined;
    try {
      return calculateRunwayMarginFt(summary.takeoffDistance.value, available);
    } catch {
      return undefined;
    }
  }, [availableTakeoffLengthFt, runwayContext, summary.takeoffDistance]);

  const availableLength = numberFromInput(availableTakeoffLengthFt);
  const usingSurfaceLength = Boolean(
    runwayContext
    && availableLength !== undefined
    && Math.abs(availableLength - runwayContext.surfaceLengthFt) < 0.5,
  );

  const pressureAltitudeBadgeSource = pressureAltitude.dirty ? "manual" : qnh.source === "metar" ? "metar" : "manual";

  const marginTone = runwayMargin
    ? runwayMargin.usePercent <= 50
      ? "safe"
      : runwayMargin.usePercent <= 70
        ? "neutral"
        : runwayMargin.usePercent <= 90
          ? "caution"
          : "critical"
    : undefined;
  const runwayProgressPercent = runwayMargin
    ? Math.min(Math.max(runwayMargin.usePercent, 0), 100)
    : 0;

  const sourceResults = [summary.n1, summary.v1, summary.vr, summary.v2, summary.vref, summary.takeoffDistance];
  const hasOutOfRange = sourceResults.some((result) => result.status === "out-of-range");
  const hasUnavailable = sourceResults.some((result) => result.status === "unavailable");

  return (
    <section className={styles.calculator} aria-label={definition.title}>
      <header className={styles.header}>
        <div>
          <h2>{definition.title}</h2>
          <p>Enter current conditions. Results update live from the encoded source grids.</p>
        </div>
        <span className={styles.live}>Live calculation</span>
      </header>

      <div className={styles.layout}>
        <section className={styles.inputs} aria-label="Takeoff inputs">
          <h3 className={styles.inputsTitle}>Inputs</h3>

          <MetarStatus icao={selectedIcao} onApply={handleMetarApply} />

          <AirportRunwaySelector
            onAirportChange={handleAirportSelection}
            onChange={handleRunwayContext}
          />

          {runwayContext ? (
            <div className={styles.runwayContext}>
              <div className={styles.runwaySurface}>
                <div className={styles.contextLabel}>
                  <span>Runway surface length</span>
                </div>
                <div className={styles.readOnlyControl}>
                  <strong>{formatThousandsWithUnit(runwayContext.surfaceLengthFt, "ft")}</strong>
                </div>
              </div>
              <div className={styles.availableLength}>
                <div className={styles.editableLabel}>
                  <span>Available takeoff length</span>
                  <span className={styles.editableBadge}>Editable</span>
                </div>
                <div className={styles.inputWithUnit}>
                  <input
                    aria-label="Available takeoff length"
                    inputMode="decimal"
                    min="1"
                    onChange={(event) => setAvailableTakeoffLengthFt(event.target.value)}
                    step="any"
                    type="number"
                    value={availableTakeoffLengthFt}
                  />
                  <span className={styles.unitSuffix}>ft</span>
                </div>
                <div className={styles.availableLengthMeta}>
                  <small>Defaults to surface length</small>
                  {!usingSurfaceLength ? (
                    <button
                      className={styles.resetLengthButton}
                      onClick={() => setAvailableTakeoffLengthFt(String(runwayContext.surfaceLengthFt))}
                      type="button"
                    >
                      Reset to surface length
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className={styles.fields}>
            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span>QNH / Altimeter</span>
                <span className={styles.sourceBadge} data-source={qnh.source}>{qnh.source}</span>
              </div>
              <div className={styles.inputWithUnit}>
                <input
                  aria-label="QNH or altimeter setting"
                  inputMode="decimal"
                  min="1"
                  onChange={(event) => setQnh(manualSourcedValue(event.target.value))}
                  step="any"
                  type="number"
                  value={qnh.value}
                />
                <select
                  aria-label="Altimeter unit"
                  className={styles.unitSelect}
                  onChange={(event) => handleQnhUnitChange(event.target.value as AltimeterUnit)}
                  value={qnhUnit}
                >
                  <option value="hPa">hPa</option>
                  <option value="inHg">inHg</option>
                </select>
              </div>
              {qnh.dirty && metarSnapshot && formatMetarQnh(metarSnapshot) !== undefined ? (
                <small className={styles.fieldHint}>
                  Manual override
                  <button className={styles.inlineButton} onClick={forceMetarQnh} type="button">Use METAR value</button>
                </small>
              ) : null}
            </label>

            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span>{definition.inputs.pressureAltitude.label}</span>
                <span className={styles.sourceBadge} data-source={pressureAltitudeBadgeSource}>
                  {pressureAltitudeBadgeSource}
                </span>
              </div>
              <div className={styles.inputWithUnit}>
                <input
                  aria-label={definition.inputs.pressureAltitude.label}
                  inputMode="decimal"
                  onChange={(event) => setPressureAltitude(manualSourcedValue(event.target.value))}
                  step="any"
                  type="number"
                  value={pressureAltitude.value}
                />
                <span className={styles.unitSuffix}>{definition.inputs.pressureAltitude.unit}</span>
              </div>
              {runwayContext ? (
                <small className={styles.fieldHint}>
                  {pressureAltitude.dirty
                    ? "Manual override"
                    : `Auto from ${runwayContext.airportIcao} field elevation + QNH`}
                  {pressureAltitude.dirty && calculatedPressureAltitude !== undefined ? (
                    <button
                      className={styles.inlineButton}
                      onClick={() => setPressureAltitude({
                        value: String(calculatedPressureAltitude),
                        source: "airport-db",
                        dirty: false,
                      })}
                      type="button"
                    >
                      Reset
                    </button>
                  ) : null}
                </small>
              ) : null}
            </label>

            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span>{definition.inputs.oat.label}</span>
                <span className={styles.sourceBadge} data-source={oat.source}>{oat.source}</span>
              </div>
              <div className={styles.inputWithUnit}>
                <input
                  aria-label={definition.inputs.oat.label}
                  inputMode="decimal"
                  onChange={(event) => setOat(manualSourcedValue(event.target.value))}
                  step="any"
                  type="number"
                  value={oat.value}
                />
                <span className={styles.unitSuffix}>{definition.inputs.oat.unit}</span>
              </div>
              {oat.dirty && metarSnapshot?.temperatureC !== undefined ? (
                <small className={styles.fieldHint}>
                  Manual override
                  <button className={styles.inlineButton} onClick={forceMetarOat} type="button">Use METAR value</button>
                </small>
              ) : null}
            </label>

            <label className={styles.field}>
              <span>{definition.inputs.takeoffWeight.label}</span>
              <div className={styles.inputWithUnit}>
                <input
                  aria-label={definition.inputs.takeoffWeight.label}
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setTakeoffWeight(event.target.value)}
                  step="any"
                  type="number"
                  value={takeoffWeight}
                />
                <span className={styles.unitSuffix}>{definition.inputs.takeoffWeight.unit}</span>
              </div>
            </label>

            <label className={styles.field}>
              <span>{definition.inputs.flaps.label}</span>
              <select
                aria-label={definition.inputs.flaps.label}
                className={styles.select}
                onChange={(event) => setFlaps(event.target.value)}
                value={flaps}
              >
                {definition.flapOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <div className={styles.field}>
              <span className={styles.toggleLabel}>{definition.inputs.antiIce.label}</span>
              <div className={styles.toggleField}>
                <span className={styles.toggleLabel}>Engine anti-ice</span>
                <label className={styles.switch}>
                  <input
                    aria-label={definition.inputs.antiIce.label}
                    checked={antiIce}
                    onChange={(event) => setAntiIce(event.target.checked)}
                    type="checkbox"
                  />
                  <span className={styles.track} aria-hidden="true" />
                  <span className={styles.switchState}>{antiIce ? "ON" : "OFF"}</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.results} aria-label="Takeoff results">
          <div className={styles.resultsHeader}>
            <h3 className={styles.resultsTitle}>Takeoff result</h3>
            {hasOutOfRange ? (
              <div className={styles.notice} role="status">
                <strong>Out of range.</strong> One or more values are outside the encoded source envelope.
              </div>
            ) : hasUnavailable ? (
              <div className={styles.notice} role="status">
                <strong>Source data unavailable.</strong> One or more values are not encoded for the selected configuration.
              </div>
            ) : null}
          </div>

          <div className={styles.metricGrid}>
            <Metric label="N1" result={summary.n1} />
            <Metric label="VR" result={summary.vr} />
            <Metric label="V2" result={summary.v2} />
            <Metric label="VREF" result={summary.vref} hint="Landing reference at the entered weight." />
            <Metric label="V1" result={summary.v1} />
            <Metric label="Takeoff Distance" result={summary.takeoffDistance} />
          </div>

          {runwayMargin && runwayContext && availableLength !== undefined ? (
            <div
              className={styles.runwayMargin}
              data-margin-tone={marginTone}
              data-overrun={runwayMargin.usePercent > 100}
              data-within={runwayMargin.withinLength}
            >
              <div>
                <span>Required distance</span>
                <strong>{formatThousandsWithUnit(Math.round(summary.takeoffDistance.value ?? 0), "ft")}</strong>
              </div>
              <div>
                <span>Available</span>
                <strong>{formatThousandsWithUnit(Math.round(availableLength), "ft")}</strong>
              </div>
              <div>
                <span>Margin</span>
                <strong className={styles.semanticValue}>
                  {runwayMargin.marginFt >= 0 ? "+" : ""}
                  {formatThousands(Math.round(runwayMargin.marginFt))} ft
                </strong>
              </div>
              <div className={styles.runwayUsed}>
                <span>Runway used</span>
                <strong className={styles.semanticValue}>{Math.round(runwayMargin.usePercent)}%</strong>
                <div className={styles.runwayProgress} aria-hidden="true">
                  <span
                    className={styles.runwayProgressFill}
                    style={{ width: `${runwayProgressPercent}%` }}
                  />
                </div>
              </div>
              <small>
                {usingSurfaceLength
                  ? "Based on runway surface length from the airport database, not declared TORA."
                  : "Based on manually entered available takeoff length."}
              </small>
            </div>
          ) : null}

          <p className={styles.legalDisclaimer}>
            Sources: available training material. Not approved for operational use. Weather and airport data are provided for training/simulation convenience and may be delayed, incomplete, or outdated. Always verify current weather, runway data, NOTAMs and declared distances using approved official sources before flight.
          </p>
        </section>
      </div>
    </section>
  );
}

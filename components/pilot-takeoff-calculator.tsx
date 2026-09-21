"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AirportRunwaySelector } from "./airport-runway-selector";
import { EnvironmentContextPanel } from "./environment-context-panel";
import { MetarStatus } from "./metar-status";
import type { ExternalPerformanceEnvironment } from "./performance-environment-section";
import {
  FieldRow,
  InputWithUnit,
  MetricCard,
  MetricGrid,
  SourceBadge,
} from "./performance-ui";

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

export function PilotTakeoffCalculator({
  datasets,
  definition,
  externalEnvironment,
}: Readonly<{
  datasets: readonly PerformanceDataset[];
  definition: PilotTakeoffCalculatorDefinition;
  externalEnvironment?: ExternalPerformanceEnvironment;
}>) {
  const [pressureAltitude, setPressureAltitude] = useState<SourcedValue<string>>({
    value: "",
    source: "manual",
    dirty: false,
  });
  const [internalRunwayContext, setInternalRunwayContext] = useState<SelectedRunwayContext>();
  const [internalSelectedIcao, setInternalSelectedIcao] = useState<string | null>(null);
  const [internalMetarSnapshot, setInternalMetarSnapshot] = useState<MetarSnapshot | null>(null);
  const [lastAppliedIcao, setLastAppliedIcao] = useState<string | null>(null);
  const [availableTakeoffLengthFt, setAvailableTakeoffLengthFt] = useState("");
  const [qnh, setQnh] = useState<SourcedValue<string>>({ value: "1013.25", source: "manual", dirty: false });
  const [qnhUnit, setQnhUnit] = useState<AltimeterUnit>("hPa");
  const [oat, setOat] = useState<SourcedValue<string>>({ value: "", source: "manual", dirty: false });
  const [takeoffWeight, setTakeoffWeight] = useState("");
  const [flaps, setFlaps] = useState(definition.flapOptions[0]?.value ?? "");
  const [antiIce, setAntiIce] = useState(false);

  const usesExternalEnvironment = externalEnvironment !== undefined;
  const runwayContext = usesExternalEnvironment ? externalEnvironment.runwayContext : internalRunwayContext;
  const selectedIcao = usesExternalEnvironment ? externalEnvironment.icao : internalSelectedIcao;
  const metarSnapshot = usesExternalEnvironment ? externalEnvironment.metarSnapshot : internalMetarSnapshot;

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

  useEffect(() => {
    if (!usesExternalEnvironment) return;
    setAvailableTakeoffLengthFt(runwayContext ? String(runwayContext.surfaceLengthFt) : "");
    if (!runwayContext) {
      setPressureAltitude((current) =>
        current.dirty ? current : { value: "", source: "airport-db", dirty: false },
      );
    }
  }, [runwayContext, usesExternalEnvironment]);

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
    setInternalRunwayContext(context);
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

  const formatMetarQnh = useCallback((snapshot: MetarSnapshot): string | undefined => {
    if (qnhUnit === "hPa") return snapshot.qnhHpa === undefined ? undefined : String(Math.round(snapshot.qnhHpa * 100) / 100);
    return snapshot.altimeterInHg === undefined ? undefined : snapshot.altimeterInHg.toFixed(2);
  }, [qnhUnit]);

  const handleMetarApply = useCallback((snapshot: MetarSnapshot) => {
    if (!usesExternalEnvironment) setInternalMetarSnapshot(snapshot);
    if (snapshot.temperatureC !== undefined) {
      setOat((current) => metarAutoFill(current, String(snapshot.temperatureC)));
    }
    const metarQnh = formatMetarQnh(snapshot);
    if (metarQnh !== undefined) {
      setQnh((current) => metarAutoFill(current, metarQnh));
    }
  }, [formatMetarQnh, usesExternalEnvironment]);

  useEffect(() => {
    if (!metarSnapshot) return;
    if (usesExternalEnvironment) {
      handleMetarApply(metarSnapshot);
      return;
    }
    if (!selectedIcao || lastAppliedIcao === selectedIcao) return;
    handleMetarApply(metarSnapshot);
    setLastAppliedIcao(selectedIcao);
  }, [handleMetarApply, lastAppliedIcao, metarSnapshot, selectedIcao, usesExternalEnvironment]);

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
    setInternalSelectedIcao(icao);
    setInternalMetarSnapshot(null);
    setLastAppliedIcao(null);
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

          {!usesExternalEnvironment ? (
            <>
              <MetarStatus
                icao={selectedIcao}
                onApply={handleMetarApply}
                onSnapshot={setInternalMetarSnapshot}
              />

              <EnvironmentContextPanel
                runwayContext={runwayContext}
                metarSnapshot={metarSnapshot}
              />

              <AirportRunwaySelector
                onAirportChange={handleAirportSelection}
                onChange={handleRunwayContext}
              />
            </>
          ) : null}

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
                  <SourceBadge kind="editable" />
                </div>
                <InputWithUnit
                  ariaLabel="Available takeoff length"
                  min={1}
                  onChange={setAvailableTakeoffLengthFt}
                  unit="ft"
                  value={availableTakeoffLengthFt}
                />
                <div className={styles.availableLengthMeta}>
                  <div className={styles.helperWithInfo}>
                    <small>Defaults to surface length</small>
                    <button
                      aria-describedby="available-takeoff-length-tooltip"
                      aria-label="Available takeoff length information"
                      className={styles.infoButton}
                      type="button"
                    >
                      <span aria-hidden="true">i</span>
                      <span
                        className={styles.infoTooltip}
                        id="available-takeoff-length-tooltip"
                        role="tooltip"
                      >
                        Defaults to runway surface length from the airport database. This is not declared TORA; verify current published runway data.
                      </span>
                    </button>
                  </div>
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
            <FieldRow
              helper={qnh.dirty && metarSnapshot && formatMetarQnh(metarSnapshot) !== undefined ? "Manual override" : undefined}
              helperAction={qnh.dirty && metarSnapshot && formatMetarQnh(metarSnapshot) !== undefined ? (
                <button className={styles.inlineButton} onClick={forceMetarQnh} type="button">Use METAR value</button>
              ) : undefined}
              label="QNH / Altimeter"
              source={qnh.source}
            >
              <InputWithUnit
                ariaLabel="QNH or altimeter setting"
                min={1}
                onChange={(value) => setQnh(manualSourcedValue(value))}
                onUnitChange={(value) => handleQnhUnitChange(value as AltimeterUnit)}
                selectOptions={[
                  { value: "hPa", label: "hPa" },
                  { value: "inHg", label: "inHg" },
                ]}
                unit={qnhUnit}
                unitAriaLabel="Altimeter unit"
                unitKind="select"
                value={qnh.value}
              />
            </FieldRow>

            <FieldRow
              helper={runwayContext
                ? pressureAltitude.dirty
                  ? "Manual override"
                  : `Auto from ${runwayContext.airportIcao} field elevation + QNH`
                : undefined}
              helperAction={runwayContext && pressureAltitude.dirty && calculatedPressureAltitude !== undefined ? (
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
              ) : undefined}
              label={definition.inputs.pressureAltitude.label}
              source={pressureAltitudeBadgeSource}
            >
              <InputWithUnit
                ariaLabel={definition.inputs.pressureAltitude.label}
                onChange={(value) => setPressureAltitude(manualSourcedValue(value))}
                unit={definition.inputs.pressureAltitude.unit}
                value={pressureAltitude.value}
              />
            </FieldRow>

            <FieldRow
              helper={oat.dirty && metarSnapshot?.temperatureC !== undefined ? "Manual override" : undefined}
              helperAction={oat.dirty && metarSnapshot?.temperatureC !== undefined ? (
                <button className={styles.inlineButton} onClick={forceMetarOat} type="button">Use METAR value</button>
              ) : undefined}
              label={definition.inputs.oat.label}
              source={oat.source}
            >
              <InputWithUnit
                ariaLabel={definition.inputs.oat.label}
                onChange={(value) => setOat(manualSourcedValue(value))}
                unit={definition.inputs.oat.unit}
                value={oat.value}
              />
            </FieldRow>

            <FieldRow label={definition.inputs.takeoffWeight.label}>
              <InputWithUnit
                ariaLabel={definition.inputs.takeoffWeight.label}
                min={0}
                onChange={setTakeoffWeight}
                unit={definition.inputs.takeoffWeight.unit}
                value={takeoffWeight}
              />
            </FieldRow>

            <FieldRow label={definition.inputs.flaps.label}>
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
            </FieldRow>

            <FieldRow as="div" label={definition.inputs.antiIce.label}>
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
            </FieldRow>
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

          <MetricGrid>
            <MetricCard
              hint={summary.n1.reason}
              label="N1"
              status={summary.n1.status}
              value={formatPilotTakeoffMetric(summary.n1)}
            />
            <MetricCard
              hint={summary.vr.reason}
              label="VR"
              status={summary.vr.status}
              value={formatPilotTakeoffMetric(summary.vr)}
            />
            <MetricCard
              hint={summary.v2.reason}
              label="V2"
              status={summary.v2.status}
              value={formatPilotTakeoffMetric(summary.v2)}
            />
            <MetricCard
              hint={summary.vref.reason ?? "Landing reference at the entered weight."}
              label="VREF"
              status={summary.vref.status}
              value={formatPilotTakeoffMetric(summary.vref)}
            />
            <MetricCard
              hint={summary.v1.reason}
              label="V1"
              status={summary.v1.status}
              value={formatPilotTakeoffMetric(summary.v1)}
            />
            <MetricCard
              hint={summary.takeoffDistance.reason}
              label="Takeoff Distance"
              status={summary.takeoffDistance.status}
              value={formatPilotTakeoffMetric(summary.takeoffDistance)}
            />
          </MetricGrid>

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

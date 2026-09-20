"use client";

import { useEffect, useMemo, useState } from "react";

import { AirportRunwaySelector } from "./airport-runway-selector";

import {
  airportAutoFill,
  calculateRunwayMarginFt,
  manualSourcedValue,
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
  const [availableTakeoffLengthFt, setAvailableTakeoffLengthFt] = useState("");
  const [qnh, setQnh] = useState("1013.25");
  const [qnhUnit, setQnhUnit] = useState<AltimeterUnit>("hPa");
  const [oat, setOat] = useState("");
  const [takeoffWeight, setTakeoffWeight] = useState("");
  const [flaps, setFlaps] = useState(definition.flapOptions[0]?.value ?? "");
  const [antiIce, setAntiIce] = useState(false);

  const calculatedPressureAltitude = useMemo(() => {
    if (!runwayContext) return undefined;
    const value = numberFromInput(qnh);
    if (value === undefined) return undefined;
    try {
      return Math.round(calculatePressureAltitudeFt(
        runwayContext.airportElevationFt,
        altimeterSetting(qnhUnit, value),
      ));
    } catch {
      return undefined;
    }
  }, [qnh, qnhUnit, runwayContext]);

  useEffect(() => {
    if (calculatedPressureAltitude === undefined) return;
    setPressureAltitude((current) => airportAutoFill(current, String(calculatedPressureAltitude)));
  }, [calculatedPressureAltitude]);

  const summary = useMemo(
    () => calculatePilotTakeoffSummary(datasets, definition, {
      pressureAltitude: numberFromInput(pressureAltitude.value),
      oat: numberFromInput(oat),
      takeoffWeight: numberFromInput(takeoffWeight),
      flaps,
      antiIce,
    }),
    [antiIce, datasets, definition, flaps, oat, pressureAltitude.value, takeoffWeight],
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
    const numeric = numberFromInput(qnh);
    if (numeric !== undefined) {
      const hpa = altimeterToHpa(altimeterSetting(qnhUnit, numeric));
      const converted = nextUnit === "hPa" ? hpa : hpaToInHg(hpa);
      setQnh(converted.toFixed(2));
    }
    setQnhUnit(nextUnit);
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

          <AirportRunwaySelector onChange={handleRunwayContext} />

          {runwayContext ? (
            <div className={styles.runwayContext}>
              <div>
                <span>Runway surface length</span>
                <strong>{runwayContext.surfaceLengthFt.toLocaleString("en-US")} ft</strong>
              </div>
              <label className={styles.availableLength}>
                <span>Available takeoff length</span>
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
                  <small>ft</small>
                </div>
              </label>
              <small>
                Defaults to runway surface length from the airport database. This is not declared TORA; verify current published runway data.
              </small>
            </div>
          ) : null}

          <div className={styles.fields}>
            <label className={styles.field}>
              <span>QNH / Altimeter</span>
              <div className={styles.altimeterControl}>
                <input
                  aria-label="QNH or altimeter setting"
                  inputMode="decimal"
                  min="1"
                  onChange={(event) => setQnh(event.target.value)}
                  step="any"
                  type="number"
                  value={qnh}
                />
                <select
                  aria-label="Altimeter unit"
                  onChange={(event) => handleQnhUnitChange(event.target.value as AltimeterUnit)}
                  value={qnhUnit}
                >
                  <option value="hPa">hPa</option>
                  <option value="inHg">inHg</option>
                </select>
              </div>
            </label>

            <label className={styles.field}>
              <span>{definition.inputs.pressureAltitude.label}</span>
              <div className={styles.inputWithUnit}>
                <input
                  aria-label={definition.inputs.pressureAltitude.label}
                  inputMode="decimal"
                  onChange={(event) => setPressureAltitude(manualSourcedValue(event.target.value))}
                  step="any"
                  type="number"
                  value={pressureAltitude.value}
                />
                <small>{definition.inputs.pressureAltitude.unit}</small>
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
                      Use calculated
                    </button>
                  ) : null}
                </small>
              ) : null}
            </label>

            <label className={styles.field}>
              <span>{definition.inputs.oat.label}</span>
              <div className={styles.inputWithUnit}>
                <input
                  aria-label={definition.inputs.oat.label}
                  inputMode="decimal"
                  onChange={(event) => setOat(event.target.value)}
                  step="any"
                  type="number"
                  value={oat}
                />
                <small>{definition.inputs.oat.unit}</small>
              </div>
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
                <small>{definition.inputs.takeoffWeight.unit}</small>
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
            <div className={styles.runwayMargin} data-within={runwayMargin.withinLength}>
              <div>
                <span>Required distance</span>
                <strong>{Math.round(summary.takeoffDistance.value ?? 0).toLocaleString("en-US")} ft</strong>
              </div>
              <div>
                <span>Available</span>
                <strong>{Math.round(availableLength).toLocaleString("en-US")} ft</strong>
              </div>
              <div>
                <span>Margin</span>
                <strong>
                  {runwayMargin.marginFt >= 0 ? "+" : ""}
                  {Math.round(runwayMargin.marginFt).toLocaleString("en-US")} ft
                </strong>
              </div>
              <div>
                <span>Runway used</span>
                <strong>{Math.round(runwayMargin.usePercent)}%</strong>
              </div>
              <small>
                {usingSurfaceLength
                  ? "Based on runway surface length from the airport database, not declared TORA."
                  : "Based on manually entered available takeoff length."}
              </small>
            </div>
          ) : null}

          <p className={styles.disclaimer}>{definition.disclaimer}</p>
        </section>
      </div>
    </section>
  );
}

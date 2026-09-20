"use client";

import { useMemo, useState } from "react";

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
  const [pressureAltitude, setPressureAltitude] = useState("");
  const [oat, setOat] = useState("");
  const [takeoffWeight, setTakeoffWeight] = useState("");
  const [flaps, setFlaps] = useState(definition.flapOptions[0]?.value ?? "");
  const [antiIce, setAntiIce] = useState(false);

  const summary = useMemo(
    () => calculatePilotTakeoffSummary(datasets, definition, {
      pressureAltitude: numberFromInput(pressureAltitude),
      oat: numberFromInput(oat),
      takeoffWeight: numberFromInput(takeoffWeight),
      flaps,
      antiIce,
    }),
    [antiIce, datasets, definition, flaps, oat, pressureAltitude, takeoffWeight],
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
          <div className={styles.fields}>
            <label className={styles.field}>
              <span>{definition.inputs.pressureAltitude.label}</span>
              <div className={styles.inputWithUnit}>
                <input
                  aria-label={definition.inputs.pressureAltitude.label}
                  inputMode="decimal"
                  onChange={(event) => setPressureAltitude(event.target.value)}
                  step="any"
                  type="number"
                  value={pressureAltitude}
                />
                <small>{definition.inputs.pressureAltitude.unit}</small>
              </div>
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

          <p className={styles.disclaimer}>{definition.disclaimer}</p>
        </section>
      </div>
    </section>
  );
}

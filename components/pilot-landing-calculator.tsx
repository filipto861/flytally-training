"use client";

import { useMemo, useState } from "react";

import {
  FieldRow,
  InputWithUnit,
  MetricCard,
  MetricGrid,
} from "./performance-ui";

import {
  calculatePilotLandingSummary,
  type PilotLandingCalculatorDefinition,
} from "@/lib/pilot-landing-calculator";
import {
  formatPilotTakeoffMetric,
  type PilotTakeoffMetricResult,
} from "@/lib/pilot-takeoff-calculator";
import type { PerformanceDataset } from "@/lib/universal-aircraft-content";

import styles from "./pilot-landing-calculator.module.css";

function numberFromInput(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function landingMetricValue(
  result: PilotTakeoffMetricResult,
  missingText: string,
): string {
  if (result.status === "missing") return missingText;
  return formatPilotTakeoffMetric(result);
}

function missingDistanceText(pressureAltitude: string, oat: string, grossWeight: string): string {
  const missing: string[] = [];
  if (!grossWeight.trim()) missing.push("Gross Weight");
  if (!pressureAltitude.trim()) missing.push("Pressure Altitude");
  if (!oat.trim()) missing.push("OAT");
  if (!missing.length) return "Enter required inputs";
  if (missing.length === 1) return `Enter ${missing[0]}`;
  if (missing.length === 2) return `Enter ${missing[0]} and ${missing[1]}`;
  return "Enter Gross Weight, Pressure Altitude and OAT";
}

function InfoTip({
  id,
  label,
  children,
}: Readonly<{
  id: string;
  label: string;
  children: string;
}>) {
  return (
    <button
      aria-describedby={id}
      aria-label={label}
      className={styles.infoButton}
      type="button"
    >
      <span aria-hidden="true">i</span>
      <span className={styles.infoTooltip} id={id} role="tooltip">{children}</span>
    </button>
  );
}

export function PilotLandingCalculator({
  datasets,
  definition,
}: Readonly<{
  datasets: readonly PerformanceDataset[];
  definition: PilotLandingCalculatorDefinition;
}>) {
  const [grossWeight, setGrossWeight] = useState("");
  const [pressureAltitude, setPressureAltitude] = useState("");
  const [oat, setOat] = useState("");

  const summary = useMemo(
    () => calculatePilotLandingSummary(datasets, definition, {
      grossWeight: numberFromInput(grossWeight),
      pressureAltitude: numberFromInput(pressureAltitude),
      oat: numberFromInput(oat),
    }),
    [datasets, definition, grossWeight, pressureAltitude, oat],
  );

  const sourceResults = [
    summary.vrefKias,
    summary.landingClimbSpeed,
    summary.approachClimbSpeed,
    summary.landingDistanceFt,
  ];
  const hasOutOfRange = sourceResults.some((result) => result.status === "out-of-range");
  const hasUnavailable = sourceResults.some((result) => result.status === "unavailable");

  const grossWeightMissing = "Enter Gross Weight";
  const distanceMissing = missingDistanceText(pressureAltitude, oat, grossWeight);

  return (
    <section className={styles.calculator} aria-label="Landing Calculator">
      <header className={styles.header}>
        <div>
          <h2>Landing Calculator</h2>
          <p>Approach-first landing references with source-backed distance and go-around data.</p>
        </div>
        <span className={styles.live}>Live calculation</span>
      </header>

      <div className={styles.layout}>
        <section className={styles.inputs} aria-label="Landing inputs">
          <h3 className={styles.inputsTitle}>Inputs</h3>
          <div className={styles.fields}>
            <FieldRow label="Gross Weight" source="manual">
              <InputWithUnit
                ariaLabel="Landing gross weight"
                min={0}
                onChange={setGrossWeight}
                unit="lb"
                value={grossWeight}
              />
            </FieldRow>

            <FieldRow label="Pressure Altitude" source="manual">
              <InputWithUnit
                ariaLabel="Landing pressure altitude"
                onChange={setPressureAltitude}
                unit="ft"
                value={pressureAltitude}
              />
            </FieldRow>

            <FieldRow label="OAT" source="manual">
              <InputWithUnit
                ariaLabel="Landing outside air temperature"
                onChange={setOat}
                unit="°C"
                value={oat}
              />
            </FieldRow>
          </div>
        </section>

        <section className={styles.results} aria-label="Landing results">
          <div className={styles.resultsHeader}>
            <h3 className={styles.resultsTitle}>Primary result</h3>
            {hasOutOfRange ? (
              <div className={styles.notice} role="status">
                <strong>Out of range.</strong> One or more values are outside the encoded source envelope or require unpublished source corners.
              </div>
            ) : hasUnavailable ? (
              <div className={styles.notice} role="status">
                <strong>Source data unavailable.</strong> One or more landing datasets are not available.
              </div>
            ) : null}
          </div>

          <MetricGrid columns={3}>
            <MetricCard
              hint={summary.vrefKias.reason ?? "Landing reference speed at the entered gross weight."}
              label="VREF"
              status={summary.vrefKias.status}
              value={landingMetricValue(summary.vrefKias, grossWeightMissing)}
            />
            <MetricCard
              hint={summary.vappKias.reason ?? "Recommended approach target derived from VREF."}
              label="VAPP"
              status={summary.vappKias.status}
              value={landingMetricValue(summary.vappKias, grossWeightMissing)}
            />
            <MetricCard
              hint={summary.landingDistanceFt.reason}
              label="Landing Distance"
              status={summary.landingDistanceFt.status}
              value={landingMetricValue(summary.landingDistanceFt, distanceMissing)}
            />
          </MetricGrid>

          <details className={styles.goAround}>
            <summary>Go-around reference</summary>
            <div className={styles.goAroundHeader}>
              <span>Certification climb references</span>
              <span>Source-backed</span>
            </div>
            <MetricGrid columns={2}>
              <MetricCard
                hint="Two-engine balked landing climb reference."
                label="Landing Climb Speed"
                status={summary.landingClimbSpeed.status}
                value={landingMetricValue(summary.landingClimbSpeed, grossWeightMissing)}
              />
              <MetricCard
                hint="Single-engine missed approach climb reference."
                label="Approach Climb Speed"
                status={summary.approachClimbSpeed.status}
                value={landingMetricValue(summary.approachClimbSpeed, grossWeightMissing)}
              />
            </MetricGrid>
            <div className={styles.goAroundNotes}>
              <div>
                <span>Landing Climb Speed</span>
                <InfoTip
                  id="landing-climb-speed-tooltip"
                  label="Landing climb speed information"
                >
                  Balked landing climb speed. Required for two-engine balked landing climb gradient per FAR 25.119. Equal to VREF at all published weights.
                </InfoTip>
              </div>
              <div>
                <span>Approach Climb Speed</span>
                <InfoTip
                  id="approach-climb-speed-tooltip"
                  label="Approach climb speed information"
                >
                  Missed approach climb speed. Required for single-engine missed approach climb gradient per FAR 25.121. Published separately from VREF.
                </InfoTip>
              </div>
            </div>
          </details>

          <p className={styles.legalDisclaimer}>
            Sources: available training material. Not approved for operational use. Landing-distance values are the published factored source values for the encoded configuration. VAPP is a training recommendation derived from VREF and must not replace approved operator or aircraft guidance. Always verify current aircraft configuration, weather, runway data, NOTAMs and approved performance documentation before flight.
          </p>
        </section>
      </div>
    </section>
  );
}

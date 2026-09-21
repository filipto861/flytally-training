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
import { formatPilotTakeoffMetric } from "@/lib/pilot-takeoff-calculator";
import type { PerformanceDataset } from "@/lib/universal-aircraft-content";

import styles from "./pilot-landing-calculator.module.css";

function numberFromInput(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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
    summary.landingClimbSpeed,
    summary.approachClimbSpeed,
    summary.landingDistanceFt,
  ];
  const hasOutOfRange = sourceResults.some((result) => result.status === "out-of-range");
  const hasUnavailable = sourceResults.some((result) => result.status === "unavailable");

  return (
    <section className={styles.calculator} aria-label="Landing Calculator">
      <header className={styles.header}>
        <div>
          <h2>Landing Calculator</h2>
          <p>Enter landing conditions. Results update from the encoded source grids.</p>
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
            <h3 className={styles.resultsTitle}>Landing result</h3>
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
              hint={summary.landingClimbSpeed.reason}
              label="Landing Climb"
              status={summary.landingClimbSpeed.status}
              value={formatPilotTakeoffMetric(summary.landingClimbSpeed)}
            />
            <MetricCard
              hint={summary.approachClimbSpeed.reason}
              label="Approach Climb"
              status={summary.approachClimbSpeed.status}
              value={formatPilotTakeoffMetric(summary.approachClimbSpeed)}
            />
            <MetricCard
              hint={summary.landingDistanceFt.reason}
              label="Landing Distance"
              status={summary.landingDistanceFt.status}
              value={formatPilotTakeoffMetric(summary.landingDistanceFt)}
            />
          </MetricGrid>

          <p className={styles.legalDisclaimer}>
            Sources: available training material. Not approved for operational use. Landing-distance values are the published factored source values for the encoded configuration. Always verify current aircraft configuration, weather, runway data, NOTAMs and approved performance documentation before flight.
          </p>
        </section>
      </div>
    </section>
  );
}

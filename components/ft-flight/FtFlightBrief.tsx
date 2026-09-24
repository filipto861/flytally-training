"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { withVariantQuery } from "@/lib/aircraft-applicability";
import type { ActiveFlight } from "@/lib/active-flight/types";
import type { PilotTakeoffCalculatorDefinition } from "@/lib/pilot-takeoff-calculator";
import type { PerformanceDataset } from "@/lib/universal-aircraft-content";
import { FtPerformanceStrip } from "@/components/ft-performance/FtPerformanceStrip";
import { usePerformanceOperation } from "@/components/ft-performance/use-performance-operation";

import { FtPerformanceEditorSheet } from "./FtPerformanceEditorSheet";
import styles from "./ft-flight.module.css";

export function FtFlightBrief({
  aircraftId,
  activeFlight,
  selectedVariant,
  datasets,
  takeoffCalculator,
}: Readonly<{
  aircraftId: string;
  activeFlight?: ActiveFlight | null;
  selectedVariant?: string;
  datasets: readonly PerformanceDataset[];
  takeoffCalculator?: PilotTakeoffCalculatorDefinition;
}>) {
  const operation = usePerformanceOperation("TAKEOFF", {
    aircraftId,
    activeFlight,
    selectedVariant,
    datasets,
    takeoffCalculator,
  });
  const [editorOpen, setEditorOpen] = useState(false);
  const editorTriggerRef = useRef<HTMLButtonElement>(null);

  const current = operation.currentFlight;
  const hasActiveFlight = Boolean(current);
  const result = operation.result;
  const runway = result?.context.runway.identifier || operation.runwayIdentifier || null;

  const validity =
    !operation.hydrated
      ? "LOADING"
      : !current
        ? "NO ACTIVE FLIGHT"
        : !result
          ? "NOT CALCULATED"
          : operation.stale
            ? "RECALCULATE"
            : "CURRENT";

  const openEditor = useCallback(() => {
    setEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    window.requestAnimationFrame(() => editorTriggerRef.current?.focus());
  }, []);

  const editorActionLabel =
    !result
      ? "Calculate Takeoff"
      : operation.stale
        ? "Review & recalculate"
        : "Edit Performance";

  return (
    <section
      className={styles.brief}
      aria-label="Flight Brief"
      data-flight-context={hasActiveFlight ? "active" : "none"}
      data-efb-home="true"
    >
      <div className={styles.briefHeader}>
        <p className={styles.eyebrow}>BRIEFING</p>
        <h2>Operational brief</h2>
      </div>

      <section
        className={`${styles.briefSection} ${styles.takeoffBriefCard}`}
        aria-label="Takeoff performance brief"
        data-performance-validity={validity.toLowerCase().replaceAll(" ", "-")}
      >
        <header className={styles.takeoffBriefHeader}>
          <div>
            <p className={styles.eyebrow}>TAKEOFF</p>
            <h3>{current ? `${current.departure.icao} departure` : "Departure performance"}</h3>
          </div>
          <div className={styles.takeoffBriefStatus}>
            <span
              className={operation.stale ? styles.statusBadgeStale : styles.statusBadge}
              data-performance-status="true"
            >
              {validity}
            </span>
            <span className={styles.runwayBadge}>
              {runway ? `RWY ${runway}` : "RUNWAY NOT SET"}
            </span>
          </div>
        </header>

        {result ? (
          <FtPerformanceStrip result={result} stale={operation.stale} />
        ) : (
          <div className={styles.takeoffBriefEmpty}>
            <strong>No Takeoff calculation yet</strong>
            <span>
              {hasActiveFlight
                ? "Open the shared Performance editor to select runway, weather and configuration."
                : "Start an Active Flight before calculating Takeoff performance."}
            </span>
          </div>
        )}

        {operation.newerWeatherAvailable ? (
          <p className={styles.takeoffWeatherNotice}>NEWER WEATHER AVAILABLE</p>
        ) : null}

        <div className={styles.takeoffBriefActions}>
          {hasActiveFlight ? (
            <button
              ref={editorTriggerRef}
              type="button"
              className={styles.primaryAction}
              onClick={openEditor}
            >
              {editorActionLabel}
            </button>
          ) : (
            <Link
              className={styles.primaryAction}
              href={withVariantQuery(`/aircraft/${aircraftId}/flight`, selectedVariant)}
            >
              Start active flight
            </Link>
          )}

          <Link
            className={styles.secondaryAction}
            href={withVariantQuery(`/aircraft/${aircraftId}/performance`, selectedVariant)}
          >
            Open full Performance
          </Link>
        </div>
      </section>

      <section className={styles.briefSection} aria-labelledby="ft-brief-considerations" data-empty="true">
        <h3 id="ft-brief-considerations">Flight Considerations</h3>
        <p className={styles.emptyState}>
          {hasActiveFlight ? "No considerations yet." : "No active flight."}
        </p>
      </section>

      <section className={styles.briefSection} aria-labelledby="ft-brief-procedures" data-empty="true">
        <h3 id="ft-brief-procedures">Relevant Procedures</h3>
        <p className={styles.emptyState}>
          {hasActiveFlight ? "No relevant procedures yet." : "No active flight."}
        </p>
      </section>

      <FtPerformanceEditorSheet
        aircraftId={aircraftId}
        operation={operation}
        takeoffCalculator={takeoffCalculator}
        open={editorOpen}
        onClose={closeEditor}
      />
    </section>
  );
}

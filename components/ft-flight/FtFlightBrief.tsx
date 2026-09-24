"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { withVariantQuery } from "@/lib/aircraft-applicability";
import type { ActiveFlight } from "@/lib/active-flight/types";
import type { PilotLandingCalculatorDefinition } from "@/lib/pilot-landing-calculator";
import type { PilotTakeoffCalculatorDefinition } from "@/lib/pilot-takeoff-calculator";
import type { PerformanceDataset } from "@/lib/universal-aircraft-content";
import { FtLandingPerformanceStrip } from "@/components/ft-performance/FtLandingPerformanceStrip";
import { FtPerformanceStrip } from "@/components/ft-performance/FtPerformanceStrip";
import { useLandingPerformanceOperation } from "@/components/ft-performance/use-landing-performance-operation";
import { usePerformanceOperation } from "@/components/ft-performance/use-performance-operation";

import { FtPerformanceEditorSheet } from "./FtPerformanceEditorSheet";
import styles from "./ft-flight.module.css";

type EditorKind = "TAKEOFF" | "LANDING" | null;

function validityLabel(
  hydrated: boolean,
  hasFlight: boolean,
  hasResult: boolean,
  stale: boolean,
): string {
  if (!hydrated) return "LOADING";
  if (!hasFlight) return "NO ACTIVE FLIGHT";
  if (!hasResult) return "NOT CALCULATED";
  return stale ? "RECALCULATE" : "CURRENT";
}

export function FtFlightBrief({
  aircraftId,
  activeFlight,
  selectedVariant,
  datasets,
  takeoffCalculator,
  landingCalculator,
}: Readonly<{
  aircraftId: string;
  activeFlight?: ActiveFlight | null;
  selectedVariant?: string;
  datasets: readonly PerformanceDataset[];
  takeoffCalculator?: PilotTakeoffCalculatorDefinition;
  landingCalculator?: PilotLandingCalculatorDefinition;
}>) {
  const operation = usePerformanceOperation("TAKEOFF", {
    aircraftId,
    activeFlight,
    selectedVariant,
    datasets,
    takeoffCalculator,
  });
  const landingOperation = useLandingPerformanceOperation({
    aircraftId,
    activeFlight,
    selectedVariant,
    datasets,
    landingCalculator,
  });

  const [editorKind, setEditorKind] = useState<EditorKind>(null);
  const takeoffEditorTriggerRef = useRef<HTMLButtonElement>(null);
  const landingEditorTriggerRef = useRef<HTMLButtonElement>(null);

  const current = operation.currentFlight;
  const hasActiveFlight = Boolean(current);
  const result = operation.result;
  const runway = result?.context.runway.identifier || operation.runwayIdentifier || null;
  const validity = validityLabel(
    operation.hydrated,
    hasActiveFlight,
    Boolean(result),
    operation.stale,
  );

  const landingResult = landingOperation.result;
  const landingRunway =
    landingResult?.context.runway.identifier
    || landingOperation.runwayIdentifier
    || null;
  const landingValidity = validityLabel(
    landingOperation.hydrated,
    hasActiveFlight,
    Boolean(landingResult),
    landingOperation.stale,
  );

  const closeEditor = useCallback(() => {
    setEditorKind((currentKind) => {
      window.requestAnimationFrame(() => {
        if (currentKind === "LANDING") {
          landingEditorTriggerRef.current?.focus();
        } else {
          takeoffEditorTriggerRef.current?.focus();
        }
      });
      return null;
    });
  }, []);

  const editorActionLabel =
    !result
      ? "Calculate Takeoff"
      : operation.stale
        ? "Review & recalculate"
        : "Edit Performance";

  const landingEditorActionLabel =
    !landingResult
      ? "Calculate Landing"
      : landingOperation.stale
        ? "Review & recalculate"
        : "Edit Landing";

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
              ref={takeoffEditorTriggerRef}
              type="button"
              className={styles.primaryAction}
              onClick={() => setEditorKind("TAKEOFF")}
            >
              {editorActionLabel}
            </button>
          ) : (
            <Link className={styles.primaryAction} href="#ft-active-flight">
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

      {landingCalculator ? (
        <section
          className={`${styles.briefSection} ${styles.landingBriefCard}`}
          aria-label="Landing performance brief"
          data-performance-validity={landingValidity.toLowerCase().replaceAll(" ", "-")}
        >
          <header className={styles.takeoffBriefHeader}>
            <div>
              <p className={styles.eyebrow}>LANDING</p>
              <h3>{current ? `${current.destination.icao} arrival` : "Arrival performance"}</h3>
            </div>
            <div className={styles.takeoffBriefStatus}>
              <span
                className={landingOperation.stale ? styles.statusBadgeStale : styles.statusBadge}
                data-performance-status="true"
              >
                {landingValidity}
              </span>
              <span className={styles.runwayBadge}>
                {landingRunway ? `RWY ${landingRunway}` : "RUNWAY NOT SET"}
              </span>
            </div>
          </header>

          {landingResult ? (
            <FtLandingPerformanceStrip
              result={landingResult}
              stale={landingOperation.stale}
            />
          ) : (
            <div className={styles.takeoffBriefEmpty}>
              <strong>No Landing calculation yet</strong>
              <span>
                {hasActiveFlight
                  ? "Use the shared Landing editor for destination runway, landing weight and arrival weather."
                  : "Start an Active Flight before calculating Landing performance."}
              </span>
            </div>
          )}

          {landingOperation.newerWeatherAvailable ? (
            <p className={styles.takeoffWeatherNotice}>NEWER WEATHER AVAILABLE</p>
          ) : null}

          <div className={styles.takeoffBriefActions}>
            {hasActiveFlight ? (
              <button
                ref={landingEditorTriggerRef}
                type="button"
                className={styles.primaryAction}
                onClick={() => setEditorKind("LANDING")}
              >
                {landingEditorActionLabel}
              </button>
            ) : (
              <Link className={styles.primaryAction} href="#ft-active-flight">
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
      ) : null}

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

      {editorKind === "TAKEOFF" ? (
        <FtPerformanceEditorSheet
          aircraftId={aircraftId}
          kind="TAKEOFF"
          operation={operation}
          takeoffCalculator={takeoffCalculator}
          open
          onClose={closeEditor}
        />
      ) : editorKind === "LANDING" ? (
        <FtPerformanceEditorSheet
          aircraftId={aircraftId}
          kind="LANDING"
          operation={landingOperation}
          landingCalculator={landingCalculator}
          open
          onClose={closeEditor}
        />
      ) : null}
    </section>
  );
}

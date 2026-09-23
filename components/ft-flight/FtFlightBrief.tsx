"use client";

import type { ActiveFlight } from "@/lib/active-flight/types";
import type { PilotTakeoffCalculatorDefinition } from "@/lib/pilot-takeoff-calculator";
import type { PerformanceDataset } from "@/lib/universal-aircraft-content";
import { FtPerformancePresentation } from "@/components/ft-performance/FtPerformancePresentation";
import { useActiveFlightState } from "./use-active-flight";

import styles from "./ft-flight.module.css";

export function FtFlightBrief({
  aircraftId,
  activeFlight,
  datasets,
  takeoffCalculator,
}: Readonly<{
  aircraftId: string;
  activeFlight?: ActiveFlight | null;
  datasets: readonly PerformanceDataset[];
  takeoffCalculator?: PilotTakeoffCalculatorDefinition;
}>) {
  const { flight } = useActiveFlightState(aircraftId, activeFlight);
  const hasActiveFlight = flight?.lifecycle === "ACTIVE";

  return (
    <section
      className={styles.brief}
      aria-labelledby="ft-flight-brief"
      data-flight-context={hasActiveFlight ? "active" : "none"}
    >
      <div className={styles.briefHeader}>
        <p className={styles.eyebrow}>FLIGHT BRIEF</p>
        <h2 id="ft-flight-brief">Flight Brief</h2>
      </div>

      <div className={styles.briefSection}>
        <h3>Performance</h3>
        <FtPerformancePresentation
          aircraftId={aircraftId}
          activeFlight={activeFlight}
          datasets={datasets}
          takeoffCalculator={takeoffCalculator}
          view="brief"
        />
      </div>

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
    </section>
  );
}

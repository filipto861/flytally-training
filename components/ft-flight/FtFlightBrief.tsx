"use client";

import type { ActiveFlight } from "@/lib/active-flight/types";
import { useActiveFlightState } from "./use-active-flight";

import styles from "./ft-flight.module.css";

const performanceMetrics = ["N1", "V1", "VR", "V2"] as const;

export function FtFlightBrief({
  aircraftId,
  activeFlight,
}: Readonly<{
  aircraftId: string;
  activeFlight?: ActiveFlight | null;
}>) {
  const { flight } = useActiveFlightState(aircraftId, activeFlight);
  const hasActiveFlight = flight?.lifecycle === "ACTIVE";
  const emptyCopy = hasActiveFlight ? "No data yet" : "No active flight";

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

      <section className={styles.briefSection} aria-labelledby="ft-brief-performance" data-empty="true">
        <h3 id="ft-brief-performance">Performance</h3>
        <div className={styles.performanceGrid}>
          {performanceMetrics.map((metric) => (
            <div key={metric} className={styles.performanceItem}>
              <span className={styles.performanceLabel}>{metric}</span>
              <strong aria-hidden="true">—</strong>
              <span className={styles.performanceEmpty}>{emptyCopy}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.briefSection} aria-labelledby="ft-brief-considerations" data-empty="true">
        <h3 id="ft-brief-considerations">Flight Considerations</h3>
        <p className={styles.emptyState}>
          {hasActiveFlight ? "No considerations yet." : "No active flight."}
        </p>
      </section>

      <section className={styles.briefSection} aria-labelledby="ft-brief-recommendations" data-empty="true">
        <h3 id="ft-brief-recommendations">Training Recommendations</h3>
        <p className={styles.emptyState}>
          {hasActiveFlight ? "No recommendations yet." : "No active flight."}
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

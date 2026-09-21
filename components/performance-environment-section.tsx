"use client";

import type { SelectedRunwayContext } from "@/lib/aviation/airport-types";
import type { MetarSnapshot } from "@/lib/weather/metar-types";

import { AirportRunwaySelector } from "./airport-runway-selector";
import { EnvironmentContextPanel } from "./environment-context-panel";
import { MetarStatus } from "./metar-status";

import styles from "./performance-environment-section.module.css";

export interface PerformanceEnvironmentSectionProps {
  readonly icao: string | null;
  readonly onIcaoChange: (icao: string | null) => void;
  readonly runwayContext?: SelectedRunwayContext;
  readonly onRunwayContextChange: (context: SelectedRunwayContext | undefined) => void;
  readonly metarSnapshot: MetarSnapshot | null;
  readonly onMetarApply: (snapshot: MetarSnapshot) => void;
  readonly onMetarSnapshot?: (snapshot: MetarSnapshot) => void;
}

export function PerformanceEnvironmentSection({
  icao,
  onIcaoChange,
  runwayContext,
  onRunwayContextChange,
  metarSnapshot,
  onMetarApply,
  onMetarSnapshot,
}: PerformanceEnvironmentSectionProps) {
  return (
    <section className={styles.section} aria-label="Performance environment">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Shared context</span>
          <h2>Environment</h2>
        </div>
        <p>Choose the airport and runway once. Weather and runway context are shared by both calculators.</p>
      </header>

      <div className={styles.topGrid}>
        <div className={styles.metarSlot}>
          {icao ? (
            <MetarStatus
              icao={icao}
              onApply={onMetarApply}
              onSnapshot={onMetarSnapshot ?? onMetarApply}
            />
          ) : (
            <div className={styles.metarPlaceholder}>
              <strong>METAR</strong>
              <span>Select an airport to load current weather.</span>
            </div>
          )}
        </div>

        <div className={styles.airportSlot}>
          <AirportRunwaySelector
            onAirportChange={onIcaoChange}
            onChange={onRunwayContextChange}
          />
        </div>
      </div>

      <div className={styles.contextSlot}>
        <EnvironmentContextPanel
          runwayContext={runwayContext}
          metarSnapshot={metarSnapshot}
        />
      </div>

      <p className={styles.baselineWarning}>
        Distances shown in the calculators are baseline values. Wind and runway slope are context only; apply the applicable approved performance corrections manually.
      </p>
    </section>
  );
}

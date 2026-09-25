"use client";

import { useMemo, useState } from "react";

import type {
  OperationalChecklist as OperationalChecklistData,
  OperationalEmergencyContent,
  OperationalPerformanceDataset,
} from "@/lib/operational-flight-data";
import { OfflineFlightBootstrap } from "./offline-flight-bootstrap";
import { OperationalChecklist } from "./operational-checklist";
import { OperationalEmergency } from "./operational-emergency";
import { OperationalPerformance } from "./operational-performance";
import styles from "./flight-deck.module.css";

type FlightView = "checklist" | "performance" | "emergency";

export function FlightDeck({
  aircraftId,
  aircraftName,
  checklist,
  performanceDatasets,
  emergency,
  selectedVariant,
}: Readonly<{
  aircraftId: string;
  aircraftName: string;
  checklist?: OperationalChecklistData;
  performanceDatasets: readonly OperationalPerformanceDataset[];
  emergency?: OperationalEmergencyContent;
  selectedVariant?: string;
}>) {
  const available = useMemo(() => [
    checklist ? "checklist" as const : undefined,
    performanceDatasets.length ? "performance" as const : undefined,
    emergency?.scenarios.length ? "emergency" as const : undefined,
  ].filter((value): value is FlightView => Boolean(value)), [checklist, performanceDatasets.length, emergency?.scenarios.length]);
  const [view, setView] = useState<FlightView>(available[0] ?? "checklist");
  const active = available.includes(view) ? view : available[0];

  const tabLabel = (item: FlightView) => item === "checklist" ? "Checklist" : item === "performance" ? "Performance" : "Emergency";
  const tabClass = (item: FlightView) => {
    if (item === "emergency") return active === item ? `${styles.emergencyTab} ${styles.activeEmergencyTab}` : styles.emergencyTab;
    return active === item ? styles.activeTab : undefined;
  };

  return (
    <section className={styles.deck} aria-label={`${aircraftName} flight deck`}>
      <header className={styles.header}>
        <div>
          <span>FLY</span>
          <strong>{aircraftName}</strong>
        </div>
        <OfflineFlightBootstrap />
      </header>

      {available.length > 1 ? <nav className={styles.tabs} data-tab-count={available.length} aria-label="Flight tools">
        {available.map((item) => <button
          aria-label={item === "emergency" ? "Emergency quick reference" : undefined}
          aria-pressed={active === item}
          className={tabClass(item)}
          key={item}
          onClick={() => setView(item)}
          type="button"
        >{tabLabel(item)}</button>)}
      </nav> : null}

      <div className={styles.content}>
        {!available.length ? (
          <section className={styles.emptyState} role="status">
            <strong>Flight Deck data unavailable</strong>
            <p>No source-authoritative operational module is available for this aircraft configuration yet.</p>
          </section>
        ) : null}
        {active === "checklist" && checklist
          ? <OperationalChecklist checklist={checklist} selectedVariant={selectedVariant} />
          : null}
        {active === "performance" && performanceDatasets.length
          ? <OperationalPerformance aircraftId={aircraftId} datasets={performanceDatasets} selectedVariant={selectedVariant} />
          : null}
        {active === "emergency" && emergency?.scenarios.length
          ? <OperationalEmergency emergency={emergency} />
          : null}
      </div>
    </section>
  );
}

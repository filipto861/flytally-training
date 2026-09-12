"use client";

import { useMemo, useState } from "react";

import type { RuntimeChecklist } from "@/lib/checklist-runtime";
import type { PerformanceDataset } from "@/lib/universal-aircraft-content";
import { OfflineFlightBootstrap } from "./offline-flight-bootstrap";
import { OperationalChecklist } from "./operational-checklist";
import { OperationalPerformance } from "./operational-performance";
import styles from "./flight-deck.module.css";

type FlightView = "checklist" | "performance";

export function FlightDeck({
  aircraftId,
  aircraftName,
  checklist,
  performanceDatasets,
  selectedVariant,
}: Readonly<{
  aircraftId: string;
  aircraftName: string;
  checklist?: RuntimeChecklist;
  performanceDatasets: readonly PerformanceDataset[];
  selectedVariant?: string;
}>) {
  const available = useMemo(() => [
    checklist ? "checklist" as const : undefined,
    performanceDatasets.length ? "performance" as const : undefined,
  ].filter((value): value is FlightView => Boolean(value)), [checklist, performanceDatasets.length]);
  const [view, setView] = useState<FlightView>(available[0] ?? "checklist");
  const active = available.includes(view) ? view : available[0];

  return (
    <section className={styles.deck} aria-label={`${aircraftName} flight deck`}>
      <header className={styles.header}>
        <div>
          <span>FLY</span>
          <strong>{aircraftName}</strong>
        </div>
        <OfflineFlightBootstrap />
      </header>

      {available.length > 1 ? <nav className={styles.tabs} aria-label="Flight tools">
        {available.map((item) => <button
          aria-pressed={active === item}
          className={active === item ? styles.activeTab : undefined}
          key={item}
          onClick={() => setView(item)}
          type="button"
        >{item === "checklist" ? "Checklist" : "Performance"}</button>)}
      </nav> : null}

      <div className={styles.content}>
        {active === "checklist" && checklist
          ? <OperationalChecklist checklist={checklist} selectedVariant={selectedVariant} />
          : null}
        {active === "performance" && performanceDatasets.length
          ? <OperationalPerformance aircraftId={aircraftId} datasets={performanceDatasets} selectedVariant={selectedVariant} />
          : null}
      </div>
    </section>
  );
}

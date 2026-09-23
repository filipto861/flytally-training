"use client";

import { usePathname } from "next/navigation";

import { useFtFastPath } from "@/components/ft-fast-path/FtFastPathProvider";
import { getAircraftProductModeForPathname } from "@/lib/aircraft-content-ia";

import { ftFastPathDestinations } from "./navigation";
import styles from "./ft-shell.module.css";

const iconFor = (key: string) =>
  key === "checklist" ? "✓" : key === "qrh" ? "!" : key === "perf" ? "↗" : "≡";

export function FtFastPathRail({ aircraftId }: Readonly<{ aircraftId: string }>) {
  const pathname = usePathname();
  const { activeTab, panelOpen, openPanel, shortcutsReady } = useFtFastPath();

  if (getAircraftProductModeForPathname(pathname, aircraftId) !== "efb") {
    return null;
  }

  return (
    <nav
      className={styles.fastPathRail}
      aria-label="Operational fast path"
      data-shortcuts-ready={shortcutsReady ? "true" : "false"}
    >
      {ftFastPathDestinations(aircraftId).map((destination) => (
        <button
          key={destination.key}
          type="button"
          className={styles.fastPathLink}
          aria-pressed={panelOpen && activeTab === destination.key}
          onClick={() => openPanel(destination.key)}
        >
          <span className={styles.fastPathIcon} aria-hidden="true">
            {iconFor(destination.key)}
          </span>
          <span>{destination.label}</span>
        </button>
      ))}
    </nav>
  );
}

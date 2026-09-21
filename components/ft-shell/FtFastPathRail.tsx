"use client";

import { ftFastPathDestinations } from "./navigation";
import { useFtFastPath } from "@/components/ft-fast-path/FtFastPathProvider";
import styles from "./ft-shell.module.css";

export function FtFastPathRail({ aircraftId }: Readonly<{ aircraftId: string }>) {
  const { activeTab, panelOpen, openPanel, shortcutsReady } = useFtFastPath();

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
          {destination.label}
        </button>
      ))}
    </nav>
  );
}

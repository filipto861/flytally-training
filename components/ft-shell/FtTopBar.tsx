import type { ReactNode } from "react";

import styles from "./ft-shell.module.css";

export function FtTopBar({
  aircraftIdentity,
  trainingProfileLabel,
  navigationControl,
}: Readonly<{
  aircraftIdentity: string;
  trainingProfileLabel: string;
  navigationControl: ReactNode;
}>) {
  return (
    <header className={styles.topBar}>
      <div className={styles.topBarNavControl}>{navigationControl}</div>

      <div className={styles.aircraftIdentity}>
        <strong>{aircraftIdentity}</strong>
        <span>Training profile: {trainingProfileLabel}</span>
      </div>

      <div className={styles.topBarActions}>
        <button
          type="button"
          className={styles.searchTrigger}
          aria-label="Search aircraft workspace"
          disabled
        >
          SEARCH
        </button>
        <span className={styles.flightPlaceholder} aria-label="Active flight status">
          ACTIVE FLIGHT · NONE
        </span>
      </div>
    </header>
  );
}

import type { ReactNode } from "react";

import { FtSearchOverlay } from "@/components/ft-search/FtSearchOverlay";

import styles from "./ft-shell.module.css";

export function FtTopBar({
  aircraftId,
  aircraftIdentity,
  trainingProfileLabel,
  navigationControl,
}: Readonly<{
  aircraftId: string;
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
        <FtSearchOverlay aircraftId={aircraftId} aircraftIdentity={aircraftIdentity} />
        <span className={styles.flightPlaceholder} aria-label="Active flight status">
          ACTIVE FLIGHT · NONE
        </span>
      </div>
    </header>
  );
}

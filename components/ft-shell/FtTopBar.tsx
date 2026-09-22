import type { ReactNode } from "react";

import type { ActiveFlight } from "@/lib/active-flight/types";

import { FtFastPathIndicator } from "@/components/ft-fast-path/FtFastPathIndicator";
import { FtSearchOverlay } from "@/components/ft-search/FtSearchOverlay";

import styles from "./ft-shell.module.css";

export function FtTopBar({
  aircraftId,
  aircraftIdentity,
  trainingProfileLabel,
  activeFlight,
  navigationControl,
}: Readonly<{
  aircraftId: string;
  aircraftIdentity: string;
  trainingProfileLabel: string;
  activeFlight?: ActiveFlight | null;
  navigationControl: ReactNode;
}>) {
  const current = activeFlight?.lifecycle === "ACTIVE" ? activeFlight : null;
  const flightStatus = current
    ? `ACTIVE FLIGHT · ${current.departure.icao} → ${current.destination.icao}`
    : "ACTIVE FLIGHT · NONE";

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarNavControl}>{navigationControl}</div>

      <div className={styles.aircraftIdentity}>
        <strong>{aircraftIdentity}</strong>
        <span>Training profile: {trainingProfileLabel}</span>
      </div>

      <div className={styles.topBarActions}>
        <FtSearchOverlay aircraftId={aircraftId} aircraftIdentity={aircraftIdentity} />
        <FtFastPathIndicator />
        <span className={styles.flightPlaceholder} aria-label="Active flight status">
          {flightStatus}
        </span>
      </div>
    </header>
  );
}

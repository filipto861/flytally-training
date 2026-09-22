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
    ? `${current.departure.icao} -> ${current.destination.icao}`
    : "No active flight";

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarNavControl}>{navigationControl}</div>

      <div className={styles.aircraftIdentity}>
        <span className={styles.aircraftEyebrow}>AIRCRAFT</span>
        <div className={styles.aircraftIdentityLine}>
          <strong>{aircraftIdentity}</strong>
          <span className={styles.profile}>Training profile: {trainingProfileLabel}</span>
        </div>
      </div>

      <div className={styles.topBarActions}>
        <FtSearchOverlay aircraftId={aircraftId} aircraftIdentity={aircraftIdentity} />
        <FtFastPathIndicator />
        <span
          className={styles.flightPlaceholder}
          aria-label={current ? `Active flight ${flightStatus}` : "Active flight status: none"}
        >
          <span className={current ? styles.flightDotActive : styles.flightDot} aria-hidden="true" />
          {flightStatus}
        </span>
      </div>
    </header>
  );
}

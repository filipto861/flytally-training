"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import type { ActiveFlight } from "@/lib/active-flight/types";
import { getAircraftProductModeForPathname } from "@/lib/aircraft-product-mode";

import { FtFastPathIndicator } from "@/components/ft-fast-path/FtFastPathIndicator";
import { FtSearchOverlay } from "@/components/ft-search/FtSearchOverlay";

import styles from "./ft-shell.module.css";

export function FtTopBar({
  aircraftId,
  aircraftIdentity,
  aircraftProfileLabel,
  activeFlight,
  navigationControl,
}: Readonly<{
  aircraftId: string;
  aircraftIdentity: string;
  aircraftProfileLabel: string;
  activeFlight?: ActiveFlight | null;
  navigationControl: ReactNode;
}>) {
  const pathname = usePathname();
  const mode = getAircraftProductModeForPathname(pathname, aircraftId);
  const current = activeFlight?.lifecycle === "ACTIVE" ? activeFlight : null;

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarNavControl}>{navigationControl}</div>

      <div className={styles.aircraftIdentity}>
        <span className={styles.aircraftEyebrow}>
          {mode === "efb" ? "EFB" : mode === "learn" ? "LEARN" : "AIRCRAFT"}
        </span>
        <strong>{aircraftIdentity}</strong>
        <span
          className={styles.aircraftProfile}
          aria-label={"Aircraft profile: " + aircraftProfileLabel}
        >
          {aircraftProfileLabel}
        </span>
      </div>

      <div className={styles.topBarActions}>
        {mode !== "efb" ? (
          <FtSearchOverlay
            aircraftId={aircraftId}
            aircraftIdentity={aircraftIdentity}
            scope={mode === "learn" ? "learn" : "all"}
          />
        ) : null}
        {mode === "efb" ? <FtFastPathIndicator /> : null}
        {mode === "efb" ? (
          <span
            className={current ? styles.flightActive : styles.flightInactive}
            aria-label="Active flight status"
          >
            <span className={styles.flightStatusDot} aria-hidden="true" />
            {current ? (
              <>
                <span className={styles.flightStatusLabel}>Active flight</span>
                <strong>{current.departure.icao} → {current.destination.icao}</strong>
              </>
            ) : (
              <span className={styles.flightStatusLabel}>No active flight</span>
            )}
          </span>
        ) : null}
      </div>
    </header>
  );
}

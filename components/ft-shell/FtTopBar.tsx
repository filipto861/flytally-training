"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import type { ActiveFlight } from "@/lib/active-flight/types";
import {
  aircraftModeHref,
  getAircraftProductModeForPathname,
} from "@/lib/aircraft-content-ia";

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
  const pathname = usePathname();
  const mode = getAircraftProductModeForPathname(pathname, aircraftId);
  const current = activeFlight?.lifecycle === "ACTIVE" ? activeFlight : null;

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarNavControl}>{navigationControl}</div>

      <div className={styles.aircraftIdentity}>
        <span className={styles.aircraftEyebrow}>AIRCRAFT</span>
        <strong>{aircraftIdentity}</strong>
        <span
          className={styles.aircraftProfile}
          aria-label={"Training profile: " + trainingProfileLabel}
        >
          {trainingProfileLabel}
        </span>
      </div>

      <div className={styles.topBarActions}>
        {mode ? (
          <nav className={styles.modeSwitcher} aria-label="Workspace mode">
            <Link
              href={aircraftModeHref(aircraftId, "learn")}
              aria-current={mode === "learn" ? "page" : undefined}
            >
              LEARN
            </Link>
            <Link
              href={aircraftModeHref(aircraftId, "efb")}
              aria-current={mode === "efb" ? "page" : undefined}
            >
              EFB
            </Link>
          </nav>
        ) : null}

        {mode === "learn" ? (
          <FtSearchOverlay aircraftId={aircraftId} aircraftIdentity={aircraftIdentity} />
        ) : null}

        {mode === "efb" ? (
          <>
            <FtFastPathIndicator />
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
          </>
        ) : null}
      </div>
    </header>
  );
}

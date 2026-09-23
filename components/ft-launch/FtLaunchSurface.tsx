import Link from "next/link";

import type { ActiveFlight } from "@/lib/active-flight/types";
import { withVariantQuery } from "@/lib/aircraft-applicability";
import type { PersistedTrainingProgressEvent } from "@/lib/progress-events";

import { FtRecent, type FtRecentItem } from "./FtRecent";
import styles from "./ft-launch.module.css";

export function FtLaunchSurface({
  aircraftId,
  aircraftName,
  selectedVariant,
  latestTraining,
  activeFlight,
  recentItems = [],
}: Readonly<{
  aircraftId: string;
  aircraftName: string;
  selectedVariant?: string;
  latestTraining?: PersistedTrainingProgressEvent;
  activeFlight?: ActiveFlight | null;
  recentItems?: readonly FtRecentItem[];
}>) {
  const currentFlight = activeFlight?.lifecycle === "ACTIVE" ? activeFlight : null;

  return (
    <main
      className={styles.launchSurface}
      aria-label="Aircraft mode chooser"
      data-ft-launch="true"
    >
      <header className={styles.launchHeader}>
        <p className={styles.eyebrow}>CHOOSE MODE</p>
        <h1>{aircraftName}</h1>
        <p className={styles.launchIntro}>
          Choose whether you are studying the aircraft or using operational flight tools.
        </p>
      </header>

      <div className={styles.modeGrid}>
        <section className={styles.modeCard} aria-label="Learn mode">
          <div className={styles.modeCopy}>
            <p className={styles.modeLabel}>LEARN</p>
            <h2>Learn the aircraft</h2>
            <p>
              Systems, procedures, limitations, reference material and training.
              No Active Flight or operational performance state is shown in this mode.
            </p>
            <span className={styles.modeStatus}>
              {latestTraining ? "Training progress available" : "Start a new learning session"}
            </span>
          </div>
          <Link
            className={styles.primaryAction}
            href={withVariantQuery(`/aircraft/${aircraftId}/learn`, selectedVariant)}
          >
            Open Learn
          </Link>
        </section>

        <section className={styles.modeCard} aria-label="EFB mode">
          <div className={styles.modeCopy}>
            <p className={styles.modeLabel}>EFB / FLY</p>
            <h2>Operate the flight</h2>
            <p>
              Flight Brief, Performance and operational checklist/QRH tools for the current flight.
            </p>
            <span className={styles.modeStatus}>
              {currentFlight
                ? `${currentFlight.departure.icao} → ${currentFlight.destination.icao} · ACTIVE`
                : "No active flight"}
            </span>
          </div>
          <Link
            className={styles.primaryAction}
            href={withVariantQuery(`/aircraft/${aircraftId}/efb`, selectedVariant)}
          >
            {currentFlight ? "Open Flight Brief" : "Open EFB"}
          </Link>
        </section>
      </div>

      <FtRecent items={recentItems} />
    </main>
  );
}

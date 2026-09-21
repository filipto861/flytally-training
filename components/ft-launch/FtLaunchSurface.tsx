import type { ActiveFlight } from "@/lib/active-flight/types";
import type { PersistedTrainingProgressEvent } from "@/lib/progress-events";

import { FtContinueTraining } from "./FtContinueTraining";
import { FtFlightSection } from "./FtFlightSection";
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
  return (
    <main
      className={styles.launchSurface}
      aria-label="Aircraft launch surface"
      data-ft-launch="true"
    >
      <header className={styles.launchHeader}>
        <p className={styles.eyebrow}>AIRCRAFT</p>
        <h1>{aircraftName}</h1>
      </header>

      <FtContinueTraining
        aircraftId={aircraftId}
        selectedVariant={selectedVariant}
        latestTraining={latestTraining}
      />

      <div className={styles.secondaryGrid}>
        <FtFlightSection
          aircraftId={aircraftId}
          selectedVariant={selectedVariant}
          activeFlight={activeFlight}
        />
        <FtRecent items={recentItems} />
      </div>
    </main>
  );
}

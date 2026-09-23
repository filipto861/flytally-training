import Link from "next/link";

import { withVariantQuery } from "@/lib/aircraft-applicability";
import type { ActiveFlight } from "@/lib/active-flight/types";
import type { PersistedTrainingProgressEvent } from "@/lib/progress-events";

import styles from "./ft-mode-chooser.module.css";

export function FtModeChooser({
  aircraftId,
  aircraftName,
  selectedVariant,
  latestTraining,
  activeFlight,
}: Readonly<{
  aircraftId: string;
  aircraftName: string;
  selectedVariant?: string;
  latestTraining?: PersistedTrainingProgressEvent;
  activeFlight?: ActiveFlight | null;
}>) {
  const current = activeFlight?.lifecycle === "ACTIVE" ? activeFlight : null;

  return (
    <main className={styles.root} aria-labelledby="workspace-mode-title" data-ft-mode-chooser="true">
      <header className={styles.header}>
        <p className={styles.eyebrow}>AIRCRAFT WORKSPACE</p>
        <h1 id="workspace-mode-title">{aircraftName}</h1>
        <p>Choose what you are doing now. Learning and operational flight tools stay separate.</p>
      </header>

      <section className={styles.choices} aria-label="Choose workspace mode">
        <Link
          className={styles.choice}
          href={withVariantQuery(`/aircraft/${aircraftId}/learn`, selectedVariant)}
        >
          <span className={styles.choiceKicker}>LEARN</span>
          <strong>Study the aircraft</strong>
          <p>Systems, procedures, limitations, reference material, scenarios and progress.</p>
          <span className={styles.contextLine}>
            {latestTraining ? "Training progress available" : "Start or continue training"}
          </span>
          <span className={styles.action}>Open Learn →</span>
        </Link>

        <Link
          className={styles.choice}
          href={withVariantQuery(`/aircraft/${aircraftId}/efb`, selectedVariant)}
        >
          <span className={styles.choiceKicker}>EFB</span>
          <strong>Fly / prepare a flight</strong>
          <p>Flight Brief, Performance, operational Checklist and QRH.</p>
          <span className={styles.contextLine}>
            {current
              ? `Active flight · ${current.departure.icao} → ${current.destination.icao}`
              : "No active flight"}
          </span>
          <span className={styles.action}>{current ? "Open Flight Brief" : "Open EFB"} →</span>
        </Link>
      </section>
    </main>
  );
}

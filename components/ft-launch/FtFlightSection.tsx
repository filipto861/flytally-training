import Link from "next/link";

import { withVariantQuery } from "@/lib/aircraft-applicability";

import styles from "./ft-launch.module.css";

export type FtActiveFlightSummary = {
  readonly title: string;
  readonly summary: string;
  readonly href: string;
};

export function FtFlightSection({
  aircraftId,
  selectedVariant,
  activeFlight,
}: Readonly<{
  aircraftId: string;
  selectedVariant?: string;
  activeFlight?: FtActiveFlightSummary;
}>) {
  return (
    <section className={styles.secondarySection} aria-labelledby="ft-flight-section">
      <p className={styles.eyebrow}>FLIGHT</p>
      <h2 id="ft-flight-section">Flight</h2>
      {activeFlight ? (
        <>
          <strong className={styles.secondaryTitle}>{activeFlight.title}</strong>
          <p>{activeFlight.summary}</p>
          <Link className={styles.secondaryAction} href={activeFlight.href}>
            Open flight brief
          </Link>
        </>
      ) : (
        <>
          <p className={styles.emptyState}>No active flight.</p>
          <Link
            className={styles.secondaryAction}
            href={withVariantQuery(`/aircraft/${aircraftId}/fly`, selectedVariant)}
          >
            Start new flight
          </Link>
        </>
      )}
    </section>
  );
}

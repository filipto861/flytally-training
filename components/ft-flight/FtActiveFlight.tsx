import Link from "next/link";

import { withVariantQuery } from "@/lib/aircraft-applicability";

import styles from "./ft-flight.module.css";

export function FtActiveFlight({
  aircraftId,
  selectedVariant,
}: Readonly<{
  aircraftId: string;
  selectedVariant?: string;
}>) {
  return (
    <section className={styles.section} aria-labelledby="ft-active-flight" data-empty="true">
      <p className={styles.eyebrow}>ACTIVE FLIGHT</p>
      <h2 id="ft-active-flight">Active Flight</h2>
      <p className={styles.emptyState}>No active flight.</p>
      <Link
        className={styles.primaryAction}
        href={withVariantQuery(`/aircraft/${aircraftId}/fly`, selectedVariant)}
      >
        Start new flight
      </Link>
    </section>
  );
}

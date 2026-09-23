import Link from "next/link";

import { withVariantQuery } from "@/lib/aircraft-applicability";

import styles from "./ft-systems.module.css";

export function FtSystemsUnavailable({
  aircraftId,
  selectedVariant,
}: Readonly<{
  aircraftId: string;
  selectedVariant?: string;
}>) {
  return (
    <main
      className={styles.page}
      aria-label="Systems workspace"
      data-ft-systems-page="true"
      data-content-state="unavailable"
    >
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>AIRCRAFT · SYSTEMS</p>
        <h1>Systems</h1>
        <p className={styles.lede}>
          Source-backed aircraft systems content appears here when a governed
          package is published for the selected configuration.
        </p>
      </header>

      <section className={styles.unavailableState} aria-labelledby="ft-systems-unavailable">
        <div className={styles.unavailableMark} aria-hidden="true">◇</div>
        <p className={styles.eyebrow}>CONTENT UNAVAILABLE</p>
        <h2 id="ft-systems-unavailable">No published Systems package</h2>
        <p>
          There is no governed, configuration-applicable Systems content
          available for this aircraft profile. Nothing is inferred or substituted.
        </p>

        <div className={styles.unavailableActions}>
          <Link
            className={styles.primaryAction}
            href={withVariantQuery("/aircraft/" + aircraftId, selectedVariant)}
          >
            Back to aircraft
          </Link>
          <Link
            className={styles.secondaryAction}
            href={withVariantQuery(
              "/aircraft/" + aircraftId + "/reference",
              selectedVariant,
            )}
          >
            Open reference
          </Link>
        </div>

        <small>Availability is determined by published content governance.</small>
      </section>
    </main>
  );
}

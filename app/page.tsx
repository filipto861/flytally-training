import Link from "next/link";

import { PwaInstallCard } from "@/components/pwa-install-card";
import { getTrainingContentRepository } from "@/lib/content-store";

import styles from "./library.module.css";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const repository = getTrainingContentRepository();
  const aircraft = await repository.listAircraft();

  return (
    <main className={styles.libraryPage} data-ux6-library="true">
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">FT</span>
          <span className={styles.brandCopy}>
            <small>TRAINING</small>
            <strong>FlyTally</strong>
          </span>
        </div>
        <span className={styles.productLabel}>Aircraft library</span>
      </header>

      <section className={styles.content}>
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>AIRCRAFT LIBRARY</p>
          <h1>Your aircraft</h1>
          <p>Choose an aircraft to open its source-governed training workspace.</p>
        </header>

        <section className={styles.aircraftList} aria-label="Training aircraft">
          {aircraft.length ? (
            aircraft.map((item) => (
              <Link
                className={styles.aircraftRow}
                href={"/aircraft/" + item.id}
                key={item.id}
              >
                <span className={styles.aircraftAvatar} aria-hidden="true">
                  {item.displayName
                    .split(/\s+/)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 3)
                    .toUpperCase()}
                </span>

                <span className={styles.aircraftCopy}>
                  <small className={styles.available}>AVAILABLE</small>
                  <strong>{item.displayName}</strong>
                  <span>
                    {item.variants.length
                      ? item.variants.join(" · ")
                      : "Published training package"}
                  </span>
                </span>

                <span className={styles.openAction}>Open workspace →</span>
              </Link>
            ))
          ) : (
            <div className={styles.emptyState} role="status">
              <strong>No training aircraft available</strong>
              <span>
                Published aircraft will appear here when their governed training
                package is available.
              </span>
            </div>
          )}
        </section>

        <div className={styles.installArea}>
          <PwaInstallCard />
        </div>
      </section>
    </main>
  );
}

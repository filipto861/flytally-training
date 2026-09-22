import Link from "next/link";

import {
  withVariantQuery,
} from "@/lib/aircraft-applicability";
import type { ReferencePresentation } from "@/lib/reference-presentation";

import { FtReferencePresentation } from "./FtReferencePresentation";
import styles from "./ft-reference.module.css";

export type FtReferenceDestination = {
  readonly key: string;
  readonly title: string;
  readonly summary: string;
  readonly href: string;
};

export function FtReferencePage({
  aircraftId,
  selectedVariant,
  reference,
  destinations,
}: Readonly<{
  aircraftId: string;
  selectedVariant?: string;
  reference?: ReferencePresentation;
  destinations: readonly FtReferenceDestination[];
}>) {
  return (
    <main
      className={styles.page}
      aria-label="Reference workspace"
      data-ft-reference-page="true"
    >
      <header className={styles.pageHeader}>
        <p>FLIGHT · REFERENCE</p>
        <h1>Reference</h1>
        <span>
          Source-governed cockpit reference and direct links to the aircraft&apos;s
          published tools.
        </span>
      </header>

      {reference ? (
        <FtReferencePresentation reference={reference} view="full" />
      ) : (
        <section className={styles.empty} aria-label="Reference quick access unavailable">
          <strong>No quick-reference limitations available.</strong>
          <p>Use the published reference tools below.</p>
        </section>
      )}

      {destinations.length ? (
        <section className={styles.destinations} aria-labelledby="reference-tools-heading">
          <h2 id="reference-tools-heading">Reference tools</h2>
          <div>
            {destinations.map((destination) => (
              <Link
                href={withVariantQuery(destination.href, selectedVariant)}
                key={destination.key}
              >
                <strong>{destination.title}</strong>
                <span>{destination.summary}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {!reference && !destinations.length ? (
        <section className={styles.empty}>
          <strong>No published reference content.</strong>
          <p>The current aircraft package does not expose a reference surface.</p>
        </section>
      ) : null}

      <Link
        className={styles.backToAircraft}
        href={withVariantQuery(`/aircraft/${aircraftId}`, selectedVariant)}
      >
        Back to aircraft
      </Link>
    </main>
  );
}

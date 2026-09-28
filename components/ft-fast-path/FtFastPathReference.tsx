"use client";

import Link from "next/link";

import { FtReferencePerformance } from "@/components/ft-reference/FtReferencePerformance";
import { FtReferencePresentation } from "@/components/ft-reference/FtReferencePresentation";
import { withVariantQuery } from "@/lib/aircraft-applicability";
import type { ReferencePresentation } from "@/lib/reference-presentation";
import type { AircraftPerformanceContent } from "@/lib/universal-aircraft-content";

import styles from "./ft-fast-path.module.css";

export function FtFastPathReference({
  aircraftId,
  selectedVariant,
  reference,
  performance,
}: Readonly<{
  aircraftId: string;
  selectedVariant?: string;
  reference?: ReferencePresentation;
  performance?: AircraftPerformanceContent;
}>) {
  const href = withVariantQuery(
    `/aircraft/${aircraftId}/reference`,
    selectedVariant,
  );
  const hasPerformance = Boolean(performance?.datasets.length);
  const hasLimitations = Boolean(reference);

  if (!hasPerformance && !hasLimitations) {
    return (
      <section className={styles.placeholder} aria-label="Reference quick access">
        <p className={styles.eyebrow}>REF</p>
        <h2>Reference unavailable</h2>
        <p>
          No configuration-applicable Reference data are available in the current governed package.
        </p>
        <Link className={styles.fullPageLink} href={href}>
          Open reference
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.referenceStack} aria-label="REF fast path">
      {hasPerformance && performance ? (
        <FtReferencePerformance content={performance} />
      ) : null}

      {hasLimitations && reference ? (
        <FtReferencePresentation reference={reference} view="fast-path" />
      ) : null}

      <Link className={styles.fullPageLink} href={href}>
        Open Learn reference tables
      </Link>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  configurationForAircraftVariant,
  filterLimitationsForConfiguration,
  filterPerformanceForConfiguration,
  resolveSelectedVariant,
  withVariantQuery,
} from "@/lib/aircraft-applicability";
import type { TrainingAircraft } from "@/lib/aircraft-catalog";
import { toReferencePresentation } from "@/lib/reference-presentation";
import type {
  AircraftLimitationsContent,
  AircraftPerformanceContent,
} from "@/lib/universal-aircraft-content";

import { FtReferencePerformance } from "@/components/ft-reference/FtReferencePerformance";
import { FtReferencePresentation } from "@/components/ft-reference/FtReferencePresentation";
import styles from "./ft-fast-path.module.css";

type ReferenceAircraft = Pick<
  TrainingAircraft,
  "id" | "variants" | "variantProfiles" | "equipmentTags"
>;

export function FtFastPathReference({
  aircraft,
  content,
  performance,
}: Readonly<{
  aircraft?: ReferenceAircraft;
  content?: AircraftLimitationsContent;
  performance?: AircraftPerformanceContent;
}>) {
  const [queryVariant, setQueryVariant] = useState<string | undefined>(
    aircraft?.variants.length === 1 ? aircraft.variants[0] : undefined,
  );
  const [queryResolved, setQueryResolved] = useState(
    (aircraft?.variants.length ?? 0) <= 1,
  );
  const [invalidVariant, setInvalidVariant] = useState(false);

  useEffect(() => {
    if (!aircraft) {
      setQueryResolved(true);
      return;
    }

    const requested = new URLSearchParams(window.location.search).get("variant") ?? undefined;
    const invalid = Boolean(requested && !aircraft.variants.includes(requested));
    setInvalidVariant(invalid);
    setQueryVariant(
      invalid ? undefined : resolveSelectedVariant(requested, aircraft.variants),
    );
    setQueryResolved(true);
  }, [aircraft]);

  const configured = useMemo(() => {
    if (!aircraft || invalidVariant || !queryResolved) {
      return { reference: undefined, performance: undefined };
    }

    const configuration = configurationForAircraftVariant(aircraft, queryVariant);
    return {
      reference: content
        ? toReferencePresentation(
            filterLimitationsForConfiguration(content, configuration),
          )
        : undefined,
      performance: performance
        ? filterPerformanceForConfiguration(performance, configuration)
        : undefined,
    };
  }, [
    aircraft,
    content,
    invalidVariant,
    performance,
    queryResolved,
    queryVariant,
  ]);

  const href = aircraft
    ? withVariantQuery(`/aircraft/${aircraft.id}/reference`, queryVariant)
    : "#";

  if (!queryResolved) {
    return (
      <section className={styles.placeholder} aria-label="Reference quick access">
        <p className={styles.eyebrow}>REF</p>
        <h2>Reference</h2>
        <p>Resolving the selected aircraft configuration…</p>
      </section>
    );
  }

  const hasPerformance = Boolean(configured.performance?.datasets.length);
  const hasLimitations = Boolean(configured.reference);

  if (!aircraft || (!hasPerformance && !hasLimitations)) {
    return (
      <section className={styles.placeholder} aria-label="Reference quick access">
        <p className={styles.eyebrow}>REF</p>
        <h2>Reference unavailable</h2>
        <p>
          No configuration-applicable Reference data are available in the current governed package.
        </p>
        {aircraft && !invalidVariant ? (
          <Link className={styles.fullPageLink} href={href}>
            Open reference
          </Link>
        ) : null}
      </section>
    );
  }

  return (
    <section className={styles.referenceStack} aria-label="REF fast path">
      {hasPerformance && configured.performance ? (
        <FtReferencePerformance content={configured.performance} />
      ) : null}

      {hasLimitations && configured.reference ? (
        <FtReferencePresentation reference={configured.reference} view="fast-path" />
      ) : null}

      <Link className={styles.fullPageLink} href={href}>
        Open Learn reference tables
      </Link>
    </section>
  );
}

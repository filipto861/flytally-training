"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  configurationForAircraftVariant,
  filterLimitationsForConfiguration,
  resolveSelectedVariant,
  withVariantQuery,
} from "@/lib/aircraft-applicability";
import type { TrainingAircraft } from "@/lib/aircraft-catalog";
import { toReferencePresentation } from "@/lib/reference-presentation";
import type { AircraftLimitationsContent } from "@/lib/universal-aircraft-content";

import { FtReferencePresentation } from "@/components/ft-reference/FtReferencePresentation";
import styles from "./ft-fast-path.module.css";

type ReferenceAircraft = Pick<
  TrainingAircraft,
  "id" | "variants" | "variantProfiles" | "equipmentTags"
>;

export function FtFastPathReference({
  aircraft,
  content,
}: Readonly<{
  aircraft?: ReferenceAircraft;
  content?: AircraftLimitationsContent;
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

  const reference = useMemo(() => {
    if (!aircraft || !content || invalidVariant || !queryResolved) return undefined;
    const configuration = configurationForAircraftVariant(aircraft, queryVariant);
    return toReferencePresentation(
      filterLimitationsForConfiguration(content, configuration),
    );
  }, [aircraft, content, invalidVariant, queryResolved, queryVariant]);

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

  if (!aircraft || !reference) {
    return (
      <section className={styles.placeholder} aria-label="Reference quick access">
        <p className={styles.eyebrow}>REF</p>
        <h2>Reference unavailable</h2>
        <p>
          No configuration-applicable published limitations are available in the
          current governed package.
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
    <section aria-label="REF fast path">
      <FtReferencePresentation reference={reference} view="fast-path" />
      <Link className={styles.fullPageLink} href={href}>
        Open full reference
      </Link>
    </section>
  );
}

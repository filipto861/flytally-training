"use client";

import Link from "next/link";

import { withVariantQuery } from "@/lib/aircraft-applicability";
import type { ActiveFlight } from "@/lib/active-flight/types";
import { useActiveFlightState } from "@/components/ft-flight/use-active-flight";

import styles from "./ft-launch.module.css";

export function FtFlightSection({
  aircraftId,
  selectedVariant,
  activeFlight,
}: Readonly<{
  aircraftId: string;
  selectedVariant?: string;
  activeFlight?: ActiveFlight | null;
}>) {
  const { flight } = useActiveFlightState(aircraftId, activeFlight);
  const current = flight?.lifecycle === "ACTIVE" ? flight : null;

  return (
    <section className={styles.secondarySection} aria-labelledby="ft-flight-section">
      <p className={styles.eyebrow}>FLIGHT</p>
      <h2 id="ft-flight-section">Flight</h2>
      {current ? (
        <>
          <strong className={styles.secondaryTitle}>
            {current.departure.icao} → {current.destination.icao}
          </strong>
          <p>{current.runway ? `RWY ${current.runway.identifier} · ` : ""}ACTIVE</p>
          <Link
            className={styles.secondaryAction}
            href={withVariantQuery(`/aircraft/${aircraftId}/flight`, selectedVariant)}
          >
            Open flight brief
          </Link>
        </>
      ) : (
        <>
          <p className={styles.emptyState}>No active flight.</p>
          <Link
            className={styles.secondaryAction}
            href={withVariantQuery(`/aircraft/${aircraftId}/flight`, selectedVariant)}
          >
            Start new flight
          </Link>
        </>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";

import { ftFastPathDestinations } from "./navigation";
import styles from "./ft-shell.module.css";

export function FtFastPathRail({ aircraftId }: Readonly<{ aircraftId: string }>) {
  return (
    <nav className={styles.fastPathRail} aria-label="Operational fast path">
      {ftFastPathDestinations(aircraftId).map((destination) => (
        <Link
          key={destination.key}
          href={destination.href}
          className={styles.fastPathLink}
        >
          {destination.label}
        </Link>
      ))}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  getAircraftContentIa,
  isAircraftContentDestinationActive,
} from "@/lib/aircraft-content-ia";
import styles from "./ft-shell.module.css";

function NavIcon({ name }: Readonly<{ name: string }>) {
  const path =
    name === "aircraft"
      ? "M4 12h16M12 4v16M7 9l5-5 5 5M8 15l4 5 4-5"
      : name === "procedures"
        ? "M6 4h12v16H6zM9 8h6M9 12h6M9 16h4"
        : name === "performance"
          ? "M4 18V6M4 18h16M8 15l3-4 3 2 4-6"
          : name === "training"
            ? "M4 7l8-4 8 4-8 4-8-4Zm3 3v5c3 2 7 2 10 0v-5"
            : "M5 17V7l7-4 7 4v10M8 17v-5h8v5";

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.sideNavIcon}>
      <path d={path} />
    </svg>
  );
}

export function FtSideNav({ aircraftId }: Readonly<{ aircraftId: string }>) {
  const pathname = usePathname();
  const destinations = getAircraftContentIa(aircraftId);

  return (
    <nav className={styles.sideNav} aria-label="Aircraft workspace sections">
      <div className={styles.sideNavMark} aria-hidden="true">FT</div>
      <div className={styles.sideNavItems}>
        {destinations.map((destination) => {
          const active = isAircraftContentDestinationActive(
            pathname,
            aircraftId,
            destination.key,
          );
          return (
            <Link
              key={destination.key}
              href={destination.href}
              className={styles.sideNavLink}
              aria-label={destination.label}
              aria-current={active ? "page" : undefined}
              title={destination.label}
            >
              <NavIcon name={destination.key} />
              <span>{destination.label.slice(0, 4)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  getAircraftContentIa,
  isAircraftContentDestinationActive,
} from "@/lib/aircraft-content-ia";
import styles from "./ft-shell.module.css";

export function FtSideNav({ aircraftId }: Readonly<{ aircraftId: string }>) {
  const pathname = usePathname();
  const destinations = getAircraftContentIa(aircraftId);

  return (
    <nav className={styles.sideNav} aria-label="Aircraft workspace sections">
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
            aria-current={active ? "page" : undefined}
          >
            {destination.label}
          </Link>
        );
      })}
    </nav>
  );
}

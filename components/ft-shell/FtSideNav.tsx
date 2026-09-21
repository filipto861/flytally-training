"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ftShellDestinations, isFtShellDestinationActive } from "./navigation";
import styles from "./ft-shell.module.css";

export function FtSideNav({ aircraftId }: Readonly<{ aircraftId: string }>) {
  const pathname = usePathname();
  const destinations = ftShellDestinations(aircraftId);

  return (
    <nav className={styles.sideNav} aria-label="Aircraft workspace sections">
      {destinations.map((destination) => {
        const active = isFtShellDestinationActive(pathname, destination);
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

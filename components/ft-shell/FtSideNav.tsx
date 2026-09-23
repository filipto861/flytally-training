"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  getAircraftContentIa,
  getAircraftProductModeForPathname,
  isAircraftContentDestinationActive,
} from "@/lib/aircraft-content-ia";
import styles from "./ft-shell.module.css";

function NavIcon({ name }: Readonly<{ name: string }>) {
  const path =
    name === "training"
      ? "M5 5.5h6.5c1.7 0 3 1.3 3 3V19c-.8-1.1-1.8-1.6-3-1.6H5zM19 5.5h-4.5v12c.8-.1 1.5-.1 2.1.2.9.4 1.5.8 2.4 1.3z"
      : name === "systems"
        ? "M5 7h14v10H5zM8 10h3v4H8zM14 10h2M14 14h2"
        : name === "procedures"
          ? "M6 4h12v16H6zM9 8h6M9 12h6M9 16h4"
          : name === "limitations"
            ? "M12 4v10M8 10h8M7 18h10"
            : name === "reference"
              ? "M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"
              : name === "flight"
                ? "M4 12h16M7 9l5-5 5 5M8 15l4 5 4-5"
                : name === "performance"
                  ? "M4 18V6M4 18h16M8 15l3-4 3 2 4-6"
                  : name === "checklist"
                    ? "M6 4h12v16H6zM9 8l1.5 1.5L14 6M9 14l1.5 1.5L14 12"
                    : "M12 4 4 20h16L12 4Zm0 6v4m0 3h.01";

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.sideNavIcon}>
      <path d={path} />
    </svg>
  );
}

export function FtSideNav({ aircraftId }: Readonly<{ aircraftId: string }>) {
  const pathname = usePathname();
  const mode = getAircraftProductModeForPathname(pathname, aircraftId);
  if (!mode) return null;

  const destinations = getAircraftContentIa(aircraftId, mode);

  return (
    <nav
      className={styles.sideNav}
      aria-label={mode === "efb" ? "EFB navigation" : "Learn navigation"}
      data-product-mode={mode}
    >
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
              <span>{destination.shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  getAircraftModeDestinations,
  getAircraftModeHomeHref,
  getAircraftProductModeForPathname,
  isAircraftModeDestinationActive,
  type AircraftModeDestinationKey,
} from "@/lib/aircraft-product-mode";
import styles from "./ft-shell.module.css";

function NavIcon({ name }: Readonly<{ name: AircraftModeDestinationKey }>) {
  const path =
    name === "learn-home"
      ? "M5 5.5h6.5c1.7 0 3 1.3 3 3V19c-.8-1.1-1.8-1.6-3-1.6H5zM19 5.5h-4.5v12c.8-.1 1.5-.1 2.1.2.9.4 1.5.8 2.4 1.3z"
      : name === "systems"
        ? "M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0z"
        : name === "procedures" || name === "checklist"
          ? "M6 4h12v16H6zM9 8h6M9 12h6M9 16h4"
          : name === "performance"
            ? "M4 18V6M4 18h16M8 15l3-4 3 2 4-6"
            : name === "flight-brief"
              ? "M4 17h16M6 14l4-4 3 2 5-6M6 5h4"
              : name === "limitations"
                ? "M12 3 3.5 19h17L12 3Zm0 6v5M12 17h.01"
                : "M5 4.5h14v15H5zM8 8h8M8 12h8M8 16h5";

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.sideNavIcon}>
      <path d={path} />
    </svg>
  );
}

export function FtSideNav({ aircraftId }: Readonly<{ aircraftId: string }>) {
  const pathname = usePathname();
  const mode = getAircraftProductModeForPathname(pathname, aircraftId);
  const destinations = mode ? getAircraftModeDestinations(aircraftId, mode) : [];

  return (
    <nav className={styles.sideNav} aria-label="Aircraft workspace sections">
      <Link className={styles.sideNavMark} href={`/aircraft/${aircraftId}`} aria-label="Choose Learn or EFB mode">
        FT
      </Link>

      <div className={styles.modeSwitch} aria-label="Product mode">
        <Link
          href={getAircraftModeHomeHref(aircraftId, "learn")}
          aria-current={mode === "learn" ? "page" : undefined}
        >
          LEARN
        </Link>
        <Link
          href={getAircraftModeHomeHref(aircraftId, "efb")}
          aria-current={mode === "efb" ? "page" : undefined}
        >
          EFB
        </Link>
      </div>

      {mode ? (
        <div className={styles.sideNavItems}>
          {destinations.map((destination) => {
            const active = isAircraftModeDestinationActive(
              pathname,
              aircraftId,
              mode,
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
      ) : null}
    </nav>
  );
}

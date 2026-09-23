"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { withVariantQuery } from "@/lib/aircraft-applicability";
import {
  getAircraftContentIa,
  getAircraftProductModeForPathname,
  isAircraftContentDestinationActive,
} from "@/lib/aircraft-content-ia";
import styles from "./ft-shell.module.css";

const focusableSelector = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function FtNavDrawer({ aircraftId }: Readonly<{ aircraftId: string }>) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const variant = searchParams.get("variant") ?? undefined;
  const mode = getAircraftProductModeForPathname(pathname, aircraftId);
  const destinations = mode ? getAircraftContentIa(aircraftId, mode) : [];
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(focusableSelector);
    first?.focus();

    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [open]);

  if (!mode) return null;

  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(focusableSelector),
    );
    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function closeAndRestoreFocus() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className={styles.drawerRoot}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.drawerTrigger}
        aria-label="Open aircraft navigation"
        aria-expanded={open}
        aria-controls="ft-aircraft-nav-drawer"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">☰</span>
      </button>

      {open ? (
        <div className={styles.drawerLayer}>
          <button
            type="button"
            tabIndex={-1}
            className={styles.drawerBackdrop}
            aria-label="Close aircraft navigation"
            onClick={closeAndRestoreFocus}
          />
          <div
            ref={panelRef}
            id="ft-aircraft-nav-drawer"
            className={styles.drawerPanel}
            role="dialog"
            aria-modal="true"
            aria-label={mode === "efb" ? "EFB navigation" : "Learn navigation"}
            onKeyDown={trapFocus}
          >
            <div className={styles.drawerHeader}>
              <div>
                <span>FLYTALLY TRAINING</span>
                <strong>{mode === "efb" ? "EFB" : "Learn"}</strong>
              </div>
              <button
                type="button"
                className={styles.drawerClose}
                aria-label="Close aircraft navigation"
                onClick={closeAndRestoreFocus}
              >
                ×
              </button>
            </div>
            <nav className={styles.drawerNav} aria-label={mode === "efb" ? "EFB sections" : "Learn sections"}>
              {destinations.map((destination) => {
                const active = isAircraftContentDestinationActive(
                  pathname,
                  aircraftId,
                  destination.key,
                );
                return (
                  <Link
                    key={destination.key}
                    href={withVariantQuery(destination.href, variant)}
                    className={styles.drawerLink}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <span>{destination.label}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}

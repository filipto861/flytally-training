"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";

import type { PilotTakeoffCalculatorDefinition } from "@/lib/pilot-takeoff-calculator";
import {
  FtPerformanceOperationPresentation,
} from "@/components/ft-performance/FtPerformancePresentation";
import type {
  TakeoffPerformanceOperationController,
} from "@/components/ft-performance/use-performance-operation";

import styles from "./ft-flight.module.css";

const focusableSelector =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function FtPerformanceEditorSheet({
  aircraftId,
  operation,
  takeoffCalculator,
  open,
  onClose,
}: Readonly<{
  aircraftId: string;
  operation: TakeoffPerformanceOperationController;
  takeoffCalculator?: PilotTakeoffCalculatorDefinition;
  open: boolean;
  onClose: () => void;
}>) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(focusableSelector)?.focus();

    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [onClose, open]);

  if (!open) return null;

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

  return (
    <div className={styles.performanceEditorLayer} data-performance-editor="true">
      <button
        type="button"
        tabIndex={-1}
        className={styles.performanceEditorBackdrop}
        aria-label="Close Takeoff performance editor"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        className={styles.performanceEditorPanel}
        role="dialog"
        aria-modal="true"
        aria-label="Takeoff performance editor"
        onKeyDown={trapFocus}
      >
        <header className={styles.performanceEditorHeader}>
          <div>
            <p className={styles.eyebrow}>TAKEOFF PERFORMANCE</p>
            <h2>Edit Takeoff</h2>
          </div>
          <button
            type="button"
            className={styles.performanceEditorClose}
            aria-label="Close Takeoff performance editor"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className={styles.performanceEditorBody}>
          <FtPerformanceOperationPresentation
            aircraftId={aircraftId}
            operation={operation}
            takeoffCalculator={takeoffCalculator}
            view="brief"
            showInputs
          />
        </div>
      </div>
    </div>
  );
}

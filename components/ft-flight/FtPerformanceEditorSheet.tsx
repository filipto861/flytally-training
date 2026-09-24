"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";

import type { PilotLandingCalculatorDefinition } from "@/lib/pilot-landing-calculator";
import type { PilotTakeoffCalculatorDefinition } from "@/lib/pilot-takeoff-calculator";
import {
  FtLandingPerformanceOperationPresentation,
} from "@/components/ft-performance/FtLandingPerformancePresentation";
import type {
  LandingPerformanceOperationController,
} from "@/components/ft-performance/use-landing-performance-operation";
import {
  FtPerformanceOperationPresentation,
} from "@/components/ft-performance/FtPerformancePresentation";
import type {
  TakeoffPerformanceOperationController,
} from "@/components/ft-performance/use-performance-operation";

import styles from "./ft-flight.module.css";

const focusableSelector =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

type CommonProps = {
  readonly aircraftId: string;
  readonly open: boolean;
  readonly onClose: () => void;
};

type TakeoffEditorProps = {
  readonly kind: "TAKEOFF";
  readonly operation: TakeoffPerformanceOperationController;
  readonly takeoffCalculator?: PilotTakeoffCalculatorDefinition;
};

type LandingEditorProps = {
  readonly kind: "LANDING";
  readonly operation: LandingPerformanceOperationController;
  readonly landingCalculator?: PilotLandingCalculatorDefinition;
};

export function FtPerformanceEditorSheet(
  props: Readonly<CommonProps & (TakeoffEditorProps | LandingEditorProps)>,
) {
  const { aircraftId, kind, open, onClose } = props;
  const panelRef = useRef<HTMLDivElement>(null);
  const title = kind === "TAKEOFF" ? "Takeoff" : "Landing";

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
        aria-label={`Close ${title} performance editor`}
        onClick={onClose}
      />

      <div
        ref={panelRef}
        className={styles.performanceEditorPanel}
        role="dialog"
        aria-modal="true"
        aria-label={`${title} performance editor`}
        onKeyDown={trapFocus}
      >
        <header className={styles.performanceEditorHeader}>
          <div>
            <p className={styles.eyebrow}>{kind} PERFORMANCE</p>
            <h2>Edit {title}</h2>
          </div>
          <button
            type="button"
            className={styles.performanceEditorClose}
            aria-label={`Close ${title} performance editor`}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className={styles.performanceEditorBody}>
          {props.kind === "TAKEOFF" ? (
            <FtPerformanceOperationPresentation
              aircraftId={aircraftId}
              operation={props.operation}
              takeoffCalculator={props.takeoffCalculator}
              view="brief"
              showInputs
            />
          ) : (
            <FtLandingPerformanceOperationPresentation
              aircraftId={aircraftId}
              operation={props.operation}
              landingCalculator={props.landingCalculator}
              view="brief"
              showInputs
            />
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";

import type { ActiveFlight } from "@/lib/active-flight/types";
import type { TrainingAircraft } from "@/lib/aircraft-catalog";
import { fastPathTabs, type FastPathTab } from "@/lib/fast-path/panel-state";
import type { PilotTakeoffCalculatorDefinition } from "@/lib/pilot-takeoff-calculator";
import type {
  AircraftLimitationsContent,
  PerformanceDataset,
} from "@/lib/universal-aircraft-content";
import type { OperationalEmergencyContent } from "@/lib/operational-flight-data";
import { FtPerformancePresentation } from "@/components/ft-performance/FtPerformancePresentation";

import { FtFastPathChecklist } from "./FtFastPathChecklist";
import { FtFastPathQrh } from "./FtFastPathQrh";
import { FtFastPathReference } from "./FtFastPathReference";
import { useFtFastPath } from "./FtFastPathProvider";
import styles from "./ft-fast-path.module.css";

const focusableSelector =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

const TAB_LABELS: Readonly<Record<FastPathTab, string>> = {
  checklist: "CHECKLIST",
  qrh: "QRH",
  perf: "PERF",
  ref: "REF",
};

export function FtFastPathPanel({
  activeFlight,
  emergency,
  referenceAircraft,
  referenceContent,
  performanceDatasets,
  takeoffCalculator,
}: Readonly<{
  activeFlight?: ActiveFlight | null;
  emergency?: OperationalEmergencyContent;
  referenceAircraft?: Pick<
    TrainingAircraft,
    "id" | "variants" | "variantProfiles" | "equipmentTags"
  >;
  referenceContent?: AircraftLimitationsContent;
  performanceDatasets: readonly PerformanceDataset[];
  takeoffCalculator?: PilotTakeoffCalculatorDefinition;
}>) {
  const { aircraftId, panelOpen, activeTab, closePanel, selectTab } = useFtFastPath();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (panelOpen) {
      if (!wasOpenRef.current) {
        returnFocusRef.current =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
      }
      wasOpenRef.current = true;
      const frame = window.requestAnimationFrame(() => {
        const activeTabButton = panelRef.current?.querySelector<HTMLElement>(
          '[role="tab"][aria-selected="true"]',
        );
        activeTabButton?.focus();
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      const frame = window.requestAnimationFrame(() => {
        returnFocusRef.current?.focus();
        returnFocusRef.current = null;
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, [panelOpen]);

  if (!panelOpen) return null;

  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closePanel();
      return;
    }
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
    <div className={styles.panelLayer}>
      <button
        type="button"
        tabIndex={-1}
        className={styles.panelBackdrop}
        aria-label="Close fast path"
        onClick={closePanel}
      />

      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Operational fast path"
        onKeyDown={trapFocus}
      >
        <header className={styles.panelHeader}>
          <div className={styles.tabList} role="tablist" aria-label="Fast path tools">
            {fastPathTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={tab === activeTab}
                className={
                  tab === activeTab
                    ? `${styles.tab} ${styles.tabActive}`
                    : styles.tab
                }
                onClick={() => selectTab(tab)}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close fast path"
            onClick={closePanel}
          >
            CLOSE
          </button>
        </header>

        <div className={styles.panelBody}>
          {activeTab === "checklist" ? (
            <FtFastPathChecklist />
          ) : activeTab === "qrh" ? (
            <FtFastPathQrh emergency={emergency} />
          ) : activeTab === "perf" ? (
            <FtPerformancePresentation
              aircraftId={aircraftId}
              activeFlight={activeFlight}
              datasets={performanceDatasets}
              takeoffCalculator={takeoffCalculator}
              view="operational"
            />
          ) : (
            <FtFastPathReference
              aircraft={referenceAircraft}
              content={referenceContent}
            />
          )}
        </div>
      </div>
    </div>
  );
}

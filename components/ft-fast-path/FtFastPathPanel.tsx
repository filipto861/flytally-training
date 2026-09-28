"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";

import { FtPerformancePresentation } from "@/components/ft-performance/FtPerformancePresentation";
import type { ActiveFlight } from "@/lib/active-flight/types";
import { fastPathTabs, type FastPathTab } from "@/lib/fast-path/panel-state";

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

function scopeUnavailableText(
  status: "unselected" | "unknown-variant" | "configuration-invalid",
): { title: string; body: string } {
  if (status === "unselected") {
    return {
      title: "Configuration not selected",
      body: "Select an aircraft configuration before using operational Fast Path content.",
    };
  }
  if (status === "unknown-variant") {
    return {
      title: "Unknown configuration",
      body: "The requested aircraft configuration is not registered for this aircraft.",
    };
  }
  return {
    title: "Invalid configuration",
    body: "The requested aircraft configuration could not be resolved safely.",
  };
}

export function FtFastPathPanel({
  activeFlight,
}: Readonly<{
  activeFlight?: ActiveFlight | null;
}>) {
  const {
    aircraftId,
    panelOpen,
    activeTab,
    closePanel,
    selectTab,
    workspaceProjection,
  } = useFtFastPath();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (panelOpen) {
      if (!wasOpenRef.current) {
        returnFocusRef.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
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

  let content;
  if (!workspaceProjection) {
    content = (
      <section className={styles.placeholder} role="status">
        <p className={styles.eyebrow}>CONFIGURATION</p>
        <h2>Resolving configuration…</h2>
        <p>Operational content remains unavailable until the route configuration is resolved.</p>
      </section>
    );
  } else if (workspaceProjection.scope.status !== "selected") {
    const state = scopeUnavailableText(workspaceProjection.scope.status);
    content = (
      <section className={styles.placeholder} role="status">
        <p className={styles.eyebrow}>CONFIGURATION</p>
        <h2>{state.title}</h2>
        <p>{state.body}</p>
      </section>
    );
  } else if (activeTab === "checklist") {
    content = <FtFastPathChecklist />;
  } else if (activeTab === "qrh") {
    content = <FtFastPathQrh emergency={workspaceProjection.emergency} />;
  } else if (activeTab === "perf") {
    content = (
      <FtPerformancePresentation
        aircraftId={aircraftId}
        activeFlight={activeFlight}
        selectedVariant={workspaceProjection.scope.variantKey ?? undefined}
        datasets={workspaceProjection.performanceDatasets}
        takeoffCalculator={workspaceProjection.takeoffCalculator}
        view="operational"
      />
    );
  } else {
    content = (
      <FtFastPathReference
        aircraftId={aircraftId}
        selectedVariant={workspaceProjection.scope.variantKey ?? undefined}
        reference={workspaceProjection.reference}
        performance={workspaceProjection.referencePerformance}
      />
    );
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

        <div className={styles.panelBody} data-fast-path-scroll-container="true">
          {content}
        </div>
      </div>
    </div>
  );
}

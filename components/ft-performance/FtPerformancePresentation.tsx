"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { ActiveFlight } from "@/lib/active-flight/types";
import type { PilotTakeoffCalculatorDefinition } from "@/lib/pilot-takeoff-calculator";
import {
  computePerformance,
  PERFORMANCE_RESULT_EVENT,
  readPerformanceResult,
  writePerformanceResult,
  type PerformanceCalculationInputs,
  type PerformanceResult,
} from "@/lib/performance/client";
import {
  buildPerformanceContext,
  diffPerformanceContext,
  isContextValid,
} from "@/lib/performance/context";
import type { PerformanceDataset } from "@/lib/universal-aircraft-content";
import { useActiveFlightState } from "@/components/ft-flight/use-active-flight";

import { FtPerformanceContextLabel, type FtPerformanceContextKind } from "./FtPerformanceContextLabel";
import { FtPerformanceInvalidation } from "./FtPerformanceInvalidation";
import { FtPerformanceStrip } from "./FtPerformanceStrip";
import styles from "./ft-performance.module.css";

function numberFromInput(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function FtPerformancePresentation({
  aircraftId,
  activeFlight,
  datasets,
  takeoffCalculator,
  view,
  showInputs = false,
}: Readonly<{
  aircraftId: string;
  activeFlight?: ActiveFlight | null;
  datasets: readonly PerformanceDataset[];
  takeoffCalculator?: PilotTakeoffCalculatorDefinition;
  view: FtPerformanceContextKind;
  showInputs?: boolean;
}>) {
  const { flight } = useActiveFlightState(aircraftId, activeFlight);
  const current = flight?.lifecycle === "ACTIVE" ? flight : null;
  const [result, setResult] = useState<PerformanceResult | null>(null);
  const [pressureAltitude, setPressureAltitude] = useState("");
  const [oat, setOat] = useState("");
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!current) {
      setResult(null);
      setHydrated(true);
      return;
    }

    const restore = () => {
      const stored = readPerformanceResult(
        window.localStorage,
        aircraftId,
        current.id,
      );
      setResult(stored);
      if (stored) {
        setPressureAltitude(
          stored.calculationInputs.pressureAltitudeFt === undefined
            ? ""
            : String(stored.calculationInputs.pressureAltitudeFt),
        );
        setOat(
          stored.calculationInputs.oatC === undefined
            ? ""
            : String(stored.calculationInputs.oatC),
        );
      }
    };

    restore();
    window.addEventListener(PERFORMANCE_RESULT_EVENT, restore);
    setHydrated(true);
    return () => window.removeEventListener(PERFORMANCE_RESULT_EVENT, restore);
  }, [aircraftId, current?.id]);

  const currentContext = useMemo(
    () => current ? buildPerformanceContext(current) : null,
    [current],
  );
  const stale = Boolean(
    currentContext
    && result
    && !isContextValid(currentContext, result.context),
  );
  const changes = currentContext && result && stale
    ? diffPerformanceContext(result.context, currentContext)
    : [];

  function calculate(inputs: PerformanceCalculationInputs) {
    if (!currentContext) return;
    setBusy(true);
    try {
      const next = computePerformance(
        currentContext,
        datasets,
        takeoffCalculator,
        inputs,
      );
      writePerformanceResult(window.localStorage, next);
      setResult(next);
      window.dispatchEvent(new Event(PERFORMANCE_RESULT_EVENT));
    } finally {
      setBusy(false);
    }
  }

  function calculateFromForm() {
    calculate({
      pressureAltitudeFt: numberFromInput(pressureAltitude),
      oatC: numberFromInput(oat),
    });
  }

  function recalculate() {
    calculate(result?.calculationInputs ?? {
      pressureAltitudeFt: numberFromInput(pressureAltitude),
      oatC: numberFromInput(oat),
    });
  }

  return (
    <section
      className={styles.presentation}
      aria-label="Performance"
      data-empty={current && result ? "false" : "true"}
      data-performance-view={view}
    >
      <FtPerformanceContextLabel context={view} />

      {!hydrated ? (
        <div className={styles.emptyState}><p>Loading performance context…</p></div>
      ) : !current ? (
        <div className={styles.emptyState}>
          <p>No active flight. Performance is tied to an explicit Active Flight context.</p>
          <Link className={styles.secondaryAction} href={`/aircraft/${aircraftId}/flight`}>
            Start active flight
          </Link>
        </div>
      ) : result ? (
        <>
          {stale ? (
            <FtPerformanceInvalidation
              busy={busy}
              changes={changes}
              onRecalculate={recalculate}
            />
          ) : null}
          <FtPerformanceStrip result={result} stale={stale} />
          <p className={styles.timestamp}>
            {stale
              ? "Stored result is stale."
              : `Calculated ${new Date(result.computedAt).toLocaleString("en-GB")}`}
          </p>
        </>
      ) : (
        <div className={styles.emptyState}>
          <p>No performance computed yet.</p>
          {!showInputs ? (
            <Link
              className={styles.secondaryAction}
              href={`/aircraft/${aircraftId}/performance`}
            >
              Calculate performance
            </Link>
          ) : null}
        </div>
      )}

      {current && showInputs ? (
        <div className={styles.inputBlock}>
          <div>
            <p className={styles.eyebrow}>CALCULATION INPUTS</p>
            <p className={styles.inputHelp}>
              Active Flight supplies weight, runway and configuration. Enter
              only source-required environment values that are not yet stored
              in the D0 Active Flight model.
            </p>
          </div>
          <div className={styles.inputGrid}>
            <label>
              Pressure altitude
              <input
                inputMode="decimal"
                name="pressureAltitude"
                onChange={(event) => setPressureAltitude(event.target.value)}
                placeholder="ft"
                type="number"
                value={pressureAltitude}
              />
            </label>
            <label>
              OAT
              <input
                inputMode="decimal"
                name="oat"
                onChange={(event) => setOat(event.target.value)}
                placeholder="°C"
                step="any"
                type="number"
                value={oat}
              />
            </label>
          </div>
          <button
            className={styles.action}
            disabled={busy}
            onClick={calculateFromForm}
            type="button"
          >
            {busy
              ? "Calculating…"
              : result
                ? "Recalculate performance"
                : "Calculate performance"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

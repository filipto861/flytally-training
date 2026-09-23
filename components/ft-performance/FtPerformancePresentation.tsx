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
  buildTakeoffPerformanceContext,
  diffPerformanceContext,
  isContextValid,
} from "@/lib/performance/context";
import { formatObservationZulu } from "@/lib/weather/metar-snapshot-helpers";
import type { PerformanceDataset } from "@/lib/universal-aircraft-content";
import { useActiveFlightState } from "@/components/ft-flight/use-active-flight";

import { FtPerformanceContextLabel, type FtPerformanceContextKind } from "./FtPerformanceContextLabel";
import { FtPerformanceInvalidation } from "./FtPerformanceInvalidation";
import { FtPerformanceStrip } from "./FtPerformanceStrip";
import { usePerformanceEnvironment } from "./use-performance-environment";
import styles from "./ft-performance.module.css";

function numberFromInput(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function signedKnots(value: number): string {
  const rounded = Math.round(value);
  if (rounded === 0) return "0 kt";
  return `${rounded > 0 ? "+" : ""}${rounded} kt`;
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
  const environment = usePerformanceEnvironment(
    current?.departure.icao ?? null,
    current?.runway?.identifier,
  );

  const [result, setResult] = useState<PerformanceResult | null>(null);
  const [takeoffWeight, setTakeoffWeight] = useState("");
  const [flaps, setFlaps] = useState("");
  const [antiIce, setAntiIce] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!current) {
      setTakeoffWeight("");
      setFlaps("");
      setAntiIce(false);
      return;
    }
    setTakeoffWeight(String(current.weight.value));
    setFlaps(
      current.configuration?.flaps
      ?? takeoffCalculator?.flapOptions[0]?.value
      ?? "",
    );
    setAntiIce(current.configuration?.antiIce === true);
  }, [
    current?.id,
    current?.weight.value,
    current?.weight.unit,
    current?.configuration?.flaps,
    current?.configuration?.antiIce,
    takeoffCalculator,
  ]);

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
      if (!stored) return;

      setTakeoffWeight(String(stored.context.weight.value));
      setFlaps(stored.context.configuration.flaps);
      setAntiIce(stored.context.configuration.antiIce);
      environment.setRunwayIdent(stored.context.runway.identifier);
    };

    restore();
    window.addEventListener(PERFORMANCE_RESULT_EVENT, restore);
    setHydrated(true);
    return () => window.removeEventListener(PERFORMANCE_RESULT_EVENT, restore);
  }, [aircraftId, current?.id]);

  const currentContext = useMemo(() => {
    if (!current) return null;
    const weight = numberFromInput(takeoffWeight);
    if (weight === undefined || weight <= 0) return null;

    return buildTakeoffPerformanceContext(current, {
      runwayIdentifier: environment.runwayIdent,
      weight: { value: weight, unit: current.weight.unit },
      flaps,
      antiIce,
      qnh: numberFromInput(environment.qnh.value),
      oat: numberFromInput(environment.oat.value),
    });
  }, [
    antiIce,
    current,
    environment.oat.value,
    environment.qnh.value,
    environment.runwayIdent,
    flaps,
    takeoffWeight,
  ]);

  const stale = Boolean(
    result
    && (
      showInputs
        ? currentContext && !isContextValid(currentContext, result.context)
        : current
          && result.context.dependencySnapshotId !== current.performanceDependency.snapshotId
    ),
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
      pressureAltitudeFt: numberFromInput(environment.pressureAltitude.value),
      oatC: numberFromInput(environment.oat.value),
    });
  }

  const resultContent = !hydrated ? (
    <div className={styles.emptyState}><p>Loading performance context…</p></div>
  ) : !current ? (
    <div className={styles.emptyState}>
      <p>No active flight. Performance is tied to an explicit Active Flight context.</p>
      <Link className={styles.secondaryAction} href={"/aircraft/" + aircraftId + "/flight"}>
        Start active flight
      </Link>
    </div>
  ) : result ? (
    <>
      {showInputs && stale ? (
        <FtPerformanceInvalidation
          busy={busy}
          changes={changes}
          onRecalculate={calculateFromForm}
        />
      ) : null}
      {!showInputs && stale ? (
        <div className={styles.briefRecalculate} role="status">
          <strong>RECALCULATE</strong>
          <span>Active Flight changed after this result was calculated.</span>
          <Link href={"/aircraft/" + aircraftId + "/performance"}>Open Performance</Link>
        </div>
      ) : null}
      <FtPerformanceStrip result={result} stale={stale} />
      <p className={styles.timestamp}>
        {stale
          ? "Stored result requires review."
          : "Calculated " + new Date(result.computedAt).toLocaleString("en-GB")}
      </p>
    </>
  ) : (
    <div className={styles.resultEmpty}>
      <span>RESULT</span>
      <strong>No performance computed yet</strong>
      <p>Select the runway, confirm the source-backed inputs and calculate.</p>
      {!showInputs ? (
        <Link
          className={styles.secondaryAction}
          href={"/aircraft/" + aircraftId + "/performance"}
        >
          Calculate performance
        </Link>
      ) : null}
    </div>
  );

  const weatherLabel = environment.metar
    ? `${formatObservationZulu(environment.metar.observedAt)} · ${environment.weatherState === "live" ? "LIVE" : "CACHED"}`
    : environment.weatherState === "loading"
      ? "Loading METAR…"
      : environment.weatherState === "no-report"
        ? "No METAR report"
        : environment.weatherState === "error"
          ? "Weather unavailable"
          : "No weather";

  return (
    <section
      className={styles.presentation}
      aria-label="Performance"
      data-empty={current && result ? "false" : "true"}
      data-performance-view={view}
    >
      <FtPerformanceContextLabel context={view} />

      {current && showInputs ? (
        <div className={styles.performanceWorkspace}>
          <section className={styles.inputBlock} aria-label="Performance inputs">
            <header className={styles.paneHeader}>
              <p className={styles.eyebrow}>TAKEOFF · INPUTS</p>
              <h2>{current.departure.icao} departure</h2>
              <p className={styles.inputHelp}>
                Runway, weather and configuration are calculation inputs. Active Flight no longer requires them at flight creation.
              </p>
            </header>

            <div className={styles.environmentBar}>
              <div>
                <span>Airport</span>
                <strong>
                  {environment.airport
                    ? `${environment.airport.icao} · ${environment.airport.name}`
                    : current.departure.icao}
                </strong>
                <small>
                  {environment.airport
                    ? `${environment.airport.elevationFt.toLocaleString("en-US")} ft field elevation`
                    : environment.airportState === "error"
                      ? "Airport data unavailable"
                      : "Loading airport data…"}
                </small>
              </div>
              <div>
                <span>Weather</span>
                <strong>{weatherLabel}</strong>
                <small>{environment.metar?.rawText ?? "Manual environment values remain available."}</small>
              </div>
              <button
                className={styles.compactAction}
                disabled={environment.weatherState === "loading"}
                onClick={() => void environment.refreshWeather()}
                type="button"
              >
                Refresh weather
              </button>
            </div>

            <div className={styles.inputGrid}>
              <label>
                Runway
                <select
                  aria-label="Takeoff runway"
                  disabled={!environment.airport || !environment.runwayOptions.length}
                  onChange={(event) => environment.setRunwayIdent(event.target.value)}
                  value={environment.runwayIdent}
                >
                  <option value="">Select runway</option>
                  {environment.runwayOptions.map((option) => (
                    <option key={`${option.runway.id}-${option.ident}`} value={option.ident}>
                      {option.ident} · {option.runway.surfaceLengthFt.toLocaleString("en-US")} ft · {option.runway.surface ?? "surface n/a"}
                    </option>
                  ))}
                </select>
                {environment.runwayContext ? (
                  <small>
                    {environment.runwayContext.headingTrueDeg === undefined
                      ? "Heading n/a"
                      : `${Math.round(environment.runwayContext.headingTrueDeg)}°T`}
                    {" · "}
                    Surface length {environment.runwayContext.surfaceLengthFt.toLocaleString("en-US")} ft — not declared TORA
                  </small>
                ) : null}
              </label>

              <label>
                Takeoff weight
                <span>
                  <input
                    inputMode="decimal"
                    min="1"
                    name="takeoffWeight"
                    onChange={(event) => setTakeoffWeight(event.target.value)}
                    type="number"
                    value={takeoffWeight}
                  />
                  <small>{current.weight.unit}</small>
                </span>
              </label>

              <label>
                Flaps
                <select
                  aria-label="Takeoff flaps"
                  disabled={!takeoffCalculator?.flapOptions.length}
                  onChange={(event) => setFlaps(event.target.value)}
                  value={flaps}
                >
                  {(takeoffCalculator?.flapOptions ?? []).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className={styles.toggleInput}>
                <span>Anti-ice</span>
                <button
                  aria-pressed={antiIce}
                  className={styles.toggleButton}
                  onClick={() => setAntiIce((value) => !value)}
                  type="button"
                >
                  {antiIce ? "ON" : "OFF"}
                </button>
              </label>

              <label>
                QNH
                <span>
                  <input
                    inputMode="decimal"
                    name="qnh"
                    onChange={(event) => environment.setQnhManual(event.target.value)}
                    step="any"
                    type="number"
                    value={environment.qnh.value}
                  />
                  <small>hPa</small>
                </span>
                <small>
                  {environment.qnh.mode === "manual" ? "MANUAL" : "AUTO · METAR"}
                  {environment.qnh.mode === "manual" && environment.metar?.qnhHpa !== undefined ? (
                    <button className={styles.inlineReset} onClick={environment.resetQnhAuto} type="button">
                      Reset to automatic
                    </button>
                  ) : null}
                </small>
              </label>

              <label>
                OAT
                <span>
                  <input
                    inputMode="decimal"
                    name="oat"
                    onChange={(event) => environment.setOatManual(event.target.value)}
                    step="any"
                    type="number"
                    value={environment.oat.value}
                  />
                  <small>°C</small>
                </span>
                <small>
                  {environment.oat.mode === "manual" ? "MANUAL" : "AUTO · METAR"}
                  {environment.oat.mode === "manual" && environment.metar?.temperatureC !== undefined ? (
                    <button className={styles.inlineReset} onClick={environment.resetOatAuto} type="button">
                      Reset to automatic
                    </button>
                  ) : null}
                </small>
              </label>

              <label>
                Pressure altitude
                <span>
                  <input
                    inputMode="decimal"
                    name="pressureAltitude"
                    onChange={(event) => environment.setPressureAltitudeManual(event.target.value)}
                    type="number"
                    value={environment.pressureAltitude.value}
                  />
                  <small>ft</small>
                </span>
                <small>
                  {environment.pressureAltitude.mode === "manual"
                    ? "MANUAL"
                    : "AUTO · field elevation + QNH"}
                  {environment.pressureAltitude.mode === "manual" ? (
                    <button
                      className={styles.inlineReset}
                      onClick={environment.resetPressureAltitudeAuto}
                      type="button"
                    >
                      Reset to automatic
                    </button>
                  ) : null}
                </small>
              </label>

              <div className={styles.windContext}>
                <span>Runway wind</span>
                <strong>
                  {environment.wind
                    ? `HW ${signedKnots(environment.wind.headwindKt)} · XW ${signedKnots(Math.abs(environment.wind.crosswindKt))}`
                    : "—"}
                </strong>
                <small>Context only unless a source-backed calculator explicitly binds wind.</small>
              </div>
            </div>

            <button
              className={styles.action}
              disabled={busy || !currentContext}
              onClick={calculateFromForm}
              type="button"
            >
              {busy
                ? "Calculating…"
                : result
                  ? "Recalculate takeoff"
                  : "Calculate takeoff"}
            </button>
          </section>

          <section className={styles.resultPane} aria-label="Performance result">
            <header className={styles.resultHeader}>
              <div>
                <p className={styles.eyebrow}>TAKEOFF · RESULT</p>
                <h2>Takeoff</h2>
              </div>
              {result ? (
                <span className={stale ? styles.resultBadgeStale : styles.resultBadge}>
                  {stale ? "RECALCULATE" : "CURRENT INPUTS"}
                </span>
              ) : null}
            </header>
            {resultContent}
          </section>
        </div>
      ) : (
        <div className={styles.compactResult}>{resultContent}</div>
      )}
    </section>
  );
}

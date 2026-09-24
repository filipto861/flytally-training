"use client";

import Link from "next/link";

import type { ActiveFlight } from "@/lib/active-flight/types";
import type { SelectedRunwayContext } from "@/lib/aviation/airport-types";
import type { PilotLandingCalculatorDefinition } from "@/lib/pilot-landing-calculator";
import type { OperationWeatherSource } from "@/lib/performance/operation-weather";
import type { PerformanceDataset } from "@/lib/universal-aircraft-content";
import { formatObservationZulu } from "@/lib/weather/metar-snapshot-helpers";

import { FtPerformanceContextLabel, type FtPerformanceContextKind } from "./FtPerformanceContextLabel";
import { FtPerformanceInvalidation } from "./FtPerformanceInvalidation";
import { FtLandingPerformanceStrip } from "./FtLandingPerformanceStrip";
import {
  useLandingPerformanceOperation,
  type LandingPerformanceOperationController,
} from "./use-landing-performance-operation";
import styles from "./ft-performance.module.css";

function sourceLabel(source: OperationWeatherSource): string {
  if (source === "metar") return "METAR";
  if (source === "manual") return "MANUAL";
  if (source === "legacy-unknown") return "STORED";
  return "NOT SET";
}

function runwayDescription(context: SelectedRunwayContext | undefined): string {
  if (!context) return "Select runway";
  return [
    `RWY ${context.runwayIdent}`,
    `${context.surfaceLengthFt.toLocaleString("en-US")} ft`,
    context.surface ?? undefined,
    context.headingTrueDeg === undefined ? undefined : `${Math.round(context.headingTrueDeg)}°T`,
  ].filter(Boolean).join(" · ");
}

export function FtLandingPerformanceOperationPresentation({
  aircraftId,
  operation,
  landingCalculator,
  view,
  showInputs = false,
}: Readonly<{
  aircraftId: string;
  operation: LandingPerformanceOperationController;
  landingCalculator?: PilotLandingCalculatorDefinition;
  view: FtPerformanceContextKind;
  showInputs?: boolean;
}>) {
  const {
    currentFlight: current,
    hydrated,
    busy,
    result,
    stale,
    changes,
    invalidationMessage,
    canCalculate,
    airportDataState,
    selectedAirportName,
    selectedAirportElevationFt,
    runwayOptions,
    runwayContext,
    runwayIdentifier,
    landingWeight,
    landingWeightUnit,
    flaps,
    appliedWeather,
    availableWeather,
    weatherFetchState,
    newerWeatherAvailable,
    latestWeatherActionNeeded,
    pressureAltitudeFt,
    wind,
    currentContext,
    setRunwayIdentifier,
    setLandingWeight,
    setFlaps,
    setManualQnh,
    setManualOat,
    calculate,
    recalculate,
    applyLatestMetar,
  } = operation;

  const resultContent = !hydrated ? (
    <div className={styles.emptyState}><p>Loading Landing performance context…</p></div>
  ) : !current ? (
    <div className={styles.emptyState}>
      <p>No active flight. Landing performance is tied to an explicit Active Flight context.</p>
      <Link className={styles.secondaryAction} href={"/aircraft/" + aircraftId + "/flight"}>
        Start active flight
      </Link>
    </div>
  ) : result ? (
    <>
      {stale ? (
        <FtPerformanceInvalidation
          busy={busy}
          changes={changes}
          message={invalidationMessage}
          onRecalculate={recalculate}
          recalculateDisabled={!canCalculate}
        />
      ) : null}
      <FtLandingPerformanceStrip result={result} stale={stale} />
      <p className={styles.timestamp}>
        {stale
          ? "Stored Landing result needs recalculation for the current inputs."
          : "Calculated " + new Date(result.computedAt).toLocaleString("en-GB")}
      </p>
    </>
  ) : (
    <div className={styles.resultEmpty}>
      <span>{currentContext ? "RESULT" : "SETUP"}</span>
      <strong>{currentContext ? "No Landing performance computed yet" : "Landing setup required"}</strong>
      <p>
        {currentContext
          ? "Review the source-backed inputs and calculate."
          : "Select a destination runway and complete the required Landing inputs."}
      </p>
      {!showInputs ? (
        <Link
          className={styles.secondaryAction}
          href={"/aircraft/" + aircraftId + "/performance"}
        >
          Open Performance
        </Link>
      ) : null}
    </div>
  );

  return (
    <section
      className={styles.presentation}
      aria-label="Landing Performance"
      data-empty={current && result ? "false" : "true"}
      data-performance-view={view}
      data-performance-operation={operation.operation}
    >
      <FtPerformanceContextLabel context={view} />

      {current && showInputs ? (
        <div className={styles.performanceWorkspace}>
          <section className={styles.inputBlock} aria-label="Landing performance inputs">
            <header className={styles.paneHeader}>
              <p className={styles.eyebrow}>LANDING INPUTS</p>
              <h2>{current.destination.icao} arrival</h2>
              <p className={styles.inputHelp}>
                Active Flight supplies the destination and planning weight. Landing owns its runway, landing weight, governed configuration and applied arrival weather.
              </p>
            </header>

            {!landingCalculator ? (
              <p className={styles.requirementNote}>
                No source-backed Landing calculator is available for this aircraft configuration.
              </p>
            ) : null}

            <div className={styles.setupGrid}>
              <label className={styles.setupField}>
                <span>Runway</span>
                <select
                  aria-label="Landing runway"
                  disabled={airportDataState !== "ready" || !runwayOptions.length}
                  onChange={(event) => setRunwayIdentifier(event.target.value)}
                  value={runwayIdentifier}
                >
                  <option value="">Select runway</option>
                  {runwayOptions.map((option) => (
                    <option key={`${option.runway.id}-${option.ident}`} value={option.ident}>
                      {option.ident} · {option.runway.surfaceLengthFt.toLocaleString("en-US")} ft
                      {option.runway.surface ? ` · ${option.runway.surface}` : ""}
                    </option>
                  ))}
                </select>
                <small>
                  {airportDataState === "error"
                    ? "Airport/runway data unavailable."
                    : selectedAirportName && selectedAirportElevationFt !== undefined
                      ? `${selectedAirportName} · field elevation ${selectedAirportElevationFt.toLocaleString("en-US")} ft`
                      : "Destination airport not present in the bundled runway dataset."}
                </small>
              </label>

              <label className={styles.setupField}>
                <span>Landing weight</span>
                <span className={styles.inputWithUnit}>
                  <input
                    aria-label="Landing weight"
                    inputMode="decimal"
                    min="1"
                    onChange={(event) => setLandingWeight(event.target.value)}
                    step="0.1"
                    type="number"
                    value={landingWeight}
                  />
                  <small>{landingWeightUnit}</small>
                </span>
                <small>Initialized from Active Flight planning weight; Landing owns the editable operation value.</small>
              </label>

              <label className={styles.setupField}>
                <span>Flaps</span>
                <select
                  aria-label="Landing flaps"
                  disabled={!landingCalculator?.flapOptions.length}
                  onChange={(event) => setFlaps(event.target.value)}
                  value={flaps}
                >
                  {(landingCalculator?.flapOptions ?? []).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <small>Governed by the source-backed Landing performance package.</small>
              </label>
            </div>

            <div className={styles.contextPanel}>
              <div className={styles.contextPanelHeader}>
                <div>
                  <p className={styles.eyebrow}>ARRIVAL ENVIRONMENT</p>
                  <strong>{current.destination.icao} weather</strong>
                </div>
                <span className={styles.sourceChip} data-state={weatherFetchState}>
                  {weatherFetchState === "loading"
                    ? "LOADING"
                    : weatherFetchState === "ready"
                      ? "METAR AVAILABLE"
                      : weatherFetchState === "unavailable"
                        ? "MANUAL"
                        : "—"}
                </span>
              </div>

              {availableWeather ? (
                <p className={styles.sourceMeta}>
                  Available · AviationWeather.gov · observed {formatObservationZulu(availableWeather.observedAt)}
                </p>
              ) : weatherFetchState === "unavailable" ? (
                <p className={styles.sourceMeta}>Live destination METAR unavailable. Enter the required values manually.</p>
              ) : null}

              {appliedWeather.observation ? (
                <p className={styles.sourceMeta}>
                  Applied METAR · observed {formatObservationZulu(appliedWeather.observation.observedAt)}
                </p>
              ) : (
                <p className={styles.sourceMeta}>
                  Applied weather · QNH {sourceLabel(appliedWeather.qnhHpa.source)} · OAT {sourceLabel(appliedWeather.oatC.source)}
                </p>
              )}

              {newerWeatherAvailable && availableWeather ? (
                <div className={styles.weatherUpdate} role="status">
                  <div>
                    <strong>NEWER WEATHER AVAILABLE</strong>
                    <span>
                      {formatObservationZulu(availableWeather.observedAt)} available; the current Landing calculation keeps its applied weather until you choose to update it.
                    </span>
                  </div>
                  <button
                    className={styles.inlineAction}
                    disabled={busy}
                    onClick={applyLatestMetar}
                    type="button"
                  >
                    {busy ? "Recalculating…" : "Apply & recalculate"}
                  </button>
                </div>
              ) : latestWeatherActionNeeded && availableWeather ? (
                <div className={styles.weatherAction}>
                  <span>Latest destination METAR is available without replacing manual/applied values automatically.</span>
                  <button
                    className={styles.inlineAction}
                    disabled={busy}
                    onClick={applyLatestMetar}
                    type="button"
                  >
                    {result ? "Apply latest & recalculate" : "Use latest METAR"}
                  </button>
                </div>
              ) : null}

              <div className={styles.inputGrid}>
                <label>
                  QNH
                  <span>
                    <input
                      inputMode="decimal"
                      name="landing-qnh"
                      aria-label="Landing QNH"
                      onChange={(event) => setManualQnh(event.target.value)}
                      placeholder="1013.25"
                      step="0.01"
                      type="number"
                      value={appliedWeather.qnhHpa.value ?? ""}
                    />
                    <small>hPa</small>
                  </span>
                  <small className={styles.fieldMeta}>
                    {sourceLabel(appliedWeather.qnhHpa.source)}
                  </small>
                </label>

                <label>
                  OAT
                  <span>
                    <input
                      inputMode="decimal"
                      name="landing-oat"
                      aria-label="Landing OAT"
                      onChange={(event) => setManualOat(event.target.value)}
                      placeholder="15"
                      step="any"
                      type="number"
                      value={appliedWeather.oatC.value ?? ""}
                    />
                    <small>°C</small>
                  </span>
                  <small className={styles.fieldMeta}>
                    {sourceLabel(appliedWeather.oatC.source)}
                  </small>
                </label>
              </div>

              <dl className={styles.environmentFacts}>
                <div>
                  <dt>Pressure altitude</dt>
                  <dd>{pressureAltitudeFt === undefined ? "—" : `${pressureAltitudeFt.toLocaleString("en-US")} ft`}</dd>
                </div>
                <div>
                  <dt>Runway context</dt>
                  <dd>{runwayDescription(runwayContext)}</dd>
                </div>
                <div>
                  <dt>Headwind</dt>
                  <dd>{wind ? `${wind.headwindKt >= 0 ? "+" : ""}${wind.headwindKt.toFixed(1)} kt` : "—"}</dd>
                </div>
                <div>
                  <dt>Crosswind</dt>
                  <dd>{wind ? `${wind.crosswindKt >= 0 ? "+" : ""}${wind.crosswindKt.toFixed(1)} kt` : "—"}</dd>
                </div>
              </dl>
              <p className={styles.requirementNote}>
                Wind is shown as arrival context only. B5 does not apply wind, slope or declared-distance corrections to Landing outputs.
              </p>
            </div>

            <button
              className={styles.action}
              disabled={busy || !canCalculate}
              onClick={calculate}
              type="button"
            >
              {busy
                ? "Calculating…"
                : result
                  ? "Recalculate Landing"
                  : "Calculate Landing"}
            </button>

            {!canCalculate ? (
              <p className={styles.requirementNote}>
                Select destination runway and provide valid Landing weight, governed flaps, QNH and OAT before calculating.
              </p>
            ) : null}
          </section>

          <section className={styles.resultPane} aria-label="Landing performance result">
            <header className={styles.resultHeader}>
              <div>
                <p className={styles.eyebrow}>RESULT</p>
                <h2>Landing</h2>
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

export function FtLandingPerformancePresentation({
  aircraftId,
  activeFlight,
  datasets,
  landingCalculator,
  selectedVariant,
  view,
  showInputs = false,
}: Readonly<{
  aircraftId: string;
  activeFlight?: ActiveFlight | null;
  datasets: readonly PerformanceDataset[];
  landingCalculator?: PilotLandingCalculatorDefinition;
  selectedVariant?: string;
  view: FtPerformanceContextKind;
  showInputs?: boolean;
}>) {
  const operation = useLandingPerformanceOperation({
    aircraftId,
    activeFlight,
    selectedVariant,
    datasets,
    landingCalculator,
  });

  return (
    <FtLandingPerformanceOperationPresentation
      aircraftId={aircraftId}
      operation={operation}
      landingCalculator={landingCalculator}
      view={view}
      showInputs={showInputs}
    />
  );
}

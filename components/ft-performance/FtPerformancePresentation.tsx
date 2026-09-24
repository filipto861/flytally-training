"use client";

import Link from "next/link";

import type { ActiveFlight } from "@/lib/active-flight/types";
import type { SelectedRunwayContext } from "@/lib/aviation/airport-types";
import type { PilotTakeoffCalculatorDefinition } from "@/lib/pilot-takeoff-calculator";
import type { OperationWeatherSource } from "@/lib/performance/operation-weather";
import type { PerformanceDataset } from "@/lib/universal-aircraft-content";
import { formatObservationZulu } from "@/lib/weather/metar-snapshot-helpers";

import { FtPerformanceContextLabel, type FtPerformanceContextKind } from "./FtPerformanceContextLabel";
import { FtPerformanceInvalidation } from "./FtPerformanceInvalidation";
import { FtPerformanceStrip } from "./FtPerformanceStrip";
import {
  usePerformanceOperation,
  type TakeoffPerformanceOperationController,
} from "./use-performance-operation";
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

export function FtPerformanceOperationPresentation({
  aircraftId,
  operation,
  takeoffCalculator,
  view,
  showInputs = false,
}: Readonly<{
  aircraftId: string;
  operation: TakeoffPerformanceOperationController;
  takeoffCalculator?: PilotTakeoffCalculatorDefinition;
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
    toraFt,
    asdaFt,
    declaredDistanceConstraint,
    takeoffWeight,
    takeoffWeightUnit,
    flaps,
    antiIce,
    appliedWeather,
    availableWeather,
    weatherFetchState,
    newerWeatherAvailable,
    latestWeatherActionNeeded,
    pressureAltitudeFt,
    wind,
    currentContext,
    setRunwayIdentifier,
    setToraFt,
    setAsdaFt,
    setTakeoffWeight,
    setFlaps,
    setAntiIce,
    setManualQnh,
    setManualOat,
    calculate,
    recalculate,
    applyLatestMetar,
  } = operation;

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
      {stale ? (
        <FtPerformanceInvalidation
          busy={busy}
          changes={changes}
          message={invalidationMessage}
          onRecalculate={recalculate}
          recalculateDisabled={!canCalculate}
        />
      ) : null}
      <FtPerformanceStrip result={result} stale={stale} />
      <p className={styles.timestamp}>
        {stale
          ? "Stored result needs recalculation for the current inputs."
          : "Calculated " + new Date(result.computedAt).toLocaleString("en-GB")}
      </p>
    </>
  ) : (
    <div className={styles.resultEmpty}>
      <span>{currentContext ? "RESULT" : "SETUP"}</span>
      <strong>{currentContext ? "No performance computed yet" : "Performance setup required"}</strong>
      <p>
        {currentContext
          ? "Review the source-backed inputs and calculate."
          : "Select a departure runway and complete the required Takeoff inputs."}
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
      aria-label="Performance"
      data-empty={current && result ? "false" : "true"}
      data-performance-view={view}
      data-performance-operation={operation.operation}
    >
      <FtPerformanceContextLabel context={view} />

      {current && showInputs ? (
        <div className={styles.performanceWorkspace}>
          <section className={styles.inputBlock} aria-label="Performance inputs">
            <header className={styles.paneHeader}>
              <p className={styles.eyebrow}>TAKEOFF INPUTS</p>
              <h2>{current.departure.icao} departure</h2>
              <p className={styles.inputHelp}>
                Active Flight supplies the route and planning weight. Performance owns the selected runway, Takeoff configuration and applied calculation environment.
              </p>
            </header>

            <div className={styles.setupGrid}>
              <label className={styles.setupField}>
                <span>Runway</span>
                <select
                  aria-label="Takeoff runway"
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
                      : "Departure airport not present in the bundled runway dataset."}
                </small>
              </label>

              <label className={styles.setupField}>
                <span>Takeoff weight</span>
                <span className={styles.inputWithUnit}>
                  <input
                    aria-label="Takeoff weight"
                    inputMode="decimal"
                    min="1"
                    onChange={(event) => setTakeoffWeight(event.target.value)}
                    step="0.1"
                    type="number"
                    value={takeoffWeight}
                  />
                  <small>{takeoffWeightUnit}</small>
                </span>
                <small>Initialized from Active Flight planning weight.</small>
              </label>

              <label className={styles.setupField}>
                <span>TORA <small>optional</small></span>
                <span className={styles.inputWithUnit}>
                  <input
                    aria-label="Takeoff TORA"
                    inputMode="decimal"
                    min="1"
                    onChange={(event) => setToraFt(event.target.value)}
                    placeholder="Declared TORA"
                    step="1"
                    type="number"
                    value={toraFt}
                  />
                  <small>ft</small>
                </span>
                <small>Manual declared distance. Never inferred from physical runway length.</small>
              </label>

              <label className={styles.setupField}>
                <span>ASDA <small>optional</small></span>
                <span className={styles.inputWithUnit}>
                  <input
                    aria-label="Takeoff ASDA"
                    inputMode="decimal"
                    min="1"
                    onChange={(event) => setAsdaFt(event.target.value)}
                    placeholder="Declared ASDA"
                    step="1"
                    type="number"
                    value={asdaFt}
                  />
                  <small>ft</small>
                </span>
                <small>Required with TORA only for runway-limited / Partial Power calculations.</small>
              </label>

              <label className={styles.setupField}>
                <span>Flaps</span>
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
                <small>Governed by the aircraft Takeoff performance package.</small>
              </label>

              <label className={styles.setupField}>
                <span>Anti-ice</span>
                <select
                  aria-label="Takeoff anti-ice"
                  onChange={(event) => setAntiIce(event.target.value === "on")}
                  value={antiIce ? "on" : "off"}
                >
                  <option value="off">OFF</option>
                  <option value="on">ON</option>
                </select>
                <small>Unsupported source combinations fail closed.</small>
              </label>
            </div>

            <div className={styles.contextPanel}>
              <div className={styles.contextPanelHeader}>
                <div>
                  <p className={styles.eyebrow}>ENVIRONMENT</p>
                  <strong>{current.departure.icao} weather</strong>
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
                <p className={styles.sourceMeta}>Live METAR unavailable. Enter the required values manually.</p>
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
                      {formatObservationZulu(availableWeather.observedAt)} available; the current calculation keeps its applied weather until you choose to update it.
                    </span>
                  </div>
                  <button
                    className={styles.inlineAction}
                    disabled={busy || !canCalculate}
                    onClick={applyLatestMetar}
                    type="button"
                  >
                    {busy ? "Recalculating…" : "Apply & recalculate"}
                  </button>
                </div>
              ) : latestWeatherActionNeeded && availableWeather ? (
                <div className={styles.weatherAction}>
                  <span>Latest METAR is available without replacing manual/applied values automatically.</span>
                  <button
                    className={styles.inlineAction}
                    disabled={busy || Boolean(result && !canCalculate)}
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
                      name="qnh"
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
                      name="oat"
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
                  <dt>Declared takeoff limit</dt>
                  <dd>
                    {declaredDistanceConstraint.status === "ready"
                      ? `${declaredDistanceConstraint.usableTakeoffFieldLengthFt.toLocaleString("en-US")} ft · ${declaredDistanceConstraint.limitingDistance}`
                      : declaredDistanceConstraint.status === "invalid"
                        ? "Invalid declared distance"
                        : declaredDistanceConstraint.missing.length === 2
                          ? "Not provided"
                          : `Missing ${declaredDistanceConstraint.missing.join(" + ")}`}
                  </dd>
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
                  ? "Recalculate Takeoff"
                  : "Calculate Takeoff"}
            </button>

            {!canCalculate ? (
              <p className={styles.requirementNote}>
                Select runway and provide valid Takeoff weight, flap configuration, QNH and OAT before calculating.
              </p>
            ) : null}
          </section>

          <section className={styles.resultPane} aria-label="Performance result">
            <header className={styles.resultHeader}>
              <div>
                <p className={styles.eyebrow}>RESULT</p>
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

export function FtPerformancePresentation({
  aircraftId,
  activeFlight,
  datasets,
  takeoffCalculator,
  selectedVariant,
  view,
  showInputs = false,
}: Readonly<{
  aircraftId: string;
  activeFlight?: ActiveFlight | null;
  datasets: readonly PerformanceDataset[];
  takeoffCalculator?: PilotTakeoffCalculatorDefinition;
  selectedVariant?: string;
  view: FtPerformanceContextKind;
  showInputs?: boolean;
}>) {
  const operation = usePerformanceOperation("TAKEOFF", {
    aircraftId,
    activeFlight,
    selectedVariant,
    datasets,
    takeoffCalculator,
  });

  return (
    <FtPerformanceOperationPresentation
      aircraftId={aircraftId}
      operation={operation}
      takeoffCalculator={takeoffCalculator}
      view={view}
      showInputs={showInputs}
    />
  );
}

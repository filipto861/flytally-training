"use client";

import Link from "next/link";

import type { ActiveFlight } from "@/lib/active-flight/types";
import type { SelectedRunwayContext } from "@/lib/aviation/airport-types";
import type { PilotTakeoffCalculatorDefinition } from "@/lib/pilot-takeoff-calculator";
import type { OperationWeatherSource } from "@/lib/performance/operation-weather";
import type { PerformanceDataset } from "@/lib/universal-aircraft-content";

import { FtPerformanceContextLabel, type FtPerformanceContextKind } from "./FtPerformanceContextLabel";
import { FtPerformanceInvalidation } from "./FtPerformanceInvalidation";
import { FtPerformanceStrip } from "./FtPerformanceStrip";
import {
  usePerformanceOperation,
  type PartialPowerPreviewState,
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

function previewMetric(
  metric: PartialPowerPreviewState["vr"],
): string {
  if (metric.status !== "ready" || metric.value === undefined) return "—";
  const precision = metric.precision ?? 0;
  const value = precision > 0 ? metric.value.toFixed(precision) : Math.round(metric.value).toString();
  return metric.unit ? `${value} ${metric.unit}` : value;
}

function partialPowerFailureText(
  preview: PartialPowerPreviewState,
): string {
  const evaluation = preview.evaluation;
  if (evaluation.status === "unsupported") return evaluation.reason;
  if (evaluation.status === "invalid") return evaluation.errors.join(" ");
  if (evaluation.status === "ineligible") {
    return evaluation.failedChecks.map((check) => check.reason ?? check.label).join(" ");
  }
  if (evaluation.status === "no-solution") {
    if (evaluation.reason === "ambient-weight-limit") {
      return "Actual takeoff weight exceeds the source-backed ambient performance weight limit.";
    }
    if (evaluation.reason === "no-reduced-thrust-candidate") {
      return "No source-supported assumed temperature above ambient is available.";
    }
    return "No source-supported assumed-temperature candidate satisfies both runway and weight constraints.";
  }
  return "Partial Power preview is unavailable.";
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
    runwayOptions,
    runwayContext,
    runwayIdentifier,
    toraFt,
    toraInputSource,
    asdaFt,
    declaredDistanceConstraint,
    takeoffWeight,
    takeoffWeightUnit,
    flaps,
    antiIce,
    thrustMode,
    partialPowerRunwayDryHardPaved,
    partialPowerAntiSkidOperative,
    partialPowerFullRatedTakeoffWithin30Days,
    partialPowerPreview,
    appliedWeather,
    availableWeather,
    weatherFetchState,
    newerWeatherAvailable,
    latestWeatherActionNeeded,
    pressureAltitudeFt,
    performancePressureAltitudeFt,
    pressureAltitudeMethod,
    wind,
    currentContext,
    setRunwayIdentifier,
    setToraFt,
    confirmSuggestedTora,
    setAsdaFt,
    setTakeoffWeight,
    setFlaps,
    setAntiIce,
    setThrustMode,
    setPartialPowerThrustReversers,
    setPartialPowerRunwayDryHardPaved,
    setPartialPowerAntiSkidOperative,
    setPartialPowerFullRatedTakeoffWithin30Days,
    setManualQnh,
    setManualOat,
    calculate,
    recalculate,
    applyLatestMetar,
  } = operation;

  const hasDisplayedCalculation = thrustMode === "partial-power"
    ? Boolean(partialPowerPreview)
    : Boolean(result);

  const partialPowerContent = !partialPowerPreview ? (
    <div className={styles.resultEmpty}>
      <span>PARTIAL POWER</span>
      <strong>Ready to calculate</strong>
    </div>
  ) : partialPowerPreview.evaluation.status === "source-supported" ? (
    <div className={styles.partialPowerResult}>
      <div className={styles.partialPowerWarning} role="status">
        <strong>TRAINING PREVIEW · 25% THRUST LIMIT UNVERIFIED</strong>
      </div>
      <div className={styles.partialPowerMetrics}>
        <div><span>Assumed Temp</span><strong>{partialPowerPreview.evaluation.assumedTemperature.toFixed(1)} °C</strong></div>
        <div><span>Target N1</span><strong>{partialPowerPreview.evaluation.reducedN1.toFixed(1)} %</strong></div>
        <div><span>V1</span><strong>{Math.round(partialPowerPreview.evaluation.v1)} KIAS</strong></div>
        <div><span>VR</span><strong>{previewMetric(partialPowerPreview.vr)}</strong></div>
        <div><span>V2</span><strong>{previewMetric(partialPowerPreview.v2)}</strong></div>
        <div><span>Takeoff Distance</span><strong>{Math.round(partialPowerPreview.evaluation.correctedTakeoffDistance).toLocaleString("en-US")} FT</strong></div>
      </div>
      <dl className={styles.partialPowerFacts}>
        <div>
          <dt>Full Rated N1</dt>
          <dd>{partialPowerPreview.evaluation.fullRatedN1.toFixed(1)} %</dd>
        </div>
        <div>
          <dt>N1 reduction</dt>
          <dd>{partialPowerPreview.evaluation.n1ReductionPoints.toFixed(1)} points</dd>
        </div>
        <div>
          <dt>Usable field length</dt>
          <dd>{Math.round(partialPowerPreview.evaluation.usableTakeoffFieldLength).toLocaleString("en-US")} ft · {partialPowerPreview.evaluation.limitingDeclaredDistance}</dd>
        </div>
      </dl>
    </div>
  ) : (
    <div className={styles.resultEmpty}>
      <span>PARTIAL POWER</span>
      <strong>Partial Power unavailable for these inputs</strong>
      <p>{partialPowerFailureText(partialPowerPreview)}</p>
    </div>
  );

  const resultContent = thrustMode === "partial-power" ? partialPowerContent : !hydrated ? (
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
      data-empty={current && hasDisplayedCalculation ? "false" : "true"}
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
                {airportDataState === "error" ? (
                  <small>Runway data unavailable</small>
                ) : null}
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

              </label>

              <label className={styles.setupField}>
                <span>Takeoff thrust</span>
                <select
                  aria-label="Takeoff thrust mode"
                  onChange={(event) => {
                    const nextMode = event.target.value === "partial-power"
                      ? "partial-power"
                      : "full-rated";
                    setThrustMode(nextMode);
                    if (nextMode === "partial-power") {
                      setPartialPowerThrustReversers("aeronca");
                    }
                  }}
                  value={thrustMode}
                >
                  <option value="full-rated">Full Rated</option>
                  <option value="partial-power">Partial Power · Aeronca</option>
                </select>
              </label>

              <label className={styles.setupField}>
                <span>TORA</span>
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
                {toraInputSource === "airport-surface-suggestion" ? (
                  <button
                    className={styles.inlineAction}
                    onClick={confirmSuggestedTora}
                    type="button"
                  >
                    Confirm TORA
                  </button>
                ) : null}
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

              </label>

              {thrustMode === "partial-power" ? (
                <label className={styles.setupField}>
                  <span>ASDA</span>
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
                </label>
              ) : null}
            </div>

            {thrustMode === "partial-power" ? (
              <section className={styles.partialPowerSetup} aria-label="Partial Power setup">
                <div className={styles.eligibilityChecks}>
                  <label>
                    <input
                      checked={partialPowerRunwayDryHardPaved}
                      onChange={(event) => setPartialPowerRunwayDryHardPaved(event.target.checked)}
                      type="checkbox"
                    />
                    <span>Dry hard-paved</span>
                  </label>
                  <label>
                    <input
                      checked={partialPowerAntiSkidOperative}
                      onChange={(event) => setPartialPowerAntiSkidOperative(event.target.checked)}
                      type="checkbox"
                    />
                    <span>Anti-skid operative</span>
                  </label>
                  <label>
                    <input
                      checked={partialPowerFullRatedTakeoffWithin30Days}
                      onChange={(event) => setPartialPowerFullRatedTakeoffWithin30Days(event.target.checked)}
                      type="checkbox"
                    />
                    <span>Full-rated &lt;30 days</span>
                  </label>
                </div>
              </section>
            ) : (
              <details className={styles.declaredDistanceDetails}>
                <summary>Declared distances</summary>
                <label className={styles.setupField}>
                  <span>ASDA</span>
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
                </label>
              </details>
            )}

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

              {newerWeatherAvailable && availableWeather ? (
                <div className={styles.weatherUpdate} role="status">
                  <strong>NEWER METAR</strong>
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
                  <button
                    className={styles.inlineAction}
                    disabled={busy || Boolean(hasDisplayedCalculation && !canCalculate)}
                    onClick={applyLatestMetar}
                    type="button"
                  >
                    {hasDisplayedCalculation ? "Apply latest & recalculate" : "Use latest METAR"}
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
                {pressureAltitudeMethod === "sea-level-floor" ? (
                  <div>
                    <dt>Performance PA</dt>
                    <dd>{performancePressureAltitudeFt?.toLocaleString("en-US")} ft · S.L. chart floor</dd>
                  </div>
                ) : null}
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
                        : toraInputSource === "airport-surface-suggestion"
                          ? "TORA prefill needs verification"
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
              aria-busy={busy}
              className={styles.action}
              data-loading={busy ? "true" : "false"}
              disabled={busy || !canCalculate}
              onClick={calculate}
              type="button"
            >
              {busy
                ? "Calculating…"
                : thrustMode === "partial-power"
                  ? partialPowerPreview
                    ? "Recalculate Partial Power"
                    : "Calculate Partial Power"
                  : result
                    ? "Recalculate Takeoff"
                    : "Calculate Takeoff"}
            </button>

            {!canCalculate ? (
              <p className={styles.requirementNote}>
                {thrustMode === "partial-power"
                  ? "Complete required Partial Power inputs."
                  : "Complete required Takeoff inputs."}
              </p>
            ) : null}
          </section>

          <section className={styles.resultPane} aria-label="Performance result">
            <header className={styles.resultHeader}>
              <div>
                <p className={styles.eyebrow}>RESULT</p>
                <h2>{thrustMode === "partial-power" ? "Takeoff · Partial Power" : "Takeoff"}</h2>
              </div>
              {thrustMode === "partial-power" ? (
                <span className={styles.resultBadgeStale}>
                  TRAINING PREVIEW
                </span>
              ) : result ? (
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

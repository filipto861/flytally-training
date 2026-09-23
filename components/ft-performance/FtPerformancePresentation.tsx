"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import type { ActiveFlight } from "@/lib/active-flight/types";
import {
  findAirport,
  loadAirportDataset,
} from "@/lib/aviation/airport-dataset";
import type {
  AirportDatasetV1,
  SelectedRunwayContext,
} from "@/lib/aviation/airport-types";
import {
  availableRunwayEnds,
  resolveRunwayEnd,
} from "@/lib/aviation/runway-context";
import { calculatePressureAltitudeFt } from "@/lib/aviation/pressure-altitude";
import { calculateWindComponents } from "@/lib/aviation/wind-component";
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
import type { PerformanceDataset } from "@/lib/universal-aircraft-content";
import {
  formatObservationZulu,
  isMetarSnapshot,
} from "@/lib/weather/metar-snapshot-helpers";
import type { MetarSnapshot } from "@/lib/weather/metar-types";
import { useActiveFlightState } from "@/components/ft-flight/use-active-flight";

import { FtPerformanceContextLabel, type FtPerformanceContextKind } from "./FtPerformanceContextLabel";
import { FtPerformanceInvalidation } from "./FtPerformanceInvalidation";
import { FtPerformanceStrip } from "./FtPerformanceStrip";
import styles from "./ft-performance.module.css";

type EnvironmentSource = "metar" | "manual" | "stored" | "unset";
type WeatherState = "idle" | "loading" | "ready" | "unavailable";

function numberFromInput(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function sourceLabel(source: EnvironmentSource): string {
  if (source === "metar") return "METAR";
  if (source === "manual") return "MANUAL";
  if (source === "stored") return "STORED";
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
  const [airportDataset, setAirportDataset] = useState<AirportDatasetV1 | null>(null);
  const [airportDataState, setAirportDataState] = useState<"loading" | "ready" | "error">("loading");
  const [runwayIdentifier, setRunwayIdentifier] = useState("");
  const [takeoffWeight, setTakeoffWeight] = useState("");
  const [takeoffWeightUnit, setTakeoffWeightUnit] = useState<"kg" | "lb">("lb");
  const [flaps, setFlaps] = useState("");
  const [antiIce, setAntiIce] = useState(false);
  const [qnh, setQnh] = useState("");
  const [oat, setOat] = useState("");
  const [qnhSource, setQnhSource] = useState<EnvironmentSource>("unset");
  const [oatSource, setOatSource] = useState<EnvironmentSource>("unset");
  const [metarSnapshot, setMetarSnapshot] = useState<MetarSnapshot | null>(null);
  const [weatherState, setWeatherState] = useState<WeatherState>("idle");
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const qnhManual = useRef(false);
  const oatManual = useRef(false);
  const previousDeparture = useRef<{ flightId: string; icao: string } | null>(null);

  useEffect(() => {
    let active = true;
    loadAirportDataset()
      .then((dataset) => {
        if (!active) return;
        setAirportDataset(dataset);
        setAirportDataState("ready");
      })
      .catch(() => {
        if (!active) return;
        setAirportDataset(null);
        setAirportDataState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const defaultFlaps = takeoffCalculator?.flapOptions[0]?.value ?? "";

    if (!current) {
      setResult(null);
      setRunwayIdentifier("");
      setTakeoffWeight("");
      setFlaps(defaultFlaps);
      setAntiIce(false);
      setQnh("");
      setOat("");
      setQnhSource("unset");
      setOatSource("unset");
      qnhManual.current = false;
      oatManual.current = false;
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
        setRunwayIdentifier(stored.context.runway.identifier);
        setTakeoffWeight(String(stored.context.weight.value));
        setTakeoffWeightUnit(stored.context.weight.unit);
        setFlaps(stored.context.configuration.flaps);
        setAntiIce(stored.context.configuration.antiIce);

        if (stored.context.weather) {
          setQnh(String(stored.context.weather.qnh));
          setOat(String(stored.context.weather.oat));
          setQnhSource("stored");
          setOatSource("stored");
          qnhManual.current = true;
          oatManual.current = true;
        } else {
          setQnh("");
          setOat(stored.calculationInputs.oatC === undefined ? "" : String(stored.calculationInputs.oatC));
          setQnhSource("unset");
          setOatSource(stored.calculationInputs.oatC === undefined ? "unset" : "stored");
          qnhManual.current = false;
          oatManual.current = stored.calculationInputs.oatC !== undefined;
        }
      } else {
        setRunwayIdentifier("");
        setTakeoffWeight(String(current.weight.value));
        setTakeoffWeightUnit(current.weight.unit);
        setFlaps(defaultFlaps);
        setAntiIce(false);
        setQnh("");
        setOat("");
        setQnhSource("unset");
        setOatSource("unset");
        qnhManual.current = false;
        oatManual.current = false;
      }
    };

    restore();
    window.addEventListener(PERFORMANCE_RESULT_EVENT, restore);
    setHydrated(true);
    return () => window.removeEventListener(PERFORMANCE_RESULT_EVENT, restore);
  }, [aircraftId, current?.id, takeoffCalculator]);

  useEffect(() => {
    if (!current) {
      previousDeparture.current = null;
      return;
    }

    const previous = previousDeparture.current;
    if (previous?.flightId === current.id && previous.icao !== current.departure.icao) {
      setRunwayIdentifier("");
    }
    previousDeparture.current = { flightId: current.id, icao: current.departure.icao };
  }, [current?.departure.icao, current?.id]);

  useEffect(() => {
    const icao = current?.departure.icao;
    if (!icao) {
      setMetarSnapshot(null);
      setWeatherState("idle");
      return;
    }

    const controller = new AbortController();
    setMetarSnapshot(null);
    setWeatherState("loading");

    fetch(`/api/weather/metar?icao=${encodeURIComponent(icao)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 204) return null;
        if (!response.ok) throw new Error("weather unavailable");
        const payload: unknown = await response.json();
        if (!isMetarSnapshot(payload)) throw new Error("invalid weather");
        return payload;
      })
      .then((snapshot) => {
        if (controller.signal.aborted) return;
        setMetarSnapshot(snapshot);
        if (!snapshot) {
          setWeatherState("unavailable");
          return;
        }

        setWeatherState("ready");
        if (!qnhManual.current && snapshot.qnhHpa !== undefined) {
          setQnh(String(Math.round(snapshot.qnhHpa * 100) / 100));
          setQnhSource("metar");
        }
        if (!oatManual.current && snapshot.temperatureC !== undefined) {
          setOat(String(snapshot.temperatureC));
          setOatSource("metar");
        }
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setWeatherState("unavailable");
      });

    return () => controller.abort();
  }, [current?.departure.icao]);

  const selectedAirport = useMemo(
    () => current && airportDataset
      ? findAirport(airportDataset, current.departure.icao)
      : undefined,
    [airportDataset, current],
  );

  const runwayOptions = useMemo(
    () => selectedAirport ? availableRunwayEnds(selectedAirport) : [],
    [selectedAirport],
  );

  const runwayContext = useMemo(
    () => selectedAirport && runwayIdentifier
      ? resolveRunwayEnd(selectedAirport, runwayIdentifier, airportDataset?.source)
      : undefined,
    [airportDataset?.source, runwayIdentifier, selectedAirport],
  );

  const qnhNumber = numberFromInput(qnh);
  const oatNumber = numberFromInput(oat);
  const weightNumber = numberFromInput(takeoffWeight);

  const pressureAltitude = useMemo(() => {
    if (!runwayContext || qnhNumber === undefined) return undefined;
    try {
      return Math.round(calculatePressureAltitudeFt(
        runwayContext.airportElevationFt,
        { unit: "hPa", value: qnhNumber },
      ));
    } catch {
      return undefined;
    }
  }, [qnhNumber, runwayContext]);

  const wind = useMemo(() => {
    if (
      !runwayContext
      || runwayContext.headingTrueDeg === undefined
      || !metarSnapshot
      || metarSnapshot.windDirectionTrueDeg === undefined
      || metarSnapshot.windSpeedKt === undefined
    ) return undefined;

    return calculateWindComponents({
      windDirectionTrueDeg: metarSnapshot.windDirectionTrueDeg,
      windSpeedKt: metarSnapshot.windSpeedKt,
      windGustKt: metarSnapshot.windGustKt,
      runwayHeadingTrueDeg: runwayContext.headingTrueDeg,
    });
  }, [metarSnapshot, runwayContext]);

  const currentContext = useMemo(() => {
    if (
      !current
      || !runwayContext
      || weightNumber === undefined
      || weightNumber <= 0
      || !flaps
      || qnhNumber === undefined
      || oatNumber === undefined
    ) return null;

    return buildTakeoffPerformanceContext(current, {
      runway: {
        identifier: runwayContext.runwayIdent,
        airportIcao: current.departure.icao,
      },
      weight: {
        value: weightNumber,
        unit: takeoffWeightUnit,
      },
      configuration: {
        flaps,
        antiIce,
      },
      weather: {
        qnh: qnhNumber,
        oat: oatNumber,
      },
    });
  }, [
    antiIce,
    current,
    flaps,
    oatNumber,
    qnhNumber,
    runwayContext,
    takeoffWeightUnit,
    weightNumber,
  ]);

  const stale = Boolean(
    result
    && (!currentContext || !isContextValid(currentContext, result.context)),
  );

  const changes = currentContext && result && stale
    ? diffPerformanceContext(result.context, currentContext)
    : [];

  const canCalculate = Boolean(
    currentContext
    && pressureAltitude !== undefined
    && oatNumber !== undefined,
  );

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
      pressureAltitudeFt: pressureAltitude,
      oatC: oatNumber,
    });
  }

  function recalculate() {
    calculate({
      pressureAltitudeFt: pressureAltitude,
      oatC: oatNumber,
    });
  }

  function applyMetarQnh() {
    if (metarSnapshot?.qnhHpa === undefined) return;
    qnhManual.current = false;
    setQnh(String(Math.round(metarSnapshot.qnhHpa * 100) / 100));
    setQnhSource("metar");
  }

  function applyMetarOat() {
    if (metarSnapshot?.temperatureC === undefined) return;
    oatManual.current = false;
    setOat(String(metarSnapshot.temperatureC));
    setOatSource("metar");
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
      {stale ? (
        <FtPerformanceInvalidation
          busy={busy}
          changes={changes}
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
    >
      <FtPerformanceContextLabel context={view} />

      {current && showInputs ? (
        <div className={styles.performanceWorkspace}>
          <section className={styles.inputBlock} aria-label="Performance inputs">
            <header className={styles.paneHeader}>
              <p className={styles.eyebrow}>TAKEOFF INPUTS</p>
              <h2>{current.departure.icao} departure</h2>
              <p className={styles.inputHelp}>
                Active Flight supplies the route and planning weight. Performance owns the selected runway, Takeoff configuration and calculation environment.
              </p>
            </header>

            <div className={styles.setupGrid}>
              <label className={styles.setupField}>
                <span>Runway</span>
                <select
                  aria-label="Takeoff runway"
                  disabled={airportDataState !== "ready" || !selectedAirport || !runwayOptions.length}
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
                    : selectedAirport
                      ? `${selectedAirport.name} · field elevation ${selectedAirport.elevationFt.toLocaleString("en-US")} ft`
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
                <span className={styles.sourceChip} data-state={weatherState}>
                  {weatherState === "loading" ? "LOADING" : weatherState === "ready" ? "METAR" : weatherState === "unavailable" ? "MANUAL" : "—"}
                </span>
              </div>

              {metarSnapshot ? (
                <p className={styles.sourceMeta}>
                  AviationWeather.gov · observed {formatObservationZulu(metarSnapshot.observedAt)}
                </p>
              ) : weatherState === "unavailable" ? (
                <p className={styles.sourceMeta}>Live METAR unavailable. Enter the required values manually.</p>
              ) : null}

              <div className={styles.inputGrid}>
                <label>
                  QNH
                  <span>
                    <input
                      inputMode="decimal"
                      name="qnh"
                      onChange={(event) => {
                        qnhManual.current = true;
                        setQnhSource("manual");
                        setQnh(event.target.value);
                      }}
                      placeholder="1013.25"
                      step="0.01"
                      type="number"
                      value={qnh}
                    />
                    <small>hPa</small>
                  </span>
                  <small className={styles.fieldMeta}>
                    {sourceLabel(qnhSource)}
                    {qnhSource !== "metar" && metarSnapshot?.qnhHpa !== undefined ? (
                      <button className={styles.inlineAction} onClick={applyMetarQnh} type="button">Use METAR</button>
                    ) : null}
                  </small>
                </label>

                <label>
                  OAT
                  <span>
                    <input
                      inputMode="decimal"
                      name="oat"
                      onChange={(event) => {
                        oatManual.current = true;
                        setOatSource("manual");
                        setOat(event.target.value);
                      }}
                      placeholder="15"
                      step="any"
                      type="number"
                      value={oat}
                    />
                    <small>°C</small>
                  </span>
                  <small className={styles.fieldMeta}>
                    {sourceLabel(oatSource)}
                    {oatSource !== "metar" && metarSnapshot?.temperatureC !== undefined ? (
                      <button className={styles.inlineAction} onClick={applyMetarOat} type="button">Use METAR</button>
                    ) : null}
                  </small>
                </label>
              </div>

              <dl className={styles.environmentFacts}>
                <div>
                  <dt>Pressure altitude</dt>
                  <dd>{pressureAltitude === undefined ? "—" : `${pressureAltitude.toLocaleString("en-US")} ft`}</dd>
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
            </div>

            <button
              className={styles.action}
              disabled={busy || !canCalculate}
              onClick={calculateFromForm}
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

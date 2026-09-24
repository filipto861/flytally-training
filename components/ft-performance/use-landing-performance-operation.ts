"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useActiveFlightState } from "@/components/ft-flight/use-active-flight";
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
import { calculateWindComponents, type WindComponents } from "@/lib/aviation/wind-component";
import type { PilotLandingCalculatorDefinition } from "@/lib/pilot-landing-calculator";
import {
  computeLandingPerformance,
  landingSourceDatasetIds,
  PERFORMANCE_RESULT_EVENT,
  readLandingPerformanceState,
  weatherObservationRefV2,
  writeLandingPerformanceResultV2,
  type LandingPerformanceReadState,
  type LandingPerformanceResult,
  type PerformanceCalculationInputs,
} from "@/lib/performance/client";
import {
  buildLandingPerformanceContext,
  diffLandingPerformanceContext,
  isLandingContextValid,
  type LandingPerformanceContext,
} from "@/lib/performance/landing-context";
import {
  autoApplyAvailableWeather,
  appliedWeatherFromSnapshot,
  EMPTY_OPERATION_WEATHER,
  explicitlyApplyAvailableWeather,
  hydrateMatchingAppliedObservation,
  newerWeatherObservationAvailable,
  sameWeatherObservation,
  setManualWeatherField,
  weatherForCalculation,
  type OperationAppliedWeather,
  type OperationWeatherSource,
} from "@/lib/performance/operation-weather";
import {
  diffLandingSnapshotV2Dependencies,
  type LandingSnapshotV2DependencyChange,
} from "@/lib/performance/snapshot-v2";
import type { PerformanceContextChange } from "@/lib/performance/context";
import type { PerformanceDataset } from "@/lib/universal-aircraft-content";
import { isMetarSnapshot } from "@/lib/weather/metar-snapshot-helpers";
import type { MetarSnapshot } from "@/lib/weather/metar-types";

type PerformanceWeatherFetchState =
  | "idle"
  | "loading"
  | "ready"
  | "unavailable";

export type LandingPerformanceOperationController = {
  readonly operation: "LANDING";
  readonly currentFlight: ActiveFlight | null;
  readonly hydrated: boolean;
  readonly busy: boolean;
  readonly result: LandingPerformanceResult | null;
  readonly storedState: LandingPerformanceReadState | null;
  readonly stale: boolean;
  readonly changes: readonly PerformanceContextChange[];
  readonly snapshotDependencyChanges: readonly LandingSnapshotV2DependencyChange[];
  readonly invalidationMessage?: string;
  readonly canCalculate: boolean;
  readonly airportDataState: "loading" | "ready" | "error";
  readonly selectedAirportName?: string;
  readonly selectedAirportElevationFt?: number;
  readonly runwayOptions: ReturnType<typeof availableRunwayEnds>;
  readonly runwayContext?: SelectedRunwayContext;
  readonly runwayIdentifier: string;
  readonly landingWeight: string;
  readonly landingWeightUnit: "kg" | "lb";
  readonly flaps: string;
  readonly appliedWeather: OperationAppliedWeather;
  readonly availableWeather: MetarSnapshot | null;
  readonly weatherFetchState: PerformanceWeatherFetchState;
  readonly newerWeatherAvailable: boolean;
  readonly latestWeatherActionNeeded: boolean;
  readonly pressureAltitudeFt?: number;
  readonly wind?: WindComponents;
  readonly currentContext: LandingPerformanceContext | null;
  readonly setRunwayIdentifier: (value: string) => void;
  readonly setLandingWeight: (value: string) => void;
  readonly setFlaps: (value: string) => void;
  readonly setManualQnh: (value: string) => void;
  readonly setManualOat: (value: string) => void;
  readonly calculate: () => void;
  readonly recalculate: () => void;
  readonly applyLatestMetar: () => void;
};

export type UseLandingPerformanceOperationOptions = {
  readonly aircraftId: string;
  readonly activeFlight?: ActiveFlight | null;
  readonly selectedVariant?: string;
  readonly datasets: readonly PerformanceDataset[];
  readonly landingCalculator?: PilotLandingCalculatorDefinition;
};

function numberFromInput(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function weatherSourceRequiresLatest(
  source: OperationWeatherSource,
  currentValue: number | undefined,
  availableValue: number | undefined,
): boolean {
  if (availableValue === undefined) return false;
  if (source !== "metar") return true;
  return currentValue !== availableValue;
}

function currentWeatherUsesAvailableObservation(
  current: OperationAppliedWeather,
  available: MetarSnapshot | null,
): boolean {
  if (!available || !current.observation) return false;
  if (!sameWeatherObservation(current.observation, available)) return false;

  const qnhMatches = available.qnhHpa === undefined
    || (
      current.qnhHpa.source === "metar"
      && current.qnhHpa.value === Math.round(available.qnhHpa * 100) / 100
    );
  const oatMatches = available.temperatureC === undefined
    || (
      current.oatC.source === "metar"
      && current.oatC.value === available.temperatureC
    );

  return qnhMatches && oatMatches;
}

/**
 * Canonical owner for the Landing operation. It deliberately mirrors the
 * P1.3 Takeoff boundary while keeping Landing state, persistence and
 * invalidation operation-scoped.
 */
export function useLandingPerformanceOperation({
  aircraftId,
  activeFlight,
  selectedVariant,
  datasets,
  landingCalculator,
}: UseLandingPerformanceOperationOptions): LandingPerformanceOperationController {
  const { flight } = useActiveFlightState(aircraftId, activeFlight);
  const current = flight?.lifecycle === "ACTIVE" ? flight : null;

  const [storedState, setStoredState] = useState<LandingPerformanceReadState | null>(null);
  const [airportDataset, setAirportDataset] = useState<AirportDatasetV1 | null>(null);
  const [airportDataState, setAirportDataState] = useState<"loading" | "ready" | "error">("loading");
  const [runwayIdentifier, setRunwayIdentifier] = useState("");
  const [landingWeight, setLandingWeight] = useState("");
  const [landingWeightUnit, setLandingWeightUnit] = useState<"kg" | "lb">("lb");
  const [flaps, setFlaps] = useState("");
  const [appliedWeather, setAppliedWeather] = useState<OperationAppliedWeather>(
    EMPTY_OPERATION_WEATHER,
  );
  const [availableWeather, setAvailableWeather] = useState<MetarSnapshot | null>(null);
  const [weatherFetchState, setWeatherFetchState] = useState<PerformanceWeatherFetchState>("idle");
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const previousDestination = useRef<{ flightId: string; icao: string } | null>(null);
  const weatherLocked = useRef(false);
  const calculationPending = useRef(false);

  const result = storedState?.result ?? null;

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
    const defaultFlaps = landingCalculator?.flapOptions[0]?.value ?? "";

    if (!current) {
      weatherLocked.current = false;
      setStoredState(null);
      setRunwayIdentifier("");
      setLandingWeight("");
      setLandingWeightUnit("lb");
      setFlaps(defaultFlaps);
      setAppliedWeather(EMPTY_OPERATION_WEATHER);
      setHydrated(true);
      return;
    }

    const restore = () => {
      const restored = readLandingPerformanceState(
        window.localStorage,
        aircraftId,
        current.id,
      );
      setStoredState(restored);
      weatherLocked.current = Boolean(restored);

      const stored = restored?.result ?? null;
      if (!stored) {
        setRunwayIdentifier("");
        setLandingWeight(String(current.weight.value));
        setLandingWeightUnit(current.weight.unit);
        setFlaps(defaultFlaps);
        setAppliedWeather(EMPTY_OPERATION_WEATHER);
        return;
      }

      const sameDestination =
        stored.context.runway.airportIcao === current.destination.icao;
      setRunwayIdentifier(sameDestination ? stored.context.runway.identifier : "");
      setLandingWeight(String(stored.context.weight.value));
      setLandingWeightUnit(stored.context.weight.unit);
      setFlaps(stored.context.configuration.flaps);
      setAppliedWeather(
        sameDestination
          ? appliedWeatherFromSnapshot(restored?.snapshot.inputs.weather)
          : EMPTY_OPERATION_WEATHER,
      );
    };

    restore();
    window.addEventListener(PERFORMANCE_RESULT_EVENT, restore);
    setHydrated(true);
    return () => window.removeEventListener(PERFORMANCE_RESULT_EVENT, restore);
  }, [aircraftId, current?.id, landingCalculator]);

  useEffect(() => {
    if (!current) {
      previousDestination.current = null;
      return;
    }

    const previous = previousDestination.current;
    if (
      previous?.flightId === current.id
      && previous.icao !== current.destination.icao
    ) {
      setRunwayIdentifier("");
      setAppliedWeather(EMPTY_OPERATION_WEATHER);
    }
    previousDestination.current = {
      flightId: current.id,
      icao: current.destination.icao,
    };
  }, [current?.destination.icao, current?.id]);

  useEffect(() => {
    const icao = current?.destination.icao;
    if (!icao) {
      setAvailableWeather(null);
      setWeatherFetchState("idle");
      return;
    }

    const controller = new AbortController();
    setAvailableWeather(null);
    setWeatherFetchState("loading");

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
        setAvailableWeather(snapshot);

        if (!snapshot) {
          setWeatherFetchState("unavailable");
          return;
        }

        setWeatherFetchState("ready");
        setAppliedWeather((previous) => (
          weatherLocked.current
            ? hydrateMatchingAppliedObservation(previous, snapshot)
            : autoApplyAvailableWeather(previous, snapshot)
        ));
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setWeatherFetchState("unavailable");
      });

    return () => controller.abort();
  }, [current?.destination.icao]);

  const selectedAirport = useMemo(
    () => current && airportDataset
      ? findAirport(airportDataset, current.destination.icao)
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

  const weightNumber = numberFromInput(landingWeight);
  const calculationWeather = weatherForCalculation(appliedWeather);

  const pressureAltitudeFt = useMemo(() => {
    if (!runwayContext || calculationWeather?.qnh === undefined) return undefined;
    try {
      return Math.round(calculatePressureAltitudeFt(
        runwayContext.airportElevationFt,
        { unit: "hPa", value: calculationWeather.qnh },
      ));
    } catch {
      return undefined;
    }
  }, [calculationWeather?.qnh, runwayContext]);

  const wind = useMemo(() => {
    const observation = appliedWeather.observation;
    if (
      !runwayContext
      || runwayContext.headingTrueDeg === undefined
      || !observation
      || observation.windDirectionTrueDeg === undefined
      || observation.windSpeedKt === undefined
    ) return undefined;

    return calculateWindComponents({
      windDirectionTrueDeg: observation.windDirectionTrueDeg,
      windSpeedKt: observation.windSpeedKt,
      windGustKt: observation.windGustKt,
      runwayHeadingTrueDeg: runwayContext.headingTrueDeg,
    });
  }, [appliedWeather.observation, runwayContext]);

  const currentContext = useMemo(() => {
    if (
      !current
      || !runwayContext
      || weightNumber === undefined
      || weightNumber <= 0
      || !flaps
      || !calculationWeather
    ) return null;

    return buildLandingPerformanceContext(current, {
      runway: {
        identifier: runwayContext.runwayIdent,
        airportIcao: current.destination.icao,
      },
      weight: {
        value: weightNumber,
        unit: landingWeightUnit,
      },
      configuration: { flaps },
      weather: calculationWeather,
    });
  }, [
    calculationWeather,
    current,
    flaps,
    landingWeightUnit,
    runwayContext,
    weightNumber,
  ]);

  const currentSourceDatasetIds = landingSourceDatasetIds(landingCalculator);
  const snapshotDependencyChanges = storedState && currentContext
    ? diffLandingSnapshotV2Dependencies(storedState.snapshot, {
        variant: selectedVariant ?? null,
        pressureAltitudeFt,
        calculatorId: null,
        datasetIds: currentSourceDatasetIds,
      })
    : [];

  const stale = Boolean(
    result
    && (
      storedState?.requiresRecalculation
      || snapshotDependencyChanges.length > 0
      || !currentContext
      || !isLandingContextValid(currentContext, result.context)
    ),
  );

  const changes = currentContext && result && stale
    ? diffLandingPerformanceContext(result.context, currentContext)
    : [];

  const canCalculate = Boolean(
    currentContext
    && pressureAltitudeFt !== undefined
    && landingCalculator,
  );

  const newerWeatherAvailable = Boolean(
    result
    && newerWeatherObservationAvailable(
      appliedWeather.observation,
      availableWeather,
    ),
  );

  const latestWeatherActionNeeded = Boolean(
    availableWeather
    && (
      newerWeatherAvailable
      || !currentWeatherUsesAvailableObservation(appliedWeather, availableWeather)
      || weatherSourceRequiresLatest(
        appliedWeather.qnhHpa.source,
        appliedWeather.qnhHpa.value,
        availableWeather.qnhHpa === undefined
          ? undefined
          : Math.round(availableWeather.qnhHpa * 100) / 100,
      )
      || weatherSourceRequiresLatest(
        appliedWeather.oatC.source,
        appliedWeather.oatC.value,
        availableWeather.temperatureC,
      )
    ),
  );

  function buildContextWithWeather(
    weather: OperationAppliedWeather,
  ): {
    readonly context: LandingPerformanceContext;
    readonly pressureAltitudeFt: number;
    readonly inputs: PerformanceCalculationInputs;
  } | null {
    const values = weatherForCalculation(weather);
    if (
      !current
      || !runwayContext
      || weightNumber === undefined
      || weightNumber <= 0
      || !flaps
      || !values
    ) return null;

    let nextPressureAltitude: number;
    try {
      nextPressureAltitude = Math.round(calculatePressureAltitudeFt(
        runwayContext.airportElevationFt,
        { unit: "hPa", value: values.qnh },
      ));
    } catch {
      return null;
    }

    return {
      context: buildLandingPerformanceContext(current, {
        runway: {
          identifier: runwayContext.runwayIdent,
          airportIcao: current.destination.icao,
        },
        weight: {
          value: weightNumber,
          unit: landingWeightUnit,
        },
        configuration: { flaps },
        weather: values,
      }),
      pressureAltitudeFt: nextPressureAltitude,
      inputs: {
        pressureAltitudeFt: nextPressureAltitude,
        oatC: values.oat,
      },
    };
  }

  function calculateWithWeather(weather: OperationAppliedWeather): void {
    const calculation = buildContextWithWeather(weather);
    if (
      !calculation
      || !current
      || !runwayContext
      || !landingCalculator
      || calculationPending.current
    ) return;

    calculationPending.current = true;
    setBusy(true);

    // Yield one animation frame so the disabled/loading action is visible
    // before the synchronous source-backed Landing calculation runs.
    window.requestAnimationFrame(() => {
      try {
        const next = computeLandingPerformance(
          calculation.context,
          datasets,
          landingCalculator,
          calculation.inputs,
        );
        const observation = weather.observation;
        const qnhSource =
          weather.qnhHpa.source === "metar" && observation ? "metar" : "manual";
        const oatSource =
          weather.oatC.source === "metar" && observation ? "metar" : "manual";

        const snapshot = writeLandingPerformanceResultV2(
          window.localStorage,
          next,
          {
            variant: selectedVariant,
            runwayContext,
            qnhSource,
            oatSource,
            observation: observation ? weatherObservationRefV2(observation) : null,
            datasetIds: currentSourceDatasetIds,
            calculatorId: null,
          },
        );

        weatherLocked.current = true;
        setStoredState({
          result: next,
          snapshot,
          requiresRecalculation: false,
        });
        setAppliedWeather(appliedWeatherFromSnapshot(snapshot.inputs.weather));
        window.dispatchEvent(new Event(PERFORMANCE_RESULT_EVENT));
      } finally {
        calculationPending.current = false;
        setBusy(false);
      }
    });
  }

  function applyLatestMetar(): void {
    if (!availableWeather) return;
    const nextWeather = explicitlyApplyAvailableWeather(
      appliedWeather,
      availableWeather,
    );
    setAppliedWeather(nextWeather);

    if (result) {
      calculateWithWeather(nextWeather);
    }
  }

  const invalidationMessage = snapshotDependencyChanges.length
    ? "Aircraft variant, derived Landing context or the source-backed Landing package changed. Recalculate before using the stored result."
    : undefined;

  return {
    operation: "LANDING",
    currentFlight: current,
    hydrated,
    busy,
    result,
    storedState,
    stale,
    changes,
    snapshotDependencyChanges,
    invalidationMessage,
    canCalculate,
    airportDataState,
    selectedAirportName: selectedAirport?.name,
    selectedAirportElevationFt: selectedAirport?.elevationFt,
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
    setManualQnh: (value) => {
      setAppliedWeather((previous) => setManualWeatherField(
        previous,
        "qnhHpa",
        numberFromInput(value),
      ));
    },
    setManualOat: (value) => {
      setAppliedWeather((previous) => setManualWeatherField(
        previous,
        "oatC",
        numberFromInput(value),
      ));
    },
    calculate: () => calculateWithWeather(appliedWeather),
    recalculate: () => calculateWithWeather(appliedWeather),
    applyLatestMetar,
  };
}

"use client";

import aeroncaPartialPowerN1Json from "@/aircraft-data/learjet-35a/performance/source-extracts/partial-power-n1-aeronca.json";
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
import {
  manualDeclaredDistanceFt,
  resolveTakeoffDeclaredDistanceConstraint,
  type TakeoffDeclaredDistanceConstraint,
} from "@/lib/aviation/declared-distances";
import { calculatePressureAltitudeFt } from "@/lib/aviation/pressure-altitude";
import { calculateWindComponents, type WindComponents } from "@/lib/aviation/wind-component";
import type { PilotTakeoffCalculatorDefinition } from "@/lib/pilot-takeoff-calculator";
import {
  computePerformance,
  PERFORMANCE_RESULT_EVENT,
  readTakeoffPerformanceState,
  takeoffSourceDatasetIds,
  weatherObservationRefV2,
  writeTakeoffPerformanceResultV2,
  type PerformanceCalculationInputs,
  type PerformanceResult,
  type TakeoffPerformanceReadState,
} from "@/lib/performance/client";
import {
  buildTakeoffPerformanceContext,
  diffPerformanceContext,
  isContextValid,
  type FlightPerformanceContext,
  type PerformanceContextChange,
} from "@/lib/performance/context";
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
  diffTakeoffSnapshotV2Dependencies,
  type TakeoffSnapshotV2DependencyChange,
} from "@/lib/performance/snapshot-v2";
import {
  evaluatePartialPowerTrainingPreview,
  type PartialPowerThrustReverserConfiguration,
  type PartialPowerTrainingPreviewResult,
  type TakeoffThrustMode,
} from "@/lib/performance/partial-power-training-preview";
import type { PartialPowerN1SourceExtract } from "@/lib/performance/partial-power-source";
import { normalizePressureAltitudeToSeaLevelFloor } from "@/lib/performance/source-envelope";
import type { PerformanceDataset } from "@/lib/universal-aircraft-content";
import { isMetarSnapshot } from "@/lib/weather/metar-snapshot-helpers";
import type { MetarSnapshot } from "@/lib/weather/metar-types";

import {
  useLandingPerformanceOperation,
  type LandingPerformanceOperationController,
  type UseLandingPerformanceOperationOptions,
} from "./use-landing-performance-operation";

const learjetAeroncaPartialPowerN1Extract =
  aeroncaPartialPowerN1Json as unknown as PartialPowerN1SourceExtract;

export type PerformanceWeatherFetchState =
  | "idle"
  | "loading"
  | "ready"
  | "unavailable";

export type PartialPowerPreviewState = {
  readonly evaluation: PartialPowerTrainingPreviewResult;
  readonly vr: PerformanceResult["vr"];
  readonly v2: PerformanceResult["v2"];
  readonly computedAt: string;
};

export type TakeoffPerformanceOperationController = {
  readonly operation: "TAKEOFF";
  readonly currentFlight: ActiveFlight | null;
  readonly hydrated: boolean;
  readonly busy: boolean;
  readonly result: PerformanceResult | null;
  readonly storedState: TakeoffPerformanceReadState | null;
  readonly stale: boolean;
  readonly changes: readonly PerformanceContextChange[];
  readonly snapshotDependencyChanges: readonly TakeoffSnapshotV2DependencyChange[];
  readonly invalidationMessage?: string;
  readonly canCalculate: boolean;
  readonly airportDataState: "loading" | "ready" | "error";
  readonly selectedAirportName?: string;
  readonly selectedAirportElevationFt?: number;
  readonly runwayOptions: ReturnType<typeof availableRunwayEnds>;
  readonly runwayContext?: SelectedRunwayContext;
  readonly runwayIdentifier: string;
  readonly toraFt: string;
  readonly toraInputSource: "empty" | "airport-surface-suggestion" | "manual";
  readonly asdaFt: string;
  readonly declaredDistanceConstraint: TakeoffDeclaredDistanceConstraint;
  readonly takeoffWeight: string;
  readonly takeoffWeightUnit: "kg" | "lb";
  readonly flaps: string;
  readonly antiIce: boolean;
  readonly thrustMode: TakeoffThrustMode;
  readonly partialPowerThrustReversers: PartialPowerThrustReverserConfiguration;
  readonly partialPowerRunwayDryHardPaved: boolean;
  readonly partialPowerAntiSkidOperative: boolean;
  readonly partialPowerFullRatedTakeoffWithin30Days: boolean;
  readonly partialPowerPreview: PartialPowerPreviewState | null;
  readonly appliedWeather: OperationAppliedWeather;
  readonly availableWeather: MetarSnapshot | null;
  readonly weatherFetchState: PerformanceWeatherFetchState;
  readonly newerWeatherAvailable: boolean;
  readonly latestWeatherActionNeeded: boolean;
  readonly pressureAltitudeFt?: number;
  readonly performancePressureAltitudeFt?: number;
  readonly pressureAltitudeMethod?: "identity" | "sea-level-floor";
  readonly wind?: WindComponents;
  readonly currentContext: FlightPerformanceContext | null;
  readonly setRunwayIdentifier: (value: string) => void;
  readonly setToraFt: (value: string) => void;
  readonly confirmSuggestedTora: () => void;
  readonly setAsdaFt: (value: string) => void;
  readonly setTakeoffWeight: (value: string) => void;
  readonly setFlaps: (value: string) => void;
  readonly setAntiIce: (value: boolean) => void;
  readonly setThrustMode: (value: TakeoffThrustMode) => void;
  readonly setPartialPowerThrustReversers: (value: PartialPowerThrustReverserConfiguration) => void;
  readonly setPartialPowerRunwayDryHardPaved: (value: boolean) => void;
  readonly setPartialPowerAntiSkidOperative: (value: boolean) => void;
  readonly setPartialPowerFullRatedTakeoffWithin30Days: (value: boolean) => void;
  readonly setManualQnh: (value: string) => void;
  readonly setManualOat: (value: string) => void;
  readonly calculate: () => void;
  readonly recalculate: () => void;
  readonly applyLatestMetar: () => void;
};

export type UseTakeoffPerformanceOperationOptions = {
  readonly aircraftId: string;
  readonly activeFlight?: ActiveFlight | null;
  readonly selectedVariant?: string;
  readonly datasets: readonly PerformanceDataset[];
  readonly takeoffCalculator?: PilotTakeoffCalculatorDefinition;
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

function windComponentsForAppliedWeather(
  weather: OperationAppliedWeather,
  runwayContext: SelectedRunwayContext | undefined,
): WindComponents | undefined {
  const observation = weather.observation;
  if (
    !runwayContext
    || runwayContext.headingTrueDeg === undefined
    || !observation
    || observation.windSpeedKt === undefined
  ) return undefined;

  if (observation.windCalm || Math.abs(observation.windSpeedKt) < 1e-9) {
    return {
      angleOffDeg: 0,
      headwindKt: 0,
      crosswindKt: 0,
      ...(observation.windGustKt === undefined
        ? {}
        : {
            gustHeadwindKt: 0,
            gustCrosswindKt: 0,
          }),
    };
  }

  if (observation.windDirectionTrueDeg === undefined) return undefined;

  return calculateWindComponents({
    windDirectionTrueDeg: observation.windDirectionTrueDeg,
    windSpeedKt: observation.windSpeedKt,
    windGustKt: observation.windGustKt,
    runwayHeadingTrueDeg: runwayContext.headingTrueDeg,
  });
}

function roundedRunwayWindComponentKt(
  components: WindComponents | undefined,
): number | undefined {
  return components
    ? Math.round(components.headwindKt * 10) / 10
    : undefined;
}

/**
 * Canonical client-side owner for one Performance operation.
 *
 * P1.3 activates the TAKEOFF adapter. LANDING will consume the same operation
 * boundary in B5 instead of introducing a second controller or persistence path.
 */
function useTakeoffPerformanceOperation(
  operation: "TAKEOFF",
  {
    aircraftId,
    activeFlight,
    selectedVariant,
    datasets,
    takeoffCalculator,
  }: UseTakeoffPerformanceOperationOptions,
): TakeoffPerformanceOperationController {
  const { flight } = useActiveFlightState(aircraftId, activeFlight);
  const current = flight?.lifecycle === "ACTIVE" ? flight : null;

  const [storedState, setStoredState] = useState<TakeoffPerformanceReadState | null>(null);
  const [airportDataset, setAirportDataset] = useState<AirportDatasetV1 | null>(null);
  const [airportDataState, setAirportDataState] = useState<"loading" | "ready" | "error">("loading");
  const [runwayIdentifier, setRunwayIdentifierState] = useState("");
  const [toraFt, setToraFtState] = useState("");
  const [toraInputSource, setToraInputSource] = useState<
    "empty" | "airport-surface-suggestion" | "manual"
  >("empty");
  const [asdaFt, setAsdaFt] = useState("");
  const [takeoffWeight, setTakeoffWeight] = useState("");
  const [takeoffWeightUnit, setTakeoffWeightUnit] = useState<"kg" | "lb">("lb");
  const [flaps, setFlaps] = useState("");
  const [antiIce, setAntiIce] = useState(false);
  const [thrustMode, setThrustMode] = useState<TakeoffThrustMode>("full-rated");
  const [partialPowerThrustReversers, setPartialPowerThrustReversers] =
    useState<PartialPowerThrustReverserConfiguration>("unknown");
  const [partialPowerRunwayDryHardPaved, setPartialPowerRunwayDryHardPaved] = useState(false);
  const [partialPowerAntiSkidOperative, setPartialPowerAntiSkidOperative] = useState(false);
  const [
    partialPowerFullRatedTakeoffWithin30Days,
    setPartialPowerFullRatedTakeoffWithin30Days,
  ] = useState(false);
  const [partialPowerPreview, setPartialPowerPreview] =
    useState<PartialPowerPreviewState | null>(null);
  const [appliedWeather, setAppliedWeather] = useState<OperationAppliedWeather>(
    EMPTY_OPERATION_WEATHER,
  );
  const [availableWeather, setAvailableWeather] = useState<MetarSnapshot | null>(null);
  const [weatherFetchState, setWeatherFetchState] = useState<PerformanceWeatherFetchState>("idle");
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const previousDeparture = useRef<{ flightId: string; icao: string } | null>(null);
  const weatherLocked = useRef(false);
  const calculationPending = useRef(false);

  const result = storedState?.result ?? null;

  useEffect(() => {
    setThrustMode("full-rated");
    setPartialPowerThrustReversers("unknown");
    setPartialPowerRunwayDryHardPaved(false);
    setPartialPowerAntiSkidOperative(false);
    setPartialPowerFullRatedTakeoffWithin30Days(false);
    setPartialPowerPreview(null);
  }, [current?.id]);

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
      weatherLocked.current = false;
      setStoredState(null);
      setRunwayIdentifierState("");
      setToraFtState("");
      setToraInputSource("empty");
      setAsdaFt("");
      setTakeoffWeight("");
      setTakeoffWeightUnit("lb");
      setFlaps(defaultFlaps);
      setAntiIce(false);
      setAppliedWeather(EMPTY_OPERATION_WEATHER);
      setHydrated(true);
      return;
    }

    const restore = () => {
      const restored = readTakeoffPerformanceState(
        window.localStorage,
        aircraftId,
        current.id,
      );
      setStoredState(restored);
      weatherLocked.current = Boolean(restored);

      const stored = restored?.result ?? null;
      if (!stored) {
        setRunwayIdentifierState("");
        setToraFtState("");
        setToraInputSource("empty");
        setAsdaFt("");
        setTakeoffWeight(String(current.weight.value));
        setTakeoffWeightUnit(current.weight.unit);
        setFlaps(defaultFlaps);
        setAntiIce(false);
        setAppliedWeather(EMPTY_OPERATION_WEATHER);
        return;
      }

      const sameDeparture = stored.context.runway.airportIcao === current.departure.icao;
      setRunwayIdentifierState(sameDeparture ? stored.context.runway.identifier : "");
      // Declared distances are not dependencies of the current full-rated
      // Takeoff snapshot, so they are intentionally not restored from it.
      setToraFtState("");
      setToraInputSource("empty");
      setAsdaFt("");
      setTakeoffWeight(String(stored.context.weight.value));
      setTakeoffWeightUnit(stored.context.weight.unit);
      setFlaps(stored.context.configuration.flaps);
      setAntiIce(stored.context.configuration.antiIce);
      setAppliedWeather(
        sameDeparture
          ? appliedWeatherFromSnapshot(restored?.snapshot.inputs.weather)
          : EMPTY_OPERATION_WEATHER,
      );
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
    if (
      previous?.flightId === current.id
      && previous.icao !== current.departure.icao
    ) {
      setRunwayIdentifierState("");
      setToraFtState("");
      setToraInputSource("empty");
      setAsdaFt("");
      setAppliedWeather(EMPTY_OPERATION_WEATHER);
    }
    previousDeparture.current = {
      flightId: current.id,
      icao: current.departure.icao,
    };
  }, [current?.departure.icao, current?.id]);

  useEffect(() => {
    const icao = current?.departure.icao;
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

  useEffect(() => {
    if (!runwayContext || toraInputSource !== "empty") return;
    // UX convenience only: OurAirports exposes physical runway surface length,
    // not an authoritative declared TORA. Show it as a prefill suggestion, but
    // keep it out of the declared-distance contract until the pilot confirms it.
    setToraFtState(String(runwayContext.surfaceLengthFt));
    setToraInputSource("airport-surface-suggestion");
  }, [runwayContext, toraInputSource]);

  const declaredDistanceConstraint = useMemo(() => {
    const tora = toraInputSource === "manual" && toraFt.trim()
      ? manualDeclaredDistanceFt(Number(toraFt))
      : undefined;
    const asda = asdaFt.trim() ? manualDeclaredDistanceFt(Number(asdaFt)) : undefined;
    return resolveTakeoffDeclaredDistanceConstraint({ tora, asda });
  }, [asdaFt, toraFt, toraInputSource]);

  const weightNumber = numberFromInput(takeoffWeight);
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

  const pressureAltitudeNormalization = useMemo(
    () => pressureAltitudeFt === undefined
      ? undefined
      : normalizePressureAltitudeToSeaLevelFloor(pressureAltitudeFt),
    [pressureAltitudeFt],
  );
  const performancePressureAltitudeFt =
    pressureAltitudeNormalization?.performancePressureAltitudeFt;

  const wind = useMemo(
    () => windComponentsForAppliedWeather(appliedWeather, runwayContext),
    [appliedWeather, runwayContext],
  );
  const runwayWindComponentKt = roundedRunwayWindComponentKt(wind);

  const currentContext = useMemo(() => {
    if (
      !current
      || !runwayContext
      || weightNumber === undefined
      || weightNumber <= 0
      || !flaps
      || !calculationWeather
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
      weather: calculationWeather,
    });
  }, [
    antiIce,
    calculationWeather,
    current,
    flaps,
    runwayContext,
    takeoffWeightUnit,
    weightNumber,
  ]);

  const currentSourceDatasetIds = currentContext
    ? takeoffSourceDatasetIds(datasets, takeoffCalculator, currentContext)
    : [];

  const snapshotDependencyChanges = storedState && currentContext
    ? diffTakeoffSnapshotV2Dependencies(storedState.snapshot, {
        variant: selectedVariant ?? null,
        pressureAltitudeFt: performancePressureAltitudeFt,
        runwayWindComponentKt,
        calculatorId: takeoffCalculator?.id ?? null,
        datasetIds: currentSourceDatasetIds,
      })
    : [];

  const stale = Boolean(
    result
    && (
      storedState?.requiresRecalculation
      || snapshotDependencyChanges.length > 0
      || !currentContext
      || !isContextValid(currentContext, result.context)
    ),
  );

  const changes = currentContext && result && stale
    ? diffPerformanceContext(result.context, currentContext)
    : [];

  const canCalculateFullRated = Boolean(
    currentContext
    && performancePressureAltitudeFt !== undefined
    && calculationWeather,
  );
  const partialPowerInputsReady = Boolean(
    currentContext
    && performancePressureAltitudeFt !== undefined
    && calculationWeather
    && runwayWindComponentKt !== undefined
    && declaredDistanceConstraint.status === "ready"
    && partialPowerThrustReversers !== "unknown"
    && takeoffCalculator,
  );
  const canCalculate = thrustMode === "partial-power"
    ? partialPowerInputsReady
    : canCalculateFullRated;

  useEffect(() => {
    setPartialPowerPreview(null);
  }, [
    antiIce,
    appliedWeather.oatC.source,
    appliedWeather.oatC.value,
    appliedWeather.observation?.observedAt,
    appliedWeather.qnhHpa.source,
    appliedWeather.qnhHpa.value,
    asdaFt,
    flaps,
    partialPowerAntiSkidOperative,
    partialPowerFullRatedTakeoffWithin30Days,
    partialPowerRunwayDryHardPaved,
    partialPowerThrustReversers,
    runwayIdentifier,
    runwayWindComponentKt,
    takeoffWeight,
    thrustMode,
    toraFt,
    toraInputSource,
  ]);

  const hasDisplayedCalculation = thrustMode === "partial-power"
    ? Boolean(partialPowerPreview)
    : Boolean(result);

  const newerWeatherAvailable = Boolean(
    hasDisplayedCalculation
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
    readonly context: FlightPerformanceContext;
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
      const observedPressureAltitude = Math.round(calculatePressureAltitudeFt(
        runwayContext.airportElevationFt,
        { unit: "hPa", value: values.qnh },
      ));
      nextPressureAltitude = normalizePressureAltitudeToSeaLevelFloor(
        observedPressureAltitude,
      ).performancePressureAltitudeFt;
    } catch {
      return null;
    }

    const context = buildTakeoffPerformanceContext(current, {
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
      weather: values,
    });

    const nextWind = windComponentsForAppliedWeather(weather, runwayContext);
    const nextRunwayWindComponentKt = roundedRunwayWindComponentKt(nextWind);

    return {
      context,
      pressureAltitudeFt: nextPressureAltitude,
      inputs: {
        pressureAltitudeFt: nextPressureAltitude,
        oatC: values.oat,
        ...(nextRunwayWindComponentKt === undefined
          ? {}
          : { runwayWindComponentKt: nextRunwayWindComponentKt }),
      },
    };
  }

  function calculateWithWeather(weather: OperationAppliedWeather): void {
    const calculation = buildContextWithWeather(weather);
    if (!calculation || !current || !runwayContext || calculationPending.current) return;

    calculationPending.current = true;
    setBusy(true);

    // Yield one animation frame so React can paint the disabled/loading button
    // before the synchronous source-backed performance calculation runs.
    window.requestAnimationFrame(() => {
      try {
        const next = computePerformance(
          calculation.context,
          datasets,
          takeoffCalculator,
          calculation.inputs,
        );

        if (thrustMode === "partial-power") {
          const values = weatherForCalculation(weather);
          const tora = toraInputSource === "manual" && numberFromInput(toraFt)
            ? manualDeclaredDistanceFt(Number(toraFt))
            : undefined;
          const asda = numberFromInput(asdaFt)
            ? manualDeclaredDistanceFt(Number(asdaFt))
            : undefined;
          const runwayWind = calculation.inputs.runwayWindComponentKt;
          const weight = weightNumber === undefined
            ? undefined
            : takeoffWeightUnit === "kg"
              ? weightNumber * 2.2046226218487757
              : weightNumber;

          if (
            !values
            || !takeoffCalculator
            || !tora
            || !asda
            || runwayWind === undefined
            || weight === undefined
          ) {
            setPartialPowerPreview({
              evaluation: {
                status: "unsupported",
                reason: "Complete the required Partial Power inputs before evaluating reduced thrust.",
              },
              vr: next.vr,
              v2: next.v2,
              computedAt: new Date().toISOString(),
            });
            return;
          }

          const evaluation = evaluatePartialPowerTrainingPreview({
            aircraftId,
            datasets,
            definition: takeoffCalculator,
            pressureAltitudeFt: calculation.pressureAltitudeFt,
            ambientTemperatureC: values.oat,
            takeoffWeightLb: weight,
            flaps,
            runwayWindComponentKt: runwayWind,
            declaredDistances: { tora, asda },
            eligibility: {
              runwayDryHardPaved: partialPowerRunwayDryHardPaved,
              antiIce,
              antiSkidOperative: partialPowerAntiSkidOperative,
              fullRatedTakeoffWithin30Days: partialPowerFullRatedTakeoffWithin30Days,
            },
            thrustReversers: partialPowerThrustReversers,
            aeroncaN1Extract: learjetAeroncaPartialPowerN1Extract,
          });

          setPartialPowerPreview({
            evaluation,
            vr: next.vr,
            v2: next.v2,
            computedAt: new Date().toISOString(),
          });
          weatherLocked.current = true;
          setAppliedWeather(weather);
          return;
        }

        const observation = weather.observation;
        const qnhSource =
          weather.qnhHpa.source === "metar" && observation ? "metar" : "manual";
        const oatSource =
          weather.oatC.source === "metar" && observation ? "metar" : "manual";
        const datasetIds = takeoffSourceDatasetIds(
          datasets,
          takeoffCalculator,
          calculation.context,
        );

        const snapshot = writeTakeoffPerformanceResultV2(
          window.localStorage,
          next,
          {
            variant: selectedVariant,
            runwayContext,
            qnhSource,
            oatSource,
            observation: observation ? weatherObservationRefV2(observation) : null,
            datasetIds,
            calculatorId: takeoffCalculator?.id ?? null,
          },
        );

        weatherLocked.current = true;
        setStoredState({
          result: next,
          snapshot,
          requiresRecalculation: false,
          migratedFromLegacy: false,
        });
        setAppliedWeather(appliedWeatherFromSnapshot(snapshot.inputs.weather));
        window.dispatchEvent(new Event(PERFORMANCE_RESULT_EVENT));
      } finally {
        calculationPending.current = false;
        setBusy(false);
      }
    });
  }

  function calculate(): void {
    calculateWithWeather(appliedWeather);
  }

  function recalculate(): void {
    calculateWithWeather(appliedWeather);
  }

  function applyLatestMetar(): void {
    if (!availableWeather) return;
    const nextWeather = explicitlyApplyAvailableWeather(
      appliedWeather,
      availableWeather,
    );

    if (hasDisplayedCalculation) {
      // Preserve APPLY & RECALCULATE as one atomic operation. If the runway
      // context is not ready yet, calculateWithWeather fails closed and the
      // currently applied weather/result remain paired instead of exposing
      // newer weather beside an older calculation.
      calculateWithWeather(nextWeather);
      return;
    }

    setAppliedWeather(nextWeather);
  }

  const invalidationMessage = storedState?.requiresRecalculation
    ? "This stored result was migrated from legacy performance data without complete weather provenance. Recalculate to create a current V2 snapshot."
    : snapshotDependencyChanges.length
      ? "Aircraft variant, derived pressure altitude/runway wind, or the source-backed performance package changed. Recalculate before using the stored result."
      : undefined;

  return {
    operation,
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
    toraFt,
    toraInputSource,
    asdaFt,
    declaredDistanceConstraint,
    takeoffWeight,
    takeoffWeightUnit,
    flaps,
    antiIce,
    thrustMode,
    partialPowerThrustReversers,
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
    pressureAltitudeMethod: pressureAltitudeNormalization?.method,
    wind,
    currentContext,
    setRunwayIdentifier: (value) => {
      setRunwayIdentifierState(value);
      setToraFtState("");
      setToraInputSource("empty");
      setAsdaFt("");
    },
    setToraFt: (value) => {
      setToraFtState(value);
      setToraInputSource(value.trim() ? "manual" : "empty");
    },
    confirmSuggestedTora: () => {
      if (
        toraInputSource === "airport-surface-suggestion"
        && numberFromInput(toraFt) !== undefined
      ) {
        setToraInputSource("manual");
      }
    },
    setAsdaFt,
    setTakeoffWeight,
    setFlaps,
    setAntiIce,
    setThrustMode,
    setPartialPowerThrustReversers,
    setPartialPowerRunwayDryHardPaved,
    setPartialPowerAntiSkidOperative,
    setPartialPowerFullRatedTakeoffWithin30Days,
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
    calculate,
    recalculate,
    applyLatestMetar,
  };
}

export function usePerformanceOperation(
  operation: "TAKEOFF",
  options: UseTakeoffPerformanceOperationOptions,
): TakeoffPerformanceOperationController;
export function usePerformanceOperation(
  operation: "LANDING",
  options: UseLandingPerformanceOperationOptions,
): LandingPerformanceOperationController;
export function usePerformanceOperation(
  operation: "TAKEOFF" | "LANDING",
  options: UseTakeoffPerformanceOperationOptions | UseLandingPerformanceOperationOptions,
): TakeoffPerformanceOperationController | LandingPerformanceOperationController {
  // Operation is a compile-time literal at every caller and must not change
  // during a component lifetime. The facade preserves one public operation
  // boundary while the two adapters retain operation-scoped state/persistence.
  if (operation === "TAKEOFF") {
    return useTakeoffPerformanceOperation(
      operation,
      options as UseTakeoffPerformanceOperationOptions,
    );
  }
  return useLandingPerformanceOperation(
    options as UseLandingPerformanceOperationOptions,
  );
}


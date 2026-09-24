"use client";

import {
  calculateMultiAxisMetricGrid,
} from "../performance-calculator.ts";
import {
  calculatePilotTakeoffSummary,
  type PilotTakeoffCalculatorDefinition,
  type PilotTakeoffMetricResult,
} from "../pilot-takeoff-calculator.ts";
import {
  calculatePilotLandingSummary,
  type PilotLandingCalculatorDefinition,
} from "../pilot-landing-calculator.ts";
import type {
  PerformanceDataset,
  PerformanceScalar,
} from "../universal-aircraft-content.ts";
import type { SelectedRunwayContext } from "../aviation/airport-types.ts";
import type { MetarSnapshot } from "../weather/metar-types.ts";
import {
  computeContextHash,
  type FlightPerformanceContext,
} from "./context.ts";
import {
  computeLandingContextHash,
  type LandingPerformanceContext,
} from "./landing-context.ts";
import {
  isLandingSnapshotV2,
  isTakeoffSnapshotV2,
  landingSnapshotRequiresRecalculation,
  performanceSnapshotV2Key,
  takeoffSnapshotRequiresRecalculation,
  type LandingSnapshotV2,
  type PerformanceInputProvenance,
  type TakeoffSnapshotV2,
  type WeatherObservationRefV2,
} from "./snapshot-v2.ts";

export type PerformanceCalculationInputs = {
  readonly pressureAltitudeFt?: number;
  readonly oatC?: number;
};

export type PerformanceResult = {
  readonly context: FlightPerformanceContext;
  readonly contextHash: string;
  readonly n1: PilotTakeoffMetricResult;
  readonly v1: PilotTakeoffMetricResult;
  readonly vr: PilotTakeoffMetricResult;
  readonly v2: PilotTakeoffMetricResult;
  readonly takeoffDistance: PilotTakeoffMetricResult;
  readonly computedAt: string;
  readonly source: "takeoff-calculator" | "multi-axis-metric-grid";
  readonly calculationInputs: PerformanceCalculationInputs;
};

export type LandingPerformanceResult = {
  readonly context: LandingPerformanceContext;
  readonly contextHash: string;
  readonly vref: PilotTakeoffMetricResult;
  readonly landingClimbSpeed: PilotTakeoffMetricResult;
  readonly approachClimbSpeed: PilotTakeoffMetricResult;
  readonly landingDistance: PilotTakeoffMetricResult;
  readonly computedAt: string;
  readonly source: "landing-calculator";
  readonly calculationInputs: PerformanceCalculationInputs;
};

export type LandingPerformanceReadState = {
  readonly result: LandingPerformanceResult;
  readonly snapshot: LandingSnapshotV2;
  readonly requiresRecalculation: boolean;
};

export type LandingSnapshotWriteOptions = {
  readonly variant?: string | null;
  readonly runwayContext: SelectedRunwayContext;
  readonly qnhSource: Exclude<PerformanceInputProvenance, "legacy-unknown">;
  readonly oatSource: Exclude<PerformanceInputProvenance, "legacy-unknown">;
  readonly observation: WeatherObservationRefV2 | null;
  readonly datasetIds: readonly string[];
  readonly calculatorId?: string | null;
};

export interface PerformanceResultStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const PERFORMANCE_RESULT_EVENT = "ft-performance-result-changed";

export function performanceResultKey(
  aircraftId: string,
  activeFlightId: string,
): string {
  return `flytally-training:performance-result:v1:${aircraftId}:${activeFlightId}`;
}

function weightLb(context: FlightPerformanceContext): number {
  return context.weight.unit === "lb"
    ? context.weight.value
    : context.weight.value * 2.2046226218;
}

function pending(reason: string): PilotTakeoffMetricResult {
  return { status: "missing", reason };
}

function normalizeSemantic(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resultStatus(
  calculation: ReturnType<typeof calculateMultiAxisMetricGrid>,
): PilotTakeoffMetricResult {
  if (calculation.status === "incomplete") {
    return { status: "missing", reason: calculation.reason };
  }
  if (calculation.status === "unsupported") {
    return { status: "out-of-range", reason: calculation.reason };
  }
  return { status: "unavailable", reason: "Declared output unavailable." };
}

function metricFromGrid(
  dataset: PerformanceDataset,
  calculation: ReturnType<typeof calculateMultiAxisMetricGrid>,
  aliases: readonly string[],
): PilotTakeoffMetricResult {
  if (calculation.status !== "ready") return resultStatus(calculation);

  const output = dataset.outputs.find((candidate) => {
    const semantic = normalizeSemantic(`${candidate.key} ${candidate.label}`);
    return aliases.some((alias) => semantic.includes(alias));
  });
  if (!output) {
    return { status: "unavailable", reason: "Declared output unavailable." };
  }

  const metric = calculation.metrics?.find((candidate) => candidate.key === output.key);
  if (!metric || typeof metric.value !== "number") {
    return { status: "unavailable", reason: "Declared output unavailable." };
  }

  return {
    status: "ready",
    value: metric.value,
    unit: metric.unit,
  };
}

function genericInputValue(
  axisKey: string,
  context: FlightPerformanceContext,
  inputs: PerformanceCalculationInputs,
): PerformanceScalar | undefined {
  const semantic = normalizeSemantic(axisKey);
  if (semantic.includes("weight")) return weightLb(context);
  if (semantic.includes("pressurealtitude") || semantic === "altitudefeet" || semantic === "altitudeft") {
    return inputs.pressureAltitudeFt;
  }
  if (semantic === "oat" || semantic.includes("temperature")) return inputs.oatC;
  return undefined;
}

function genericTakeoffResult(
  context: FlightPerformanceContext,
  datasets: readonly PerformanceDataset[],
  inputs: PerformanceCalculationInputs,
): Omit<PerformanceResult, "context" | "contextHash" | "computedAt" | "source" | "calculationInputs"> | undefined {
  const dataset = datasets.find((candidate) => (
    candidate.calculator?.kind === "multi-axis-metric-grid"
    && candidate.calculator.operation === "takeoff"
    && candidate.calculator.outputKeys.some((key) => /n1/i.test(key))
    && candidate.calculator.outputKeys.some((key) => /^v1/i.test(key))
    && candidate.calculator.outputKeys.some((key) => /^vr/i.test(key))
    && candidate.calculator.outputKeys.some((key) => /^v2/i.test(key))
    && candidate.calculator.outputKeys.some((key) => /distance/i.test(key))
  ));
  if (!dataset || dataset.calculator?.kind !== "multi-axis-metric-grid") return undefined;

  const calculatorInputs = Object.fromEntries(
    dataset.calculator.inputAxes.map((axisKey) => [
      axisKey,
      genericInputValue(axisKey, context, inputs),
    ]),
  );
  const calculation = calculateMultiAxisMetricGrid(dataset, calculatorInputs);

  return {
    n1: metricFromGrid(dataset, calculation, ["n1", "n1percent"]),
    v1: metricFromGrid(dataset, calculation, ["v1"]),
    vr: metricFromGrid(dataset, calculation, ["vr", "rotation"]),
    v2: metricFromGrid(dataset, calculation, ["v2"]),
    takeoffDistance: metricFromGrid(dataset, calculation, ["takeoffdistance", "distance"]),
  };
}

export function computePerformance(
  context: FlightPerformanceContext,
  datasets: readonly PerformanceDataset[],
  definition: PilotTakeoffCalculatorDefinition | undefined,
  inputs: PerformanceCalculationInputs = {},
  now = new Date().toISOString(),
): PerformanceResult {
  const generic = definition
    ? undefined
    : genericTakeoffResult(context, datasets, inputs);

  if (generic) {
    return {
      context,
      contextHash: computeContextHash(context),
      ...generic,
      computedAt: new Date(now).toISOString(),
      source: "multi-axis-metric-grid",
      calculationInputs: inputs,
    };
  }

  if (!definition) {
    const unavailable = pending("No source-backed takeoff calculator is available.");
    return {
      context,
      contextHash: computeContextHash(context),
      n1: unavailable,
      v1: unavailable,
      vr: unavailable,
      v2: unavailable,
      takeoffDistance: unavailable,
      computedAt: new Date(now).toISOString(),
      source: "takeoff-calculator",
      calculationInputs: inputs,
    };
  }

  const summary = calculatePilotTakeoffSummary(datasets, definition, {
    pressureAltitude: inputs.pressureAltitudeFt,
    oat: inputs.oatC,
    takeoffWeight: weightLb(context),
    flaps: context.configuration.flaps,
    antiIce: context.configuration.antiIce,
  });

  return {
    context,
    contextHash: computeContextHash(context),
    n1: summary.n1,
    v1: summary.v1,
    vr: summary.vr,
    v2: summary.v2,
    takeoffDistance: summary.takeoffDistance,
    computedAt: new Date(now).toISOString(),
    source: "takeoff-calculator",
    calculationInputs: inputs,
  };
}

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function finiteOptionalNumber(value: unknown): boolean {
  return value === undefined || (typeof value === "number" && Number.isFinite(value));
}

function metric(value: unknown): value is PilotTakeoffMetricResult {
  const row = object(value);
  if (
    !row
    || !["ready", "missing", "out-of-range", "unavailable", "pending"].includes(String(row.status))
  ) return false;
  if (!finiteOptionalNumber(row.value)) return false;
  if (row.unit !== undefined && typeof row.unit !== "string") return false;
  if (!finiteOptionalNumber(row.precision)) return false;
  if (row.reason !== undefined && typeof row.reason !== "string") return false;
  return row.status !== "ready" || typeof row.value === "number";
}

function context(value: unknown): value is FlightPerformanceContext {
  const row = object(value);
  const weight = object(row?.weight);
  const runway = object(row?.runway);
  const configuration = object(row?.configuration);
  const weather = row?.weather === null ? null : object(row?.weather);
  return Boolean(
    row
    && typeof row.activeFlightId === "string"
    && typeof row.aircraftId === "string"
    && typeof row.dependencySnapshotId === "string"
    && weight
    && typeof weight.value === "number"
    && Number.isFinite(weight.value)
    && (weight.unit === "kg" || weight.unit === "lb")
    && runway
    && typeof runway.identifier === "string"
    && configuration
    && typeof configuration.flaps === "string"
    && typeof configuration.antiIce === "boolean"
    && (
      row.weather === null
      || (
        weather
        && typeof weather.qnh === "number"
        && Number.isFinite(weather.qnh)
        && typeof weather.oat === "number"
        && Number.isFinite(weather.oat)
      )
    ),
  );
}

function calculationInputs(value: unknown): value is PerformanceCalculationInputs {
  const row = object(value);
  return Boolean(
    row
    && finiteOptionalNumber(row.pressureAltitudeFt)
    && finiteOptionalNumber(row.oatC),
  );
}

function isPerformanceResult(value: unknown): value is PerformanceResult {
  const row = object(value);
  if (
    !row
    || !context(row.context)
    || typeof row.contextHash !== "string"
    || !metric(row.n1)
    || !metric(row.v1)
    || !metric(row.vr)
    || !metric(row.v2)
    || !metric(row.takeoffDistance)
    || typeof row.computedAt !== "string"
    || Number.isNaN(Date.parse(row.computedAt as string))
    || (row.source !== "takeoff-calculator" && row.source !== "multi-axis-metric-grid")
    || !calculationInputs(row.calculationInputs)
  ) return false;
  return row.contextHash === computeContextHash(row.context);
}

export type TakeoffPerformanceReadState = {
  readonly result: PerformanceResult;
  readonly snapshot: TakeoffSnapshotV2;
  readonly requiresRecalculation: boolean;
  readonly migratedFromLegacy: boolean;
};

export type TakeoffSnapshotWriteOptions = {
  readonly variant?: string | null;
  readonly runwayContext: SelectedRunwayContext;
  readonly qnhSource: Exclude<PerformanceInputProvenance, "legacy-unknown">;
  readonly oatSource: Exclude<PerformanceInputProvenance, "legacy-unknown">;
  readonly observation: WeatherObservationRefV2 | null;
  readonly datasetIds: readonly string[];
  readonly calculatorId?: string | null;
};

export function weatherObservationRefV2(
  snapshot: MetarSnapshot,
): WeatherObservationRefV2 {
  return {
    source: snapshot.source,
    station: snapshot.station,
    observedAt: snapshot.observedAt,
    fetchedAt: snapshot.fetchedAt,
    rawText: snapshot.rawText,
    ...(snapshot.windDirectionTrueDeg === undefined
      ? {}
      : { windDirectionTrueDeg: snapshot.windDirectionTrueDeg }),
    ...(snapshot.windSpeedKt === undefined
      ? {}
      : { windSpeedKt: snapshot.windSpeedKt }),
    ...(snapshot.windGustKt === undefined
      ? {}
      : { windGustKt: snapshot.windGustKt }),
    windVariable: snapshot.windVariable,
    windCalm: snapshot.windCalm,
  };
}

export function takeoffSourceDatasetIds(
  datasets: readonly PerformanceDataset[],
  definition: PilotTakeoffCalculatorDefinition | undefined,
  context: FlightPerformanceContext,
): readonly string[] {
  if (!definition) {
    const generic = datasets.find((candidate) => (
      candidate.calculator?.kind === "multi-axis-metric-grid"
      && candidate.calculator.operation === "takeoff"
      && candidate.calculator.outputKeys.some((key) => /n1/i.test(key))
      && candidate.calculator.outputKeys.some((key) => /^v1/i.test(key))
      && candidate.calculator.outputKeys.some((key) => /^vr/i.test(key))
      && candidate.calculator.outputKeys.some((key) => /^v2/i.test(key))
      && candidate.calculator.outputKeys.some((key) => /distance/i.test(key))
    ));
    return generic ? [generic.id] : [];
  }

  const flap = definition.flapOptions.find(
    (candidate) => candidate.value === context.configuration.flaps,
  ) ?? definition.flapOptions[0];
  if (!flap) return [];

  const bindings = [
    context.configuration.antiIce ? definition.n1.antiIceOn : definition.n1.antiIceOff,
    flap.v1
      ? (context.configuration.antiIce ? flap.v1.antiIceOn : flap.v1.antiIceOff)
      : undefined,
    flap.vr,
    flap.v2,
    flap.takeoffDistance
      ? (
          context.configuration.antiIce
            ? flap.takeoffDistance.antiIceOn
            : flap.takeoffDistance.antiIceOff
        )
      : undefined,
  ];

  return [...new Set(
    bindings
      .map((binding) => binding?.datasetId)
      .filter((datasetId): datasetId is string => Boolean(datasetId)),
  )];
}

function calculationId(result: PerformanceResult): string {
  return [
    "takeoff",
    result.context.activeFlightId,
    result.contextHash,
    result.computedAt,
  ].join(":");
}

export function createTakeoffSnapshotV2(
  result: PerformanceResult,
  options: TakeoffSnapshotWriteOptions,
): TakeoffSnapshotV2 {
  const weather = result.context.weather;
  if (!weather) {
    throw new Error("Native Takeoff Snapshot V2 requires applied QNH and OAT.");
  }
  if (
    options.runwayContext.airportIcao !== result.context.runway.airportIcao
    || options.runwayContext.runwayIdent !== result.context.runway.identifier
  ) {
    throw new Error("Takeoff Snapshot V2 runway provenance does not match the calculated context.");
  }

  const metarBound = options.qnhSource === "metar" || options.oatSource === "metar";
  if (metarBound && !options.observation) {
    throw new Error("METAR-sourced Snapshot V2 weather requires an observation reference.");
  }
  if (
    options.observation
    && metarBound
    && options.observation.station.toUpperCase() !== options.runwayContext.airportIcao.toUpperCase()
  ) {
    throw new Error("Snapshot V2 METAR station does not match the Takeoff airport.");
  }

  return {
    schemaVersion: 2,
    operation: "TAKEOFF",
    identity: {
      calculationId: calculationId(result),
      activeFlightId: result.context.activeFlightId,
      aircraftId: result.context.aircraftId,
      variant: options.variant?.trim() || null,
    },
    audit: {
      activeFlightDependencySnapshotId: result.context.dependencySnapshotId,
    },
    inputs: {
      runway: {
        airportIcao: options.runwayContext.airportIcao,
        identifier: options.runwayContext.runwayIdent,
        provenance: "airport-db",
        runwaySurfaceId: options.runwayContext.runwaySurfaceId,
        surfaceLengthFt: options.runwayContext.surfaceLengthFt,
        lengthBasis: options.runwayContext.lengthBasis,
        ...(options.runwayContext.dataSource
          ? { dataSource: options.runwayContext.dataSource }
          : {}),
      },
      weight: result.context.weight,
      configuration: result.context.configuration,
      weather: {
        observation: metarBound ? options.observation : null,
        qnhHpa: {
          value: weather.qnh,
          source: options.qnhSource,
        },
        oatC: {
          value: weather.oat,
          source: options.oatSource,
        },
      },
    },
    derived: {
      ...(result.calculationInputs.pressureAltitudeFt === undefined
        ? {}
        : { pressureAltitudeFt: result.calculationInputs.pressureAltitudeFt }),
    },
    source: {
      runtime: result.source,
      calculatorId: options.calculatorId ?? null,
      datasetIds: [...new Set(options.datasetIds)].sort(),
    },
    result: {
      n1: result.n1,
      v1: result.v1,
      vr: result.vr,
      v2: result.v2,
      takeoffDistance: result.takeoffDistance,
    },
    calculatedAt: result.computedAt,
    migration: null,
  };
}

export function migratePerformanceResultV1ToTakeoffSnapshotV2(
  result: PerformanceResult,
): TakeoffSnapshotV2 | null {
  const airportIcao = result.context.runway.airportIcao;
  if (!airportIcao) return null;

  const legacyWeather = result.context.weather
    ? {
        observation: null,
        qnhHpa: {
          value: result.context.weather.qnh,
          source: "legacy-unknown" as const,
        },
        oatC: {
          value: result.context.weather.oat,
          source: "legacy-unknown" as const,
        },
      }
    : result.calculationInputs.oatC === undefined
      ? null
      : {
          observation: null,
          oatC: {
            value: result.calculationInputs.oatC,
            source: "legacy-unknown" as const,
          },
        };

  return {
    schemaVersion: 2,
    operation: "TAKEOFF",
    identity: {
      calculationId: "legacy-v1:" + calculationId(result),
      activeFlightId: result.context.activeFlightId,
      aircraftId: result.context.aircraftId,
      variant: null,
    },
    audit: {
      activeFlightDependencySnapshotId: result.context.dependencySnapshotId,
    },
    inputs: {
      runway: {
        airportIcao,
        identifier: result.context.runway.identifier,
        provenance: "legacy-unknown",
      },
      weight: result.context.weight,
      configuration: result.context.configuration,
      weather: legacyWeather,
    },
    derived: {
      ...(result.calculationInputs.pressureAltitudeFt === undefined
        ? {}
        : { pressureAltitudeFt: result.calculationInputs.pressureAltitudeFt }),
    },
    source: {
      runtime: result.source,
      calculatorId: null,
      datasetIds: [],
    },
    result: {
      n1: result.n1,
      v1: result.v1,
      vr: result.vr,
      v2: result.v2,
      takeoffDistance: result.takeoffDistance,
    },
    calculatedAt: result.computedAt,
    migration: {
      fromSchemaVersion: 1,
      weatherProvenance: "legacy-unknown",
    },
  };
}

export function performanceResultFromTakeoffSnapshotV2(
  snapshot: TakeoffSnapshotV2,
): PerformanceResult {
  const weather = snapshot.inputs.weather;
  const context: FlightPerformanceContext = {
    activeFlightId: snapshot.identity.activeFlightId,
    aircraftId: snapshot.identity.aircraftId,
    dependencySnapshotId:
      snapshot.audit.activeFlightDependencySnapshotId ?? "snapshot-v2:audit-unavailable",
    weight: snapshot.inputs.weight,
    runway: {
      identifier: snapshot.inputs.runway.identifier,
      airportIcao: snapshot.inputs.runway.airportIcao,
    },
    configuration: snapshot.inputs.configuration,
    weather: weather?.qnhHpa && weather.oatC
      ? {
          qnh: weather.qnhHpa.value,
          oat: weather.oatC.value,
        }
      : null,
  };

  return {
    context,
    contextHash: computeContextHash(context),
    n1: snapshot.result.n1,
    v1: snapshot.result.v1,
    vr: snapshot.result.vr,
    v2: snapshot.result.v2,
    takeoffDistance: snapshot.result.takeoffDistance,
    computedAt: snapshot.calculatedAt,
    source: snapshot.source.runtime,
    calculationInputs: {
      ...(snapshot.derived.pressureAltitudeFt === undefined
        ? {}
        : { pressureAltitudeFt: snapshot.derived.pressureAltitudeFt }),
      ...(weather?.oatC === undefined ? {} : { oatC: weather.oatC.value }),
    },
  };
}

function readLegacyPerformanceResult(
  storage: PerformanceResultStorage,
  aircraftId: string,
  activeFlightId: string,
): PerformanceResult | null {
  const key = performanceResultKey(aircraftId, activeFlightId);
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPerformanceResult(parsed)) {
      storage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

export function readTakeoffPerformanceState(
  storage: PerformanceResultStorage,
  aircraftId: string,
  activeFlightId: string,
): TakeoffPerformanceReadState | null {
  const v2Key = performanceSnapshotV2Key("TAKEOFF", aircraftId, activeFlightId);
  const rawV2 = storage.getItem(v2Key);

  if (rawV2 !== null) {
    try {
      const parsed: unknown = JSON.parse(rawV2);
      if (
        !isTakeoffSnapshotV2(parsed)
        || parsed.identity.aircraftId !== aircraftId
        || parsed.identity.activeFlightId !== activeFlightId
      ) {
        // An existing V2 key is authoritative. Keep it in place and fail
        // closed rather than deleting it and resurrecting retained v1 data
        // on the next read.
        return null;
      }
      return {
        snapshot: parsed,
        result: performanceResultFromTakeoffSnapshotV2(parsed),
        requiresRecalculation: takeoffSnapshotRequiresRecalculation(parsed),
        migratedFromLegacy: parsed.migration?.fromSchemaVersion === 1,
      };
    } catch {
      // Same fail-closed rule for malformed V2 JSON: do not fall back to v1.
      return null;
    }
  }

  const legacy = readLegacyPerformanceResult(storage, aircraftId, activeFlightId);
  if (!legacy) return null;

  const migrated = migratePerformanceResultV1ToTakeoffSnapshotV2(legacy);
  if (!migrated) {
    return null;
  }

  storage.setItem(v2Key, JSON.stringify(migrated));
  return {
    snapshot: migrated,
    result: legacy,
    requiresRecalculation: true,
    migratedFromLegacy: true,
  };
}

export function readPerformanceResult(
  storage: PerformanceResultStorage,
  aircraftId: string,
  activeFlightId: string,
): PerformanceResult | null {
  return readTakeoffPerformanceState(storage, aircraftId, activeFlightId)?.result ?? null;
}

export function writeTakeoffPerformanceResultV2(
  storage: PerformanceResultStorage,
  result: PerformanceResult,
  options: TakeoffSnapshotWriteOptions,
): TakeoffSnapshotV2 {
  const snapshot = createTakeoffSnapshotV2(result, options);
  storage.setItem(
    performanceSnapshotV2Key(
      "TAKEOFF",
      result.context.aircraftId,
      result.context.activeFlightId,
    ),
    JSON.stringify(snapshot),
  );
  return snapshot;
}


function landingWeightLb(context: LandingPerformanceContext): number {
  return context.weight.unit === "lb"
    ? context.weight.value
    : context.weight.value * 2.2046226218;
}

export function landingSourceDatasetIds(
  definition: PilotLandingCalculatorDefinition | undefined,
): readonly string[] {
  if (!definition) return [];
  return [...new Set([
    definition.vrefDatasetId,
    definition.landingClimbDatasetId,
    definition.approachClimbDatasetId,
    definition.landingDistanceDatasetId,
  ])].sort();
}

export function computeLandingPerformance(
  context: LandingPerformanceContext,
  datasets: readonly PerformanceDataset[],
  definition: PilotLandingCalculatorDefinition | undefined,
  inputs: PerformanceCalculationInputs = {},
  now = new Date().toISOString(),
): LandingPerformanceResult {
  const unavailable = pending("No source-backed landing calculator is available.");
  const summary = definition
    ? calculatePilotLandingSummary(datasets, definition, {
        grossWeight: landingWeightLb(context),
        pressureAltitude: inputs.pressureAltitudeFt,
        oat: inputs.oatC,
      })
    : {
        vrefKias: unavailable,
        landingClimbSpeed: unavailable,
        approachClimbSpeed: unavailable,
        landingDistanceFt: unavailable,
      };

  return {
    context,
    contextHash: computeLandingContextHash(context),
    vref: summary.vrefKias,
    landingClimbSpeed: summary.landingClimbSpeed,
    approachClimbSpeed: summary.approachClimbSpeed,
    landingDistance: summary.landingDistanceFt,
    computedAt: new Date(now).toISOString(),
    source: "landing-calculator",
    calculationInputs: inputs,
  };
}

function landingCalculationId(result: LandingPerformanceResult): string {
  return [
    "landing",
    result.context.activeFlightId,
    result.contextHash,
    result.computedAt,
  ].join(":");
}

export function createLandingSnapshotV2(
  result: LandingPerformanceResult,
  options: LandingSnapshotWriteOptions,
): LandingSnapshotV2 {
  if (
    options.runwayContext.airportIcao !== result.context.runway.airportIcao
    || options.runwayContext.runwayIdent !== result.context.runway.identifier
  ) {
    throw new Error("Landing Snapshot V2 runway provenance does not match the calculated context.");
  }

  const metarBound = options.qnhSource === "metar" || options.oatSource === "metar";
  if (metarBound && !options.observation) {
    throw new Error("METAR-sourced Landing Snapshot V2 weather requires an observation reference.");
  }
  if (
    options.observation
    && metarBound
    && options.observation.station.toUpperCase() !== options.runwayContext.airportIcao.toUpperCase()
  ) {
    throw new Error("Snapshot V2 METAR station does not match the Landing airport.");
  }

  return {
    schemaVersion: 2,
    operation: "LANDING",
    identity: {
      calculationId: landingCalculationId(result),
      activeFlightId: result.context.activeFlightId,
      aircraftId: result.context.aircraftId,
      variant: options.variant?.trim() || null,
    },
    audit: {
      activeFlightDependencySnapshotId: result.context.dependencySnapshotId,
    },
    inputs: {
      runway: {
        airportIcao: options.runwayContext.airportIcao,
        identifier: options.runwayContext.runwayIdent,
        provenance: "airport-db",
        runwaySurfaceId: options.runwayContext.runwaySurfaceId,
        surfaceLengthFt: options.runwayContext.surfaceLengthFt,
        lengthBasis: options.runwayContext.lengthBasis,
        ...(options.runwayContext.dataSource
          ? { dataSource: options.runwayContext.dataSource }
          : {}),
      },
      weight: result.context.weight,
      configuration: result.context.configuration,
      weather: {
        observation: metarBound ? options.observation : null,
        qnhHpa: {
          value: result.context.weather.qnh,
          source: options.qnhSource,
        },
        oatC: {
          value: result.context.weather.oat,
          source: options.oatSource,
        },
      },
    },
    derived: {
      ...(result.calculationInputs.pressureAltitudeFt === undefined
        ? {}
        : { pressureAltitudeFt: result.calculationInputs.pressureAltitudeFt }),
    },
    source: {
      runtime: result.source,
      calculatorId: options.calculatorId ?? null,
      datasetIds: [...new Set(options.datasetIds)].sort(),
    },
    result: {
      vref: result.vref,
      landingClimbSpeed: result.landingClimbSpeed,
      approachClimbSpeed: result.approachClimbSpeed,
      landingDistance: result.landingDistance,
    },
    calculatedAt: result.computedAt,
    migration: null,
  };
}

export function landingPerformanceResultFromSnapshotV2(
  snapshot: LandingSnapshotV2,
): LandingPerformanceResult {
  const context: LandingPerformanceContext = {
    activeFlightId: snapshot.identity.activeFlightId,
    aircraftId: snapshot.identity.aircraftId,
    dependencySnapshotId:
      snapshot.audit.activeFlightDependencySnapshotId ?? "snapshot-v2:audit-unavailable",
    weight: snapshot.inputs.weight,
    runway: {
      identifier: snapshot.inputs.runway.identifier,
      airportIcao: snapshot.inputs.runway.airportIcao,
    },
    configuration: snapshot.inputs.configuration,
    weather: {
      qnh: snapshot.inputs.weather.qnhHpa!.value,
      oat: snapshot.inputs.weather.oatC!.value,
    },
  };

  return {
    context,
    contextHash: computeLandingContextHash(context),
    vref: snapshot.result.vref,
    landingClimbSpeed: snapshot.result.landingClimbSpeed,
    approachClimbSpeed: snapshot.result.approachClimbSpeed,
    landingDistance: snapshot.result.landingDistance,
    computedAt: snapshot.calculatedAt,
    source: "landing-calculator",
    calculationInputs: {
      ...(snapshot.derived.pressureAltitudeFt === undefined
        ? {}
        : { pressureAltitudeFt: snapshot.derived.pressureAltitudeFt }),
      oatC: snapshot.inputs.weather.oatC!.value,
    },
  };
}

export function readLandingPerformanceState(
  storage: PerformanceResultStorage,
  aircraftId: string,
  activeFlightId: string,
): LandingPerformanceReadState | null {
  const key = performanceSnapshotV2Key("LANDING", aircraftId, activeFlightId);
  const raw = storage.getItem(key);
  if (raw === null) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      !isLandingSnapshotV2(parsed)
      || parsed.identity.aircraftId !== aircraftId
      || parsed.identity.activeFlightId !== activeFlightId
    ) {
      return null;
    }
    return {
      snapshot: parsed,
      result: landingPerformanceResultFromSnapshotV2(parsed),
      requiresRecalculation: landingSnapshotRequiresRecalculation(parsed),
    };
  } catch {
    return null;
  }
}

export function writeLandingPerformanceResultV2(
  storage: PerformanceResultStorage,
  result: LandingPerformanceResult,
  options: LandingSnapshotWriteOptions,
): LandingSnapshotV2 {
  const snapshot = createLandingSnapshotV2(result, options);
  storage.setItem(
    performanceSnapshotV2Key(
      "LANDING",
      result.context.aircraftId,
      result.context.activeFlightId,
    ),
    JSON.stringify(snapshot),
  );
  return snapshot;
}

/**
 * Legacy v1 writer retained as a compatibility/test seam during P1.2.
 * New EFB calculations must use writeTakeoffPerformanceResultV2().
 */
export function writePerformanceResult(
  storage: PerformanceResultStorage,
  result: PerformanceResult,
): void {
  storage.setItem(
    performanceResultKey(result.context.aircraftId, result.context.activeFlightId),
    JSON.stringify(result),
  );
}

export function clearPerformanceResult(
  storage: PerformanceResultStorage,
  aircraftId: string,
  activeFlightId: string,
): void {
  storage.removeItem(performanceResultKey(aircraftId, activeFlightId));
  storage.removeItem(performanceSnapshotV2Key("TAKEOFF", aircraftId, activeFlightId));
  storage.removeItem(performanceSnapshotV2Key("LANDING", aircraftId, activeFlightId));
}

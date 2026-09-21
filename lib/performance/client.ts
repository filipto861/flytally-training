"use client";

import {
  calculateMultiAxisMetricGrid,
} from "../performance-calculator.ts";
import {
  calculatePilotTakeoffSummary,
  type PilotTakeoffCalculatorDefinition,
  type PilotTakeoffMetricResult,
} from "../pilot-takeoff-calculator.ts";
import type {
  PerformanceDataset,
  PerformanceScalar,
} from "../universal-aircraft-content.ts";
import {
  computeContextHash,
  type FlightPerformanceContext,
} from "./context.ts";

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

function metric(value: unknown): value is PilotTakeoffMetricResult {
  const row = object(value);
  return Boolean(
    row
    && ["ready", "missing", "out-of-range", "unavailable", "pending"].includes(String(row.status)),
  );
}

function context(value: unknown): value is FlightPerformanceContext {
  const row = object(value);
  const weight = object(row?.weight);
  const runway = object(row?.runway);
  const configuration = object(row?.configuration);
  return Boolean(
    row
    && typeof row.activeFlightId === "string"
    && typeof row.aircraftId === "string"
    && typeof row.dependencySnapshotId === "string"
    && weight
    && typeof weight.value === "number"
    && (weight.unit === "kg" || weight.unit === "lb")
    && runway
    && typeof runway.identifier === "string"
    && configuration
    && typeof configuration.flaps === "string"
    && typeof configuration.antiIce === "boolean",
  );
}

function isPerformanceResult(value: unknown): value is PerformanceResult {
  const row = object(value);
  return Boolean(
    row
    && context(row.context)
    && typeof row.contextHash === "string"
    && metric(row.n1)
    && metric(row.v1)
    && metric(row.vr)
    && metric(row.v2)
    && metric(row.takeoffDistance)
    && typeof row.computedAt === "string"
    && !Number.isNaN(Date.parse(row.computedAt as string))
    && (row.source === "takeoff-calculator" || row.source === "multi-axis-metric-grid")
    && object(row.calculationInputs),
  );
}

export function readPerformanceResult(
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
}

import { calculateMultiAxisMetricGrid } from "./performance-calculator.ts";
import type { PilotTakeoffMetricResult } from "./pilot-takeoff-calculator.ts";
import type { PerformanceDataset, PerformanceScalar } from "./universal-aircraft-content.ts";

export type PilotLandingFlapOption = {
  readonly value: string;
  readonly label: string;
};

export interface PilotLandingCalculatorDefinition {
  readonly flapOptions: readonly PilotLandingFlapOption[];
  readonly vrefDatasetId: string;
  readonly landingClimbDatasetId: string;
  readonly approachClimbDatasetId: string;
  readonly landingDistanceDatasetId: string;
}

export interface PilotLandingInputs {
  readonly pressureAltitude?: number;
  readonly oat?: number;
  readonly grossWeight?: number;
  readonly windComponentKt?: number;
}

export interface PilotLandingSummary {
  readonly vrefKias: PilotTakeoffMetricResult;
  readonly vappKias: PilotTakeoffMetricResult;
  readonly landingClimbSpeed: PilotTakeoffMetricResult;
  readonly approachClimbSpeed: PilotTakeoffMetricResult;
  readonly landingDistanceFt: PilotTakeoffMetricResult;
}

function datasetById(
  datasets: readonly PerformanceDataset[],
  datasetId: string,
): PerformanceDataset | undefined {
  return datasets.find((dataset) => dataset.id === datasetId);
}

function evaluateSingleMetric(
  dataset: PerformanceDataset | undefined,
  inputs: Readonly<Record<string, PerformanceScalar | undefined>>,
): PilotTakeoffMetricResult {
  if (!dataset) {
    return { status: "unavailable", reason: "Source dataset unavailable." };
  }

  const calculation = calculateMultiAxisMetricGrid(dataset, inputs);
  if (calculation.status === "incomplete") {
    return { status: "missing", reason: calculation.reason };
  }
  if (calculation.status !== "ready") {
    return { status: "out-of-range", reason: calculation.reason };
  }

  const metric = calculation.metrics?.[0];
  if (!metric || typeof metric.value !== "number") {
    return { status: "unavailable", reason: "Declared output unavailable." };
  }

  return {
    status: "ready",
    value: metric.value,
    unit: metric.unit,
  };
}

function deriveVapp(
  vref: PilotTakeoffMetricResult,
  windComponentKt: number | undefined,
): PilotTakeoffMetricResult {
  if (vref.status !== "ready" || vref.value === undefined) {
    return vref;
  }

  const addFive = windComponentKt !== undefined && windComponentKt >= 10;
  return {
    ...vref,
    value: vref.value + (addFive ? 5 : 0),
    reason: addFive
      ? "Recommended per FlightSafety training guidance."
      : windComponentKt === undefined
        ? "No runway-aligned wind context available; VAPP shown at VREF."
        : "No additional approach-speed increment applied for this wind component.",
  };
}

export function calculatePilotLandingSummary(
  datasets: readonly PerformanceDataset[],
  definition: PilotLandingCalculatorDefinition,
  inputs: PilotLandingInputs,
): PilotLandingSummary {
  const grossWeightInputs = {
    grossWeight: inputs.grossWeight,
  };
  const vrefKias = evaluateSingleMetric(
    datasetById(datasets, definition.vrefDatasetId),
    grossWeightInputs,
  );

  return {
    vrefKias,
    vappKias: deriveVapp(vrefKias, inputs.windComponentKt),
    landingClimbSpeed: evaluateSingleMetric(
      datasetById(datasets, definition.landingClimbDatasetId),
      grossWeightInputs,
    ),
    approachClimbSpeed: evaluateSingleMetric(
      datasetById(datasets, definition.approachClimbDatasetId),
      grossWeightInputs,
    ),
    landingDistanceFt: evaluateSingleMetric(
      datasetById(datasets, definition.landingDistanceDatasetId),
      {
        pressureAltitude: inputs.pressureAltitude,
        oat: inputs.oat,
        grossWeight: inputs.grossWeight,
      },
    ),
  };
}

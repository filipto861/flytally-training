import { calculateMultiAxisMetricGrid } from "./performance-calculator.ts";
import type { PerformanceDataset, PerformanceScalar } from "./universal-aircraft-content.ts";

export type PilotTakeoffNumericInputKey = "pressureAltitude" | "oat" | "takeoffWeight";

export type PilotTakeoffMetricBinding = {
  readonly datasetId: string;
  readonly outputKey: string;
  readonly inputs: readonly {
    readonly input: PilotTakeoffNumericInputKey;
    readonly axisKey: string;
  }[];
  readonly precision?: number;
};

export type PilotTakeoffFlapOption = {
  readonly value: string;
  readonly label: string;
  readonly v1?: {
    readonly antiIceOff: PilotTakeoffMetricBinding;
    readonly antiIceOn?: PilotTakeoffMetricBinding;
  };
  readonly vr: PilotTakeoffMetricBinding;
  readonly v2: PilotTakeoffMetricBinding;
};

export type PilotTakeoffCalculatorDefinition = {
  readonly id: string;
  readonly title: string;
  readonly inputs: {
    readonly pressureAltitude: { readonly label: string; readonly unit: string };
    readonly oat: { readonly label: string; readonly unit: string };
    readonly takeoffWeight: { readonly label: string; readonly unit: string };
    readonly flaps: { readonly label: string };
    readonly antiIce: { readonly label: string };
  };
  readonly n1: {
    readonly antiIceOff: PilotTakeoffMetricBinding;
    readonly antiIceOn?: PilotTakeoffMetricBinding;
  };
  readonly flapOptions: readonly PilotTakeoffFlapOption[];
  readonly vref: PilotTakeoffMetricBinding;
  readonly placeholders: readonly {
    readonly key: "v1" | "takeoffDistance";
    readonly label: string;
    readonly unit?: string;
    readonly milestone: string;
  }[];
  readonly disclaimer: string;
};

export type PilotTakeoffCalculatorInputs = {
  readonly pressureAltitude?: number;
  readonly oat?: number;
  readonly takeoffWeight?: number;
  readonly flaps: string;
  readonly antiIce: boolean;
};

export type PilotTakeoffMetricStatus = "ready" | "missing" | "out-of-range" | "unavailable" | "pending";

export type PilotTakeoffMetricResult = {
  readonly status: PilotTakeoffMetricStatus;
  readonly value?: number;
  readonly unit?: string;
  readonly precision?: number;
  readonly reason?: string;
};

export type PilotTakeoffSummary = {
  readonly n1: PilotTakeoffMetricResult;
  readonly vr: PilotTakeoffMetricResult;
  readonly v2: PilotTakeoffMetricResult;
  readonly vref: PilotTakeoffMetricResult;
  readonly v1: PilotTakeoffMetricResult;
  readonly takeoffDistance: PilotTakeoffMetricResult;
};

function datasetById(
  datasets: readonly PerformanceDataset[],
  datasetId: string,
): PerformanceDataset | undefined {
  return datasets.find((dataset) => dataset.id === datasetId);
}

function inputValue(
  inputs: PilotTakeoffCalculatorInputs,
  key: PilotTakeoffNumericInputKey,
): number | undefined {
  if (key === "pressureAltitude") return inputs.pressureAltitude;
  if (key === "oat") return inputs.oat;
  return inputs.takeoffWeight;
}

function evaluateMetric(
  datasets: readonly PerformanceDataset[],
  binding: PilotTakeoffMetricBinding,
  inputs: PilotTakeoffCalculatorInputs,
): PilotTakeoffMetricResult {
  const dataset = datasetById(datasets, binding.datasetId);
  if (!dataset) {
    return { status: "unavailable", precision: binding.precision, reason: "Source dataset unavailable." };
  }

  const calculatorInputs: Record<string, PerformanceScalar | undefined> = {};
  for (const inputBinding of binding.inputs) {
    const value = inputValue(inputs, inputBinding.input);
    if (value === undefined) {
      return { status: "missing", precision: binding.precision };
    }
    calculatorInputs[inputBinding.axisKey] = value;
  }

  const calculation = calculateMultiAxisMetricGrid(dataset, calculatorInputs);
  if (calculation.status === "incomplete") {
    return { status: "missing", precision: binding.precision, reason: calculation.reason };
  }
  if (calculation.status !== "ready") {
    return { status: "out-of-range", precision: binding.precision, reason: calculation.reason };
  }

  const metric = calculation.metrics?.find((candidate) => candidate.key === binding.outputKey);
  if (!metric || typeof metric.value !== "number") {
    return { status: "unavailable", precision: binding.precision, reason: "Declared output unavailable." };
  }

  return {
    status: "ready",
    value: metric.value,
    unit: metric.unit,
    precision: binding.precision,
  };
}

const pending = (reason: string): PilotTakeoffMetricResult => ({
  status: "pending",
  reason,
});

export function calculatePilotTakeoffSummary(
  datasets: readonly PerformanceDataset[],
  definition: PilotTakeoffCalculatorDefinition,
  inputs: PilotTakeoffCalculatorInputs,
): PilotTakeoffSummary {
  const flap = definition.flapOptions.find((option) => option.value === inputs.flaps)
    ?? definition.flapOptions[0];

  const n1Binding = inputs.antiIce ? definition.n1.antiIceOn : definition.n1.antiIceOff;
  const n1 = n1Binding
    ? evaluateMetric(datasets, n1Binding, inputs)
    : {
        status: "unavailable" as const,
        reason: inputs.antiIce
          ? "Anti-ice ON N1 data is not available in the current source package."
          : "N1 source data is unavailable.",
      };

  const v1Binding = flap?.v1
    ? (inputs.antiIce ? flap.v1.antiIceOn : flap.v1.antiIceOff)
    : undefined;
  const v1 = flap?.v1
    ? v1Binding
      ? evaluateMetric(datasets, v1Binding, inputs)
      : {
          status: "unavailable" as const,
          reason: inputs.antiIce
            ? "Anti-ice ON V1 data is not available in the current source package."
            : "V1 source data is unavailable.",
        }
    : pending(definition.placeholders.find((item) => item.key === "v1")?.milestone ?? "Not yet implemented.");

  return {
    n1,
    vr: flap
      ? evaluateMetric(datasets, flap.vr, inputs)
      : { status: "unavailable", reason: "No flap configuration is available." },
    v2: flap
      ? evaluateMetric(datasets, flap.v2, inputs)
      : { status: "unavailable", reason: "No flap configuration is available." },
    vref: evaluateMetric(datasets, definition.vref, inputs),
    v1,
    takeoffDistance: pending(
      definition.placeholders.find((item) => item.key === "takeoffDistance")?.milestone ?? "Not yet implemented.",
    ),
  };
}

export function formatPilotTakeoffMetric(result: PilotTakeoffMetricResult): string {
  if (result.status === "out-of-range") return "Out of range";
  if (result.status === "unavailable") return "Unavailable";
  if (result.status !== "ready" || result.value === undefined) return "—";

  const precision = result.precision ?? 0;
  const value = Number(result.value.toFixed(precision)).toLocaleString("en-US", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
  return result.unit ? `${value} ${result.unit}` : value;
}

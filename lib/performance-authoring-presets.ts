import { performancePhases, type PerformancePhase } from "./universal-aircraft-content.ts";

export const performanceAuthoringModes = [
  "reference-only",
  "metric-lookup",
  "runway-distance-grid",
  "distance-factor",
] as const;

export type PerformanceAuthoringMode = typeof performanceAuthoringModes[number];

export function isPerformanceAuthoringMode(value: string): value is PerformanceAuthoringMode {
  return (performanceAuthoringModes as readonly string[]).includes(value);
}

function phase(value: string | undefined, fallback: PerformancePhase): PerformancePhase {
  return (performancePhases as readonly string[]).includes(value ?? "") ? value as PerformancePhase : fallback;
}

function runwayOperation(value: string | undefined): "takeoff" | "landing" {
  return value === "landing" ? "landing" : "takeoff";
}

export function performanceAuthoringModeFromDataset(dataset: unknown): PerformanceAuthoringMode {
  if (!dataset || typeof dataset !== "object" || Array.isArray(dataset)) return "reference-only";
  const calculator=(dataset as Record<string,unknown>).calculator;
  if (!calculator || typeof calculator !== "object" || Array.isArray(calculator)) return "reference-only";
  const kind=(calculator as Record<string,unknown>).kind;
  return typeof kind === "string" && isPerformanceAuthoringMode(kind) ? kind : "reference-only";
}

export function createPerformanceAuthoringStructure(
  mode: PerformanceAuthoringMode,
  requestedOperation?: string,
): Record<string, unknown> {
  if (mode === "reference-only") {
    return {
      phase: "reference",
      axes: [{ key: "lookupValue", label: "Lookup value", unit: "", values: [0] }],
      outputs: [{ key: "result", label: "Result", unit: "" }],
      rows: [{ inputs: { lookupValue: 0 }, outputs: { result: 0 } }],
      interpolation: "none",
    };
  }

  if (mode === "metric-lookup") {
    const operation=phase(requestedOperation,"reference");
    return {
      phase: operation,
      calculator: { kind: "metric-lookup", operation, axisKey: "lookupValue", outputKeys: ["result"] },
      axes: [{ key: "lookupValue", label: "Lookup value", unit: "", values: [0] }],
      outputs: [{ key: "result", label: "Result", unit: "" }],
      rows: [{ inputs: { lookupValue: 0 }, outputs: { result: 0 } }],
      interpolation: "none",
    };
  }

  if (mode === "runway-distance-grid") {
    const operation=runwayOperation(requestedOperation);
    return {
      phase: operation,
      calculator: {
        kind: "runway-distance-grid",
        operation,
        bindings: {
          altitudeAxis: "fieldElevation",
          isaDeviationAxis: "isaDeviation",
          surfaceAxis: "runwayState",
          sourceTemperatureOutput: "sourceTemperature",
          groundRunOutput: "groundRun",
          obstacleDistanceOutput: "obstacleDistance",
        },
        oatInput: { key: "oat", label: "Outside air temperature", unit: "°C" },
        runwayAvailableInput: { key: "runwayAvailable", label: operation === "takeoff" ? "TORA" : "LDA", unit: "m", optional: true },
        obstacleHeight: { value: 50, unit: "ft" },
      },
      axes: [
        { key: "fieldElevation", label: "Field elevation", unit: "ft", values: [0] },
        { key: "isaDeviation", label: "ISA deviation", unit: "°C", values: [0] },
        { key: "runwayState", label: "Runway state", values: ["Dry"] },
      ],
      outputs: [
        { key: "sourceTemperature", label: "Source temperature", unit: "°C" },
        { key: "groundRun", label: "Ground run", unit: "m" },
        { key: "obstacleDistance", label: "Obstacle distance", unit: "m" },
      ],
      rows: [{
        inputs: { fieldElevation: 0, isaDeviation: 0, runwayState: "Dry" },
        outputs: { sourceTemperature: 15, groundRun: 0, obstacleDistance: 0 },
      }],
      interpolation: "none",
    };
  }

  const operation=runwayOperation(requestedOperation);
  return {
    phase: operation,
    calculator: {
      kind: "distance-factor",
      operation,
      baselineDistanceInput: { key: "baselineDistance", label: "Published baseline distance", unit: "m" },
      runwayAvailableInput: { key: "runwayAvailable", label: operation === "takeoff" ? "TORA" : "LDA", unit: "m", optional: true },
      selector: {
        kind: "output-options",
        label: "Condition",
        lookupAxis: "lookupValue",
        baseline: { value: "baseline", label: "Published baseline", fixedFactor: 1 },
        options: [{ value: "condition", label: "Condition", factorOutputKey: "factor" }],
      },
      constraints: [],
    },
    axes: [{ key: "lookupValue", label: "Lookup value", unit: "", values: [0] }],
    outputs: [{ key: "factor", label: "Distance factor" }],
    rows: [{ inputs: { lookupValue: 0 }, outputs: { factor: 1 } }],
    interpolation: "none",
  };
}

export function createPerformanceAuthoringDataset(mode: PerformanceAuthoringMode="metric-lookup"): Record<string, unknown> {
  return {
    id: "",
    title: "",
    kind: "reference-table",
    ...createPerformanceAuthoringStructure(mode),
    applicability: {},
  };
}

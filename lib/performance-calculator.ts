import { getPerformanceSelectionState, performanceScalarKey } from "./performance-runtime.ts";
import type { PerformanceDataset, PerformanceRow, PerformanceScalar } from "./universal-aircraft-content.ts";

export type PerformanceCalculatorProfile = {
  readonly takeoffFactorDataset?: PerformanceDataset;
  readonly landingFactorDataset?: PerformanceDataset;
  readonly landingSpeedDataset?: PerformanceDataset;
};

export type TakeoffSurfaceOption = {
  readonly value: string;
  readonly label: string;
  readonly outputKey?: string;
};

export type DistanceCalculation = {
  readonly status: "incomplete" | "unsupported" | "ready";
  readonly reason?: string;
  readonly factor?: number;
  readonly correctedDistance?: number;
  readonly margin?: number;
  readonly runwayUsePercent?: number;
  readonly withinRunway?: boolean;
};

export type LandingSpeeds = {
  readonly vref?: number;
  readonly vapp?: number;
};

const takeoffSurfaceDefinitions: readonly TakeoffSurfaceOption[] = [
  { value: "dry", label: "Dry / chart baseline" },
  { value: "wet-8", label: "Wet · flaps 8°", outputKey: "wet8" },
  { value: "wet-20", label: "Wet · flaps 20°", outputKey: "wet20" },
  { value: "moderate", label: "Contaminated · moderate · flaps 20°", outputKey: "moderate" },
  { value: "heavy", label: "Contaminated · heavy · flaps 20°", outputKey: "heavy" },
  { value: "compacted-snow", label: "Compacted snow · flaps 20°", outputKey: "compactedSnow" },
  { value: "wet-ice", label: "Wet ice · flaps 20°", outputKey: "wetIce" },
];

function hasAxis(dataset: PerformanceDataset, key: string): boolean {
  return dataset.axes.some((axis) => axis.key === key);
}

function hasOutput(dataset: PerformanceDataset, key: string): boolean {
  return dataset.outputs.some((output) => output.key === key);
}

function exactRow(dataset: PerformanceDataset, inputs: Readonly<Record<string, PerformanceScalar>>): PerformanceRow | undefined {
  if (!dataset.axes.every((axis) => Object.prototype.hasOwnProperty.call(inputs, axis.key))) return undefined;
  const filters = Object.fromEntries(dataset.axes.map((axis) => [axis.key, performanceScalarKey(inputs[axis.key])]));
  const selection = getPerformanceSelectionState(dataset, filters);
  return selection.status === "exact" ? selection.exactRow : undefined;
}

function numericOutput(row: PerformanceRow | undefined, outputKey: string): number | undefined {
  const value = row?.outputs[outputKey];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function numericAxisValues(dataset: PerformanceDataset | undefined, axisKey: string): readonly number[] {
  const values = dataset?.axes.find((axis) => axis.key === axisKey)?.values
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value)) ?? [];
  return [...new Set(values)].sort((left, right) => left - right);
}

export function buildPerformanceCalculatorProfile(datasets: readonly PerformanceDataset[]): PerformanceCalculatorProfile {
  const takeoffFactorDataset = datasets.find((dataset) =>
    hasAxis(dataset, "weight")
    && ["wet8", "wet20", "moderate", "heavy", "compactedSnow", "wetIce"].every((key) => hasOutput(dataset, key)),
  );
  const landingFactorDataset = datasets.find((dataset) =>
    hasAxis(dataset, "surface") && hasOutput(dataset, "factor")
    && dataset.rows.some((row) => typeof row.inputs.surface === "string"),
  );
  const landingSpeedDataset = datasets.find((dataset) =>
    hasAxis(dataset, "weight") && hasOutput(dataset, "vref") && hasOutput(dataset, "vapp"),
  );
  return { takeoffFactorDataset, landingFactorDataset, landingSpeedDataset };
}

export function getTakeoffSurfaceOptions(profile: PerformanceCalculatorProfile): readonly TakeoffSurfaceOption[] {
  return takeoffSurfaceDefinitions.filter((option) => !option.outputKey || (profile.takeoffFactorDataset && hasOutput(profile.takeoffFactorDataset, option.outputKey)));
}

export function getTakeoffWeights(profile: PerformanceCalculatorProfile): readonly number[] {
  return numericAxisValues(profile.takeoffFactorDataset, "weight");
}

export function getLandingWeights(profile: PerformanceCalculatorProfile): readonly number[] {
  return numericAxisValues(profile.landingSpeedDataset, "weight");
}

export function getLandingSurfaceOptions(profile: PerformanceCalculatorProfile): readonly string[] {
  const sourceValues = profile.landingFactorDataset?.axes.find((axis) => axis.key === "surface")?.values
    .filter((value): value is string => typeof value === "string") ?? [];
  return ["Dry", ...sourceValues.filter((value, index) => sourceValues.indexOf(value) === index)];
}

function distanceResult(dryDistance: number | undefined, runwayAvailable: number | undefined, factor: number): DistanceCalculation {
  if (dryDistance === undefined || !Number.isFinite(dryDistance) || dryDistance <= 0) {
    return { status: "incomplete", reason: "Enter the dry distance from the controlling performance chart." };
  }
  const correctedDistance = dryDistance * factor;
  const validRunway = runwayAvailable !== undefined && Number.isFinite(runwayAvailable) && runwayAvailable > 0 ? runwayAvailable : undefined;
  const margin = validRunway === undefined ? undefined : validRunway - correctedDistance;
  return {
    status: "ready",
    factor,
    correctedDistance,
    margin,
    runwayUsePercent: validRunway === undefined ? undefined : (correctedDistance / validRunway) * 100,
    withinRunway: validRunway === undefined ? undefined : correctedDistance <= validRunway,
  };
}

export function calculateTakeoffDistance(
  profile: PerformanceCalculatorProfile,
  input: Readonly<{
    dryDistance?: number;
    runwayAvailable?: number;
    weight?: number;
    surface: string;
  }>,
): DistanceCalculation {
  if (input.surface === "dry") return distanceResult(input.dryDistance, input.runwayAvailable, 1);
  const option = getTakeoffSurfaceOptions(profile).find((candidate) => candidate.value === input.surface);
  if (!option?.outputKey || !profile.takeoffFactorDataset) {
    return { status: "unsupported", reason: "No published takeoff correction factor is available for this selection." };
  }
  if (input.weight === undefined) {
    return { status: "incomplete", reason: "Select an exact source-table takeoff weight." };
  }
  const factor = numericOutput(exactRow(profile.takeoffFactorDataset, { weight: input.weight }), option.outputKey);
  if (factor === undefined) {
    return { status: "unsupported", reason: "This weight is not an exact stored source row. FlyTally will not interpolate this takeoff factor." };
  }
  return distanceResult(input.dryDistance, input.runwayAvailable, factor);
}

export function getLandingSpeeds(profile: PerformanceCalculatorProfile, weight: number | undefined): LandingSpeeds | undefined {
  if (weight === undefined || !profile.landingSpeedDataset) return undefined;
  const row = exactRow(profile.landingSpeedDataset, { weight });
  if (!row) return undefined;
  return {
    vref: numericOutput(row, "vref"),
    vapp: numericOutput(row, "vapp"),
  };
}

export function calculateLandingDistance(
  profile: PerformanceCalculatorProfile,
  input: Readonly<{
    dryDistance?: number;
    runwayAvailable?: number;
    surface: string;
    oatC?: number;
  }>,
): DistanceCalculation {
  if (input.surface === "Dry") return distanceResult(input.dryDistance, input.runwayAvailable, 1);
  if (!profile.landingFactorDataset) {
    return { status: "unsupported", reason: "No published landing correction-factor table is available." };
  }
  const temperatureLimited = input.surface === "Compacted snow" || input.surface === "Wet ice";
  if (temperatureLimited && input.oatC === undefined) {
    return { status: "incomplete", reason: "Enter OAT. This source factor is limited to 4.4°C / 40°F and below." };
  }
  if (temperatureLimited && (input.oatC as number) > 4.4) {
    return { status: "unsupported", reason: "The published source does not authorize this factor above 4.4°C / 40°F." };
  }
  const factor = numericOutput(exactRow(profile.landingFactorDataset, { surface: input.surface }), "factor");
  if (factor === undefined) {
    return { status: "unsupported", reason: "No exact source-backed landing factor exists for this runway surface." };
  }
  return distanceResult(input.dryDistance, input.runwayAvailable, factor);
}

import { getPerformanceSelectionState, performanceScalarKey } from "./performance-runtime.ts";
import type { PerformanceDataset, PerformanceDistanceFactorCalculator, PerformanceRow, PerformanceScalar } from "./universal-aircraft-content.ts";

export type PerformanceCalculatorProfile = {
  readonly takeoffGridDataset?: PerformanceDataset;
  readonly landingGridDataset?: PerformanceDataset;
  readonly takeoffFactorDataset?: PerformanceDataset;
  readonly landingFactorDataset?: PerformanceDataset;
  readonly landingSpeedDataset?: PerformanceDataset;
};

export type TakeoffSurfaceOption = {
  readonly value: string;
  readonly label: string;
  readonly outputKey?: string;
  readonly fixedFactor?: number;
};

export type MetricLookupResult = {
  readonly key: string;
  readonly label: string;
  readonly unit?: string;
  readonly value: PerformanceScalar;
};

export type MultiAxisMetricGridCalculation = {
  readonly status: "incomplete" | "unsupported" | "ready";
  readonly reason?: string;
  readonly method?: "exact-source-row" | "bounded-linear-interpolation";
  readonly metrics?: readonly MetricLookupResult[];
};

export type PostBaselineTransformCalculation = {
  readonly status: "incomplete" | "unsupported" | "ready";
  readonly reason?: string;
  readonly method?: "exact-source-row" | "bounded-linear-interpolation";
  readonly value?: number;
  readonly unit?: string;
};

export type DistanceFactorInput = Readonly<{
  baselineDistance?: number;
  runwayAvailable?: number;
  selection: string;
  lookupValue?: PerformanceScalar;
  constraintInputs?: Readonly<Record<string, number | undefined>>;
}>;

export type DistanceCalculation = {
  readonly status: "incomplete" | "unsupported" | "ready";
  readonly reason?: string;
  readonly factor?: number;
  readonly correctedDistance?: number;
  readonly margin?: number;
  readonly runwayUsePercent?: number;
  readonly withinRunway?: boolean;
};

export type NativeDistanceCalculation = {
  readonly status: "incomplete" | "unsupported" | "ready";
  readonly reason?: string;
  readonly method?: "exact-source-row" | "bounded-linear-interpolation";
  readonly sourceIsaTemperatureC?: number;
  readonly isaDeviationC?: number;
  readonly groundRunM?: number;
  readonly distance50ftM?: number;
  readonly groundRunMarginM?: number;
  readonly distance50ftMarginM?: number;
  readonly groundRunUsePercent?: number;
  readonly distance50ftUsePercent?: number;
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

function stringAxisValues(dataset: PerformanceDataset | undefined, axisKey: string): readonly string[] {
  const values = dataset?.axes.find((axis) => axis.key === axisKey)?.values
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0) ?? [];
  return [...new Set(values)];
}

type GridBindings = {
  readonly altitudeAxis: string;
  readonly isaDeviationAxis: string;
  readonly surfaceAxis: string;
  readonly sourceTemperatureOutput: string;
  readonly groundRunOutput: string;
  readonly obstacleDistanceOutput: string;
};

function gridBindings(dataset: PerformanceDataset): GridBindings {
  if (dataset.calculator?.kind === "runway-distance-grid") return dataset.calculator.bindings;
  // Transitional adapter for already-published pre-v3.1 datasets. New governed
  // content declares these bindings explicitly and may use any dataset key names.
  return {
    altitudeAxis: "airportAltitudeFt",
    isaDeviationAxis: "isaDeviationC",
    surfaceAxis: "surface",
    sourceTemperatureOutput: "oatC",
    groundRunOutput: "groundRunM",
    obstacleDistanceOutput: "distance50ftM",
  };
}

function isNativeDistanceGrid(dataset: PerformanceDataset): boolean {
  const bindings = gridBindings(dataset);
  return hasAxis(dataset, bindings.altitudeAxis)
    && hasAxis(dataset, bindings.isaDeviationAxis)
    && hasAxis(dataset, bindings.surfaceAxis)
    && hasOutput(dataset, bindings.sourceTemperatureOutput)
    && hasOutput(dataset, bindings.groundRunOutput)
    && hasOutput(dataset, bindings.obstacleDistanceOutput);
}

function gridIntent(dataset: PerformanceDataset): "takeoff" | "landing" | undefined {
  if (dataset.calculator?.kind === "runway-distance-grid") return dataset.calculator.operation;
  const identity = `${dataset.id} ${dataset.title}`.toLowerCase();
  if (/\btakeoff\b/.test(identity)) return "takeoff";
  if (/\blanding\b/.test(identity)) return "landing";
  return undefined;
}

export function buildPerformanceCalculatorProfile(datasets: readonly PerformanceDataset[]): PerformanceCalculatorProfile {
  const nativeGrids = datasets.filter(isNativeDistanceGrid);
  const takeoffGridDataset = nativeGrids.find((dataset) => gridIntent(dataset) === "takeoff");
  const landingGridDataset = nativeGrids.find((dataset) => gridIntent(dataset) === "landing");

  const takeoffFactorDataset = datasets.find((dataset) =>
    dataset.calculator?.kind === "distance-factor" && dataset.calculator.operation === "takeoff",
  ) ?? datasets.find((dataset) =>
    hasAxis(dataset, "weight")
    && ["wet8", "wet20", "moderate", "heavy", "compactedSnow", "wetIce"].every((key) => hasOutput(dataset, key)),
  );

  const landingFactorDataset = datasets.find((dataset) =>
    dataset.calculator?.kind === "distance-factor" && dataset.calculator.operation === "landing",
  ) ?? datasets.find((dataset) =>
    hasAxis(dataset, "surface") && hasOutput(dataset, "factor")
    && dataset.rows.some((row) => typeof row.inputs.surface === "string"),
  );

  const landingSpeedDataset = datasets.find((dataset) =>
    dataset.calculator?.kind === "metric-lookup" && dataset.calculator.operation === "landing",
  ) ?? datasets.find((dataset) =>
    hasAxis(dataset, "weight") && hasOutput(dataset, "vref") && hasOutput(dataset, "vapp"),
  );

  return { takeoffGridDataset, landingGridDataset, takeoffFactorDataset, landingFactorDataset, landingSpeedDataset };
}

function factorContract(dataset: PerformanceDataset | undefined): PerformanceDistanceFactorCalculator | undefined {
  return dataset?.calculator?.kind === "distance-factor" ? dataset.calculator : undefined;
}

function declaredFactorOptions(dataset: PerformanceDataset | undefined): readonly TakeoffSurfaceOption[] | undefined {
  const calculator = factorContract(dataset);
  if (!calculator) return undefined;
  const selector = calculator.selector;
  const baseline: TakeoffSurfaceOption = {
    value: selector.baseline.value,
    label: selector.baseline.label,
    fixedFactor: selector.baseline.fixedFactor,
  };
  if (selector.kind === "output-options") {
    return [
      baseline,
      ...selector.options.map((option) => ({
        value: option.value,
        label: option.label,
        outputKey: option.factorOutputKey,
        fixedFactor: option.fixedFactor,
      })),
    ];
  }
  const values = stringAxisValues(dataset, selector.axisKey);
  return [baseline, ...values.map((value) => ({ value, label: value }))];
}

export function getTakeoffSurfaceOptions(profile: PerformanceCalculatorProfile): readonly TakeoffSurfaceOption[] {
  const declared = declaredFactorOptions(profile.takeoffFactorDataset);
  if (declared) return declared;
  return takeoffSurfaceDefinitions.filter((option) => !option.outputKey || (profile.takeoffFactorDataset && hasOutput(profile.takeoffFactorDataset, option.outputKey)));
}

export function getTakeoffWeights(profile: PerformanceCalculatorProfile): readonly number[] {
  const dataset = profile.takeoffFactorDataset;
  const calculator = factorContract(dataset);
  if (calculator?.selector.lookupAxis) return numericAxisValues(dataset, calculator.selector.lookupAxis);
  return numericAxisValues(dataset, "weight");
}

export function getLandingWeights(profile: PerformanceCalculatorProfile): readonly number[] {
  const dataset = profile.landingSpeedDataset;
  if (dataset?.calculator?.kind === "metric-lookup") return numericAxisValues(dataset, dataset.calculator.axisKey);
  return numericAxisValues(dataset, "weight");
}

export function getLandingSurfaceOptions(profile: PerformanceCalculatorProfile): readonly string[] {
  const declared = declaredFactorOptions(profile.landingFactorDataset);
  if (declared) return declared.map((option) => option.value);
  const sourceValues = profile.landingFactorDataset?.axes.find((axis) => axis.key === "surface")?.values
    .filter((value): value is string => typeof value === "string") ?? [];
  return ["Dry", ...sourceValues.filter((value, index) => sourceValues.indexOf(value) === index)];
}

export function getNativeGridSurfaceOptions(dataset: PerformanceDataset | undefined): readonly string[] {
  return dataset ? stringAxisValues(dataset, gridBindings(dataset).surfaceAxis) : [];
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

function constraintApplies(
  calculator: PerformanceDistanceFactorCalculator,
  constraintIndex: number,
  input: DistanceFactorInput,
  rowInputs: Readonly<Record<string, PerformanceScalar>>,
): boolean {
  const constraint = calculator.constraints?.[constraintIndex];
  if (!constraint?.when) return true;
  const when = constraint.when;
  if (when.selectorValues && !when.selectorValues.includes(input.selection)) return false;
  if (when.axisKey && when.values) {
    const value = rowInputs[when.axisKey];
    if (value === undefined || !when.values.some((candidate) => candidate === value)) return false;
  }
  return true;
}

export function calculateDistanceFactor(
  dataset: PerformanceDataset | undefined,
  input: DistanceFactorInput,
): DistanceCalculation {
  const calculator = factorContract(dataset);
  if (!dataset || !calculator) {
    return { status: "unsupported", reason: "No declarative source-backed distance-factor calculator is published for this operation." };
  }

  const selector = calculator.selector;
  const rowInputs: Record<string, PerformanceScalar> = {};
  let factor: number | undefined;

  if (input.selection === selector.baseline.value) {
    factor = selector.baseline.fixedFactor;
  } else if (selector.kind === "output-options") {
    const option = selector.options.find((candidate) => candidate.value === input.selection);
    if (!option) return { status: "unsupported", reason: "No published correction factor is available for this selection." };
    if (option.fixedFactor !== undefined) {
      factor = option.fixedFactor;
    } else {
      if (!selector.lookupAxis) return { status: "unsupported", reason: "This factor requires a governed lookup-axis binding." };
      if (input.lookupValue === undefined) return { status: "incomplete", reason: "Select an exact source-table lookup value." };
      rowInputs[selector.lookupAxis] = input.lookupValue;
      factor = numericOutput(exactRow(dataset, rowInputs), option.factorOutputKey ?? "");
    }
  } else {
    rowInputs[selector.axisKey] = input.selection;
    if (selector.lookupAxis) {
      if (input.lookupValue === undefined) return { status: "incomplete", reason: "Select an exact source-table lookup value." };
      rowInputs[selector.lookupAxis] = input.lookupValue;
    }
    factor = numericOutput(exactRow(dataset, rowInputs), selector.factorOutput);
  }

  for (let index = 0; index < (calculator.constraints?.length ?? 0); index += 1) {
    if (!constraintApplies(calculator, index, input, rowInputs)) continue;
    const constraint = calculator.constraints?.[index];
    if (!constraint) continue;
    const actual = input.constraintInputs?.[constraint.input.key];
    if (actual === undefined) {
      return { status: "incomplete", reason: constraint.message ?? `Enter ${constraint.input.label} for this selection.` };
    }
    const allowed = constraint.operator === "lte" ? actual <= constraint.value : actual >= constraint.value;
    if (!allowed) {
      return { status: "unsupported", reason: constraint.message ?? `The published source does not authorize this factor for the entered ${constraint.input.label}.` };
    }
  }

  if (factor === undefined) {
    return { status: "unsupported", reason: "No exact stored source-backed factor exists for this selection. FlyTally will not interpolate it." };
  }
  return distanceResult(input.baselineDistance, input.runwayAvailable, factor);
}

export function getMetricLookupResults(
  dataset: PerformanceDataset | undefined,
  lookupValue: PerformanceScalar | undefined,
): readonly MetricLookupResult[] | undefined {
  if (!dataset || lookupValue === undefined || dataset.calculator?.kind !== "metric-lookup") return undefined;
  const calculator = dataset.calculator;
  const row = exactRow(dataset, { [calculator.axisKey]: lookupValue });
  if (!row) return undefined;
  return calculator.outputKeys.flatMap((key) => {
    const output = dataset.outputs.find((candidate) => candidate.key === key);
    const value = row.outputs[key];
    if (!output || value === undefined) return [];
    return [{ key, label: output.label, unit: output.unit, value }];
  });
}

export function calculateMultiAxisMetricGrid(
  dataset: PerformanceDataset | undefined,
  inputs: Readonly<Record<string, PerformanceScalar | undefined>>,
): MultiAxisMetricGridCalculation {
  if (!dataset || dataset.calculator?.kind !== "multi-axis-metric-grid") {
    return { status: "unsupported", reason: "No multi-axis metric grid is available." };
  }
  const calculator = dataset.calculator;
  const missingAxis = calculator.inputAxes.find((key) => inputs[key] === undefined);
  if (missingAxis) {
    const sourceAxis = dataset.axes.find((candidate) => candidate.key === missingAxis);
    return { status: "incomplete", reason: `Enter ${sourceAxis?.label ?? missingAxis}.` };
  }

  const filters = Object.fromEntries(
    calculator.inputAxes.map((key) => [key, performanceScalarKey(inputs[key] as PerformanceScalar)]),
  );
  const selection = getPerformanceSelectionState(dataset, filters);
  if (!selection.resultRow || (selection.status !== "exact" && selection.status !== "interpolated")) {
    return {
      status: "unsupported",
      reason: "The entered values are outside the published source grid or require unavailable source corners. FlyTally will not extrapolate.",
    };
  }

  const metrics = calculator.outputKeys.flatMap((key) => {
    const declaredOutput = dataset.outputs.find((candidate) => candidate.key === key);
    const value = selection.resultRow?.outputs[key];
    if (!declaredOutput || value === undefined) return [];
    return [{ key, label: declaredOutput.label, unit: declaredOutput.unit, value }];
  });
  if (metrics.length !== calculator.outputKeys.length) {
    return { status: "unsupported", reason: "The source grid does not contain every declared output for this result." };
  }

  return {
    status: "ready",
    method: selection.status === "exact" ? "exact-source-row" : "bounded-linear-interpolation",
    metrics,
  };
}

export function calculatePostBaselineTransform(
  dataset: PerformanceDataset | undefined,
  baselineValue: number | undefined,
  modifierValue: number | undefined,
): PostBaselineTransformCalculation {
  if (!dataset || dataset.calculator?.kind !== "post-baseline-transform") {
    return { status: "unsupported", reason: "No declarative post-baseline transform is available." };
  }
  const calculator = dataset.calculator;
  if (baselineValue === undefined) {
    const axis = dataset.axes.find((candidate) => candidate.key === calculator.baselineAxisKey);
    return { status: "incomplete", reason: `Enter ${axis?.label ?? calculator.baselineAxisKey}.` };
  }
  if (modifierValue === undefined) {
    const axis = dataset.axes.find((candidate) => candidate.key === calculator.modifierAxisKey);
    return { status: "incomplete", reason: `Enter ${axis?.label ?? calculator.modifierAxisKey}.` };
  }

  const filters = {
    [calculator.baselineAxisKey]: performanceScalarKey(baselineValue),
    [calculator.modifierAxisKey]: performanceScalarKey(modifierValue),
  };
  const selection = getPerformanceSelectionState(dataset, filters);
  if (!selection.resultRow || (selection.status !== "exact" && selection.status !== "interpolated")) {
    return {
      status: "unsupported",
      reason: "The baseline/modifier pair is outside the published source grid or requires unavailable source corners. FlyTally will not extrapolate.",
    };
  }

  const declaredOutput = dataset.outputs.find((candidate) => candidate.key === calculator.outputKey);
  const value = selection.resultRow.outputs[calculator.outputKey];
  if (!declaredOutput || typeof value !== "number" || !Number.isFinite(value)) {
    return { status: "unsupported", reason: "The source transform does not contain its declared numeric output for this result." };
  }

  return {
    status: "ready",
    method: selection.status === "exact" ? "exact-source-row" : "bounded-linear-interpolation",
    value,
    unit: declaredOutput.unit,
  };
}

type Bracket = { readonly low: number; readonly high: number };

function bracket(values: readonly number[], target: number): Bracket | undefined {
  if (!values.length || target < values[0] || target > values[values.length - 1]) return undefined;
  const exact = values.find((value) => Math.abs(value - target) < 1e-9);
  if (exact !== undefined) return { low: exact, high: exact };
  let low = values[0];
  let high = values[values.length - 1];
  for (let index = 0; index < values.length - 1; index += 1) {
    if (target > values[index] && target < values[index + 1]) {
      low = values[index];
      high = values[index + 1];
      break;
    }
  }
  return { low, high };
}

function interpolate(lowValue: number, highValue: number, lowAxis: number, highAxis: number, target: number): number {
  if (Math.abs(highAxis - lowAxis) < 1e-9) return lowValue;
  const fraction = (target - lowAxis) / (highAxis - lowAxis);
  return lowValue + ((highValue - lowValue) * fraction);
}

function gridRow(dataset: PerformanceDataset, altitude: number, isaDeviation: number, surface: string): PerformanceRow | undefined {
  const bindings = gridBindings(dataset);
  return exactRow(dataset, {
    [bindings.altitudeAxis]: altitude,
    [bindings.isaDeviationAxis]: isaDeviation,
    [bindings.surfaceAxis]: surface,
  });
}

function sourceIsaTemperatureAtAltitude(dataset: PerformanceDataset, altitudeFt: number, surface: string): number | undefined {
  const bindings = gridBindings(dataset);
  const altitudes = numericAxisValues(dataset, bindings.altitudeAxis);
  const altitudeBracket = bracket(altitudes, altitudeFt);
  if (!altitudeBracket) return undefined;

  const baseAt = (altitude: number): number | undefined => {
    const exactIsa = gridRow(dataset, altitude, 0, surface);
    const exactTemperature = numericOutput(exactIsa, bindings.sourceTemperatureOutput);
    if (exactTemperature !== undefined) return exactTemperature;

    const candidate = dataset.rows.find((row) =>
      row.inputs[bindings.altitudeAxis] === altitude
      && row.inputs[bindings.surfaceAxis] === surface
      && typeof row.inputs[bindings.isaDeviationAxis] === "number"
      && typeof row.outputs[bindings.sourceTemperatureOutput] === "number");
    if (!candidate) return undefined;
    const sourceTemperature = candidate.outputs[bindings.sourceTemperatureOutput];
    const sourceDeviation = candidate.inputs[bindings.isaDeviationAxis];
    if (typeof sourceTemperature !== "number" || typeof sourceDeviation !== "number") return undefined;
    return sourceTemperature - sourceDeviation;
  };

  const lowTemperature = baseAt(altitudeBracket.low);
  const highTemperature = baseAt(altitudeBracket.high);
  if (lowTemperature === undefined || highTemperature === undefined) return undefined;
  return interpolate(lowTemperature, highTemperature, altitudeBracket.low, altitudeBracket.high, altitudeFt);
}

function interpolatedGridOutput(
  dataset: PerformanceDataset,
  altitudeFt: number,
  isaDeviationC: number,
  surface: string,
  outputKey: string,
): { readonly value?: number; readonly exact: boolean } {
  const bindings = gridBindings(dataset);
  const altitudeBracket = bracket(numericAxisValues(dataset, bindings.altitudeAxis), altitudeFt);
  const deviationBracket = bracket(numericAxisValues(dataset, bindings.isaDeviationAxis), isaDeviationC);
  if (!altitudeBracket || !deviationBracket) return { exact: false };

  const at = (altitude: number, deviation: number): number | undefined =>
    numericOutput(gridRow(dataset, altitude, deviation, surface), outputKey);

  const q00 = at(altitudeBracket.low, deviationBracket.low);
  const q01 = at(altitudeBracket.low, deviationBracket.high);
  const q10 = at(altitudeBracket.high, deviationBracket.low);
  const q11 = at(altitudeBracket.high, deviationBracket.high);
  if (q00 === undefined || q01 === undefined || q10 === undefined || q11 === undefined) return { exact: false };

  const lowAltitudeValue = interpolate(q00, q01, deviationBracket.low, deviationBracket.high, isaDeviationC);
  const highAltitudeValue = interpolate(q10, q11, deviationBracket.low, deviationBracket.high, isaDeviationC);
  return {
    value: interpolate(lowAltitudeValue, highAltitudeValue, altitudeBracket.low, altitudeBracket.high, altitudeFt),
    exact: altitudeBracket.low === altitudeBracket.high && deviationBracket.low === deviationBracket.high,
  };
}

export function calculateNativeDistanceGrid(
  dataset: PerformanceDataset | undefined,
  input: Readonly<{
    airportAltitudeFt?: number;
    oatC?: number;
    surface?: string;
    runwayAvailableM?: number;
  }>,
): NativeDistanceCalculation {
  if (!dataset) return { status: "unsupported", reason: "No source-backed runway-distance grid is published for this operation." };
  const bindings = gridBindings(dataset);
  const altitudeFt = input.airportAltitudeFt;
  const oatC = input.oatC;
  const surface = input.surface?.trim();
  if (altitudeFt === undefined || !Number.isFinite(altitudeFt) || oatC === undefined || !Number.isFinite(oatC) || !surface) {
    return { status: "incomplete", reason: "Enter airport altitude, OAT and runway surface." };
  }
  if (!getNativeGridSurfaceOptions(dataset).includes(surface)) {
    return { status: "unsupported", reason: "The selected runway surface is not present in the source table." };
  }

  const sourceIsaTemperatureC = sourceIsaTemperatureAtAltitude(dataset, altitudeFt, surface);
  if (sourceIsaTemperatureC === undefined) {
    return { status: "unsupported", reason: "Airport altitude is outside the published source-table envelope." };
  }
  const isaDeviationC = oatC - sourceIsaTemperatureC;
  const deviationBracket = bracket(numericAxisValues(dataset, bindings.isaDeviationAxis), isaDeviationC);
  if (!deviationBracket) {
    return {
      status: "unsupported",
      reason: "OAT places the calculation outside the published ISA-deviation envelope. FlyTally will not extrapolate.",
      sourceIsaTemperatureC,
      isaDeviationC,
    };
  }

  const groundRun = interpolatedGridOutput(dataset, altitudeFt, isaDeviationC, surface, bindings.groundRunOutput);
  const distance50ft = interpolatedGridOutput(dataset, altitudeFt, isaDeviationC, surface, bindings.obstacleDistanceOutput);
  if (groundRun.value === undefined || distance50ft.value === undefined) {
    return { status: "unsupported", reason: "The source grid does not contain all bounding rows required for this calculation.", sourceIsaTemperatureC, isaDeviationC };
  }
  if ((!groundRun.exact || !distance50ft.exact) && dataset.interpolation !== "linear-explicit") {
    return { status: "unsupported", reason: "This input falls between source rows and this dataset does not permit software interpolation.", sourceIsaTemperatureC, isaDeviationC };
  }

  const runwayAvailableM = input.runwayAvailableM !== undefined && Number.isFinite(input.runwayAvailableM) && input.runwayAvailableM > 0
    ? input.runwayAvailableM
    : undefined;
  const groundRunMarginM = runwayAvailableM === undefined ? undefined : runwayAvailableM - groundRun.value;
  const distance50ftMarginM = runwayAvailableM === undefined ? undefined : runwayAvailableM - distance50ft.value;
  return {
    status: "ready",
    method: groundRun.exact && distance50ft.exact ? "exact-source-row" : "bounded-linear-interpolation",
    sourceIsaTemperatureC,
    isaDeviationC,
    groundRunM: groundRun.value,
    distance50ftM: distance50ft.value,
    groundRunMarginM,
    distance50ftMarginM,
    groundRunUsePercent: runwayAvailableM === undefined ? undefined : (groundRun.value / runwayAvailableM) * 100,
    distance50ftUsePercent: runwayAvailableM === undefined ? undefined : (distance50ft.value / runwayAvailableM) * 100,
    withinRunway: runwayAvailableM === undefined ? undefined : distance50ft.value <= runwayAvailableM,
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
  if (factorContract(profile.takeoffFactorDataset)) {
    return calculateDistanceFactor(profile.takeoffFactorDataset, {
      baselineDistance: input.dryDistance,
      runwayAvailable: input.runwayAvailable,
      selection: input.surface,
      lookupValue: input.weight,
    });
  }

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
  if (profile.landingSpeedDataset.calculator?.kind === "metric-lookup") {
    const metrics = getMetricLookupResults(profile.landingSpeedDataset, weight);
    if (!metrics) return undefined;
    // Compatibility projection for the pre-v3.1 landing UI. New generic UI
    // consumes getMetricLookupResults directly and does not require these keys.
    const byKey = new Map(metrics.map((metric) => [metric.key, metric.value] as const));
    const vref = byKey.get("vref");
    const vapp = byKey.get("vapp");
    return {
      vref: typeof vref === "number" ? vref : undefined,
      vapp: typeof vapp === "number" ? vapp : undefined,
    };
  }
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
  const declared = factorContract(profile.landingFactorDataset);
  if (declared) {
    const constraintInputs = input.oatC === undefined
      ? undefined
      : Object.fromEntries((declared.constraints ?? []).map((constraint) => [constraint.input.key, input.oatC]));
    return calculateDistanceFactor(profile.landingFactorDataset, {
      baselineDistance: input.dryDistance,
      runwayAvailable: input.runwayAvailable,
      selection: input.surface,
      constraintInputs,
    });
  }

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

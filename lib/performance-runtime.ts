import type { PerformanceAxis, PerformanceDataset, PerformanceRow, PerformanceScalar } from "./universal-aircraft-content.ts";

export type PerformanceFilters = Readonly<Record<string, string>>;

export type PerformanceSelectionState = {
  readonly selectedAxisCount: number;
  readonly totalAxisCount: number;
  readonly missingAxisKeys: readonly string[];
  readonly matchingRows: readonly PerformanceRow[];
  readonly supportingRows: readonly PerformanceRow[];
  readonly exactRow?: PerformanceRow;
  readonly interpolatedRow?: PerformanceRow;
  readonly resultRow?: PerformanceRow;
  readonly resultKind?: "stored" | "interpolated";
  readonly status: "empty" | "partial" | "exact" | "interpolated" | "no-match" | "ambiguous";
};

export function performanceScalarKey(value: PerformanceScalar): string {
  return `${typeof value}:${String(value)}`;
}

export function performanceScalarFromKey(value: string | undefined): PerformanceScalar | undefined {
  if (!value) return undefined;
  const separator = value.indexOf(":");
  if (separator < 0) return undefined;
  const type = value.slice(0, separator);
  const raw = value.slice(separator + 1);

  if (type === "string") return raw;
  if (type === "boolean") return raw === "true" ? true : raw === "false" ? false : undefined;
  if (type === "number") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function scalarEquals(left: PerformanceScalar | undefined, right: PerformanceScalar | undefined): boolean {
  return typeof left === typeof right && left === right;
}

export function isLinearPerformanceAxis(dataset: PerformanceDataset, axis: PerformanceAxis): boolean {
  return dataset.interpolation === "linear-explicit"
    && axis.values.length >= 2
    && axis.values.every((value) => typeof value === "number" && Number.isFinite(value));
}

export function filterPerformanceRows(dataset: PerformanceDataset, filters: PerformanceFilters): readonly PerformanceRow[] {
  return dataset.rows.filter((row) => dataset.axes.every((axis) => {
    const filter = filters[axis.key];
    return !filter || performanceScalarKey(row.inputs[axis.key]) === filter;
  }));
}

export function getExactPerformanceRow(dataset: PerformanceDataset, filters: PerformanceFilters): PerformanceRow | undefined {
  if (!dataset.axes.every((axis) => Boolean(filters[axis.key]))) return undefined;
  const rows = filterPerformanceRows(dataset, filters);
  return rows.length === 1 ? rows[0] : undefined;
}

type AxisBracket = {
  readonly axis: PerformanceAxis;
  readonly selected: PerformanceScalar;
  readonly lower: PerformanceScalar;
  readonly upper: PerformanceScalar;
  readonly ratio: number;
};

type WeightedCorner = {
  readonly inputs: Readonly<Record<string, PerformanceScalar>>;
  readonly weight: number;
};

function getAxisBracket(dataset: PerformanceDataset, axis: PerformanceAxis, selected: PerformanceScalar): AxisBracket | undefined {
  if (!isLinearPerformanceAxis(dataset, axis)) {
    return axis.values.some((value) => scalarEquals(value, selected))
      ? { axis, selected, lower: selected, upper: selected, ratio: 0 }
      : undefined;
  }

  if (typeof selected !== "number" || !Number.isFinite(selected)) return undefined;
  const values = [...new Set(axis.values as readonly number[])].sort((left, right) => left - right);
  if (!values.length || selected < values[0] || selected > values[values.length - 1]) return undefined;

  const lower = [...values].reverse().find((value) => value <= selected);
  const upper = values.find((value) => value >= selected);
  if (lower === undefined || upper === undefined) return undefined;
  const ratio = lower === upper ? 0 : (selected - lower) / (upper - lower);
  return { axis, selected, lower, upper, ratio };
}

function buildWeightedCorners(brackets: readonly AxisBracket[]): readonly WeightedCorner[] {
  let corners: readonly WeightedCorner[] = [{ inputs: {}, weight: 1 }];
  for (const bracket of brackets) {
    const candidates = scalarEquals(bracket.lower, bracket.upper)
      ? [{ value: bracket.lower, weight: 1 }]
      : [
          { value: bracket.lower, weight: 1 - bracket.ratio },
          { value: bracket.upper, weight: bracket.ratio },
        ];

    corners = corners.flatMap((corner) => candidates.map((candidate) => ({
      inputs: { ...corner.inputs, [bracket.axis.key]: candidate.value },
      weight: corner.weight * candidate.weight,
    })));
  }
  return corners;
}

function rowMatchesInputs(dataset: PerformanceDataset, row: PerformanceRow, inputs: Readonly<Record<string, PerformanceScalar>>): boolean {
  return dataset.axes.every((axis) => scalarEquals(row.inputs[axis.key], inputs[axis.key]));
}

function cleanInterpolatedNumber(value: number): number {
  return Number(value.toFixed(10));
}

function interpolatePerformanceRow(
  dataset: PerformanceDataset,
  filters: PerformanceFilters,
): { readonly row: PerformanceRow; readonly supportingRows: readonly PerformanceRow[] } | undefined {
  if (dataset.interpolation !== "linear-explicit") return undefined;

  const selectedInputs: Record<string, PerformanceScalar> = {};
  const brackets: AxisBracket[] = [];
  for (const axis of dataset.axes) {
    const selected = performanceScalarFromKey(filters[axis.key]);
    if (selected === undefined) return undefined;
    const bracket = getAxisBracket(dataset, axis, selected);
    if (!bracket) return undefined;
    selectedInputs[axis.key] = selected;
    brackets.push(bracket);
  }

  if (!brackets.some((bracket) => isLinearPerformanceAxis(dataset, bracket.axis) && !scalarEquals(bracket.lower, bracket.upper))) {
    return undefined;
  }

  const corners = buildWeightedCorners(brackets).filter((corner) => corner.weight > 0);
  const supportingRows: PerformanceRow[] = [];
  const weightedRows: { readonly row: PerformanceRow; readonly weight: number }[] = [];

  for (const corner of corners) {
    const matches = dataset.rows.filter((row) => rowMatchesInputs(dataset, row, corner.inputs));
    if (matches.length !== 1) return undefined;
    const row = matches[0];
    if (!supportingRows.includes(row)) supportingRows.push(row);
    weightedRows.push({ row, weight: corner.weight });
  }

  const outputs: Record<string, PerformanceScalar> = {};
  for (const output of dataset.outputs) {
    const values = weightedRows.map(({ row }) => row.outputs[output.key]);
    if (values.every((value) => typeof value === "number" && Number.isFinite(value))) {
      outputs[output.key] = cleanInterpolatedNumber(weightedRows.reduce((sum, item) => sum + (item.row.outputs[output.key] as number) * item.weight, 0));
      continue;
    }
    const first = values[0];
    if (first === undefined || !values.every((value) => scalarEquals(value, first))) return undefined;
    outputs[output.key] = first;
  }

  return { row: { inputs: selectedInputs, outputs }, supportingRows };
}

export function getPerformanceSelectionState(
  dataset: PerformanceDataset,
  filters: PerformanceFilters,
): PerformanceSelectionState {
  const missingAxisKeys = dataset.axes.filter((axis) => !filters[axis.key]).map((axis) => axis.key);
  const selectedAxisCount = dataset.axes.length - missingAxisKeys.length;
  const matchingRows = filterPerformanceRows(dataset, filters);
  const exactRow = missingAxisKeys.length === 0 && matchingRows.length === 1 ? matchingRows[0] : undefined;
  const interpolation = missingAxisKeys.length === 0 && !exactRow && matchingRows.length === 0
    ? interpolatePerformanceRow(dataset, filters)
    : undefined;
  const interpolatedRow = interpolation?.row;
  const resultRow = exactRow ?? interpolatedRow;
  const resultKind = exactRow ? "stored" as const : interpolatedRow ? "interpolated" as const : undefined;
  const supportingRows = interpolation?.supportingRows ?? [];
  const status = selectedAxisCount === 0
    ? "empty"
    : missingAxisKeys.length > 0
      ? "partial"
      : matchingRows.length > 1
        ? "ambiguous"
        : exactRow
          ? "exact"
          : interpolatedRow
            ? "interpolated"
            : "no-match";

  return {
    selectedAxisCount,
    totalAxisCount: dataset.axes.length,
    missingAxisKeys,
    matchingRows,
    supportingRows,
    exactRow,
    interpolatedRow,
    resultRow,
    resultKind,
    status,
  };
}

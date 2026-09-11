import type { PerformanceDataset, PerformanceRow, PerformanceScalar } from "./universal-aircraft-content.ts";

export type PerformanceFilters = Readonly<Record<string, string>>;

export type PerformanceSelectionState = {
  readonly selectedAxisCount: number;
  readonly totalAxisCount: number;
  readonly missingAxisKeys: readonly string[];
  readonly matchingRows: readonly PerformanceRow[];
  readonly exactRow?: PerformanceRow;
  readonly status: "empty" | "partial" | "exact" | "no-match" | "ambiguous";
};

export function performanceScalarKey(value: PerformanceScalar): string {
  return `${typeof value}:${String(value)}`;
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

export function getPerformanceSelectionState(
  dataset: PerformanceDataset,
  filters: PerformanceFilters,
): PerformanceSelectionState {
  const missingAxisKeys = dataset.axes.filter((axis) => !filters[axis.key]).map((axis) => axis.key);
  const selectedAxisCount = dataset.axes.length - missingAxisKeys.length;
  const matchingRows = filterPerformanceRows(dataset, filters);
  const exactRow = missingAxisKeys.length === 0 && matchingRows.length === 1 ? matchingRows[0] : undefined;
  const status = selectedAxisCount === 0
    ? "empty"
    : missingAxisKeys.length > 0
      ? "partial"
      : matchingRows.length === 0
        ? "no-match"
        : matchingRows.length === 1
          ? "exact"
          : "ambiguous";

  return {
    selectedAxisCount,
    totalAxisCount: dataset.axes.length,
    missingAxisKeys,
    matchingRows,
    exactRow,
    status,
  };
}

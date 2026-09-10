import type { PerformanceDataset, PerformanceRow, PerformanceScalar } from "./universal-aircraft-content.ts";

export type PerformanceFilters = Readonly<Record<string, string>>;

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

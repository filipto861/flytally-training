import { calculateNativeDistanceGrid, type NativeDistanceCalculation } from "./performance-calculator.ts";
import type { PerformanceDataset } from "./universal-aircraft-content.ts";

export type OperationalNativeDistanceInput = Readonly<{
  airportAltitudeFt?: number;
  oatC?: number;
  surface?: string;
  runwayAvailableM?: number;
}>;

/**
 * Fly honors the governed source dataset interpolation authority exactly.
 * Runtime code must never opt a dataset into interpolation simply because
 * bounding source rows happen to exist.
 *
 * Exact source rows remain usable when interpolation is "none". Inputs between
 * rows are rejected unless the governed dataset explicitly declares
 * "linear-explicit". The underlying calculator also refuses extrapolation
 * outside the published altitude / ISA envelope and requires every bounding row.
 */
export function calculateOperationalNativeDistanceGrid(
  dataset: PerformanceDataset | undefined,
  input: OperationalNativeDistanceInput,
): NativeDistanceCalculation {
  return calculateNativeDistanceGrid(dataset, input);
}

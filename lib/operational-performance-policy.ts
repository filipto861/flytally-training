import { calculateNativeDistanceGrid, type NativeDistanceCalculation } from "./performance-calculator.ts";
import type { PerformanceDataset } from "./universal-aircraft-content.ts";

export type OperationalNativeDistanceInput = Readonly<{
  airportAltitudeFt?: number;
  oatC?: number;
  surface?: string;
  runwayAvailableM?: number;
}>;

/**
 * Fly uses bounded software interpolation between published runway-distance
 * table points even when the source manual does not prescribe an interpolation
 * method. The source dataset is never mutated: the operational policy is a
 * runtime calculation choice and remains visibly labelled as interpolation.
 *
 * The underlying calculator still requires every bounding source row and still
 * refuses extrapolation outside the published altitude / ISA envelope.
 */
export function calculateOperationalNativeDistanceGrid(
  dataset: PerformanceDataset | undefined,
  input: OperationalNativeDistanceInput,
): NativeDistanceCalculation {
  if (!dataset) return calculateNativeDistanceGrid(dataset, input);
  return calculateNativeDistanceGrid({ ...dataset, interpolation: "linear-explicit" }, input);
}

import type { PilotLandingCalculatorDefinition } from "./pilot-landing-calculator.ts";
import type { PilotTakeoffCalculatorDefinition } from "./pilot-takeoff-calculator.ts";
import type { AircraftPerformanceContent, PerformanceDataset } from "./universal-aircraft-content.ts";

export type BundledPerformancePackage = {
  readonly aircraftId: string;
  readonly content: AircraftPerformanceContent;
  readonly takeoffCalculator?: PilotTakeoffCalculatorDefinition;
  readonly landingCalculator?: PilotLandingCalculatorDefinition;
};

export function mergePerformanceDatasets(
  published: readonly PerformanceDataset[],
  bundled: readonly PerformanceDataset[],
): readonly PerformanceDataset[] {
  const byId = new Map<string, PerformanceDataset>();
  for (const dataset of bundled) byId.set(dataset.id, dataset);
  for (const dataset of published) byId.set(dataset.id, dataset);
  return [...byId.values()];
}

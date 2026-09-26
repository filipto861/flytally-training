import { learjet35aReferencePerformancePackage } from "../aircraft-data/learjet-35a/reference-performance/package.ts";

import {
  browserTrainingAircraftId,
  browserTrainingFixtureEnabled,
  browserTrainingReferencePerformancePackage,
} from "./browser-training-fixture.ts";
import type { BundledReferencePerformancePackage } from "./reference-performance-package.ts";

const packages: readonly BundledReferencePerformancePackage[] = [
  learjet35aReferencePerformancePackage,
];

const byAircraftId = new Map(
  packages.map((item) => [item.aircraftId, item] as const),
);

export function getBundledReferencePerformancePackage(
  aircraftId: string,
): BundledReferencePerformancePackage | undefined {
  if (aircraftId === browserTrainingAircraftId && browserTrainingFixtureEnabled()) {
    return browserTrainingReferencePerformancePackage;
  }
  return byAircraftId.get(aircraftId);
}

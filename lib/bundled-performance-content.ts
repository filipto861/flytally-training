import { learjet35aPerformancePackage } from "../aircraft-data/learjet-35a/performance/package.ts";

import type { BundledPerformancePackage } from "./performance-package.ts";

const packages: readonly BundledPerformancePackage[] = [
  learjet35aPerformancePackage,
];

const byAircraftId = new Map(packages.map((item) => [item.aircraftId, item] as const));

export function getBundledPerformancePackage(
  aircraftId: string,
): BundledPerformancePackage | undefined {
  return byAircraftId.get(aircraftId);
}

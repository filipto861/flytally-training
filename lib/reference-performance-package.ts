import type { AircraftPerformanceContent } from "./universal-aircraft-content.ts";

/**
 * Reference-performance data deliberately reuses the generic performance
 * dataset contract/interpolation engine, but is registered through a separate
 * package boundary so it cannot appear in Takeoff/Landing Performance by
 * accident.
 */
export type BundledReferencePerformancePackage = {
  readonly aircraftId: string;
  readonly content: AircraftPerformanceContent;
};

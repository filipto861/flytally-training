import type { PilotLandingCalculatorDefinition } from "./pilot-landing-calculator.ts";
import type { PilotTakeoffCalculatorDefinition } from "./pilot-takeoff-calculator.ts";
import type { AircraftPerformanceContent, PerformanceDataset } from "./universal-aircraft-content.ts";

export type PerformanceConfigurationOption = {
  readonly value: string;
  readonly label: string;
};

export type PerformanceBooleanConfigurationOption = {
  readonly value: boolean;
  readonly label: string;
};

export type PerformanceOperationConfiguration = {
  readonly flaps?: {
    readonly label: string;
    readonly options: readonly PerformanceConfigurationOption[];
  };
  readonly antiIce?: {
    readonly label: string;
    readonly options: readonly PerformanceBooleanConfigurationOption[];
  };
};

export type PerformanceConfigurationContract = {
  readonly takeoff?: PerformanceOperationConfiguration;
  readonly landing?: PerformanceOperationConfiguration;
};

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


export function getPerformanceConfigurationContract(
  performancePackage: BundledPerformancePackage,
): PerformanceConfigurationContract {
  const takeoff = performancePackage.takeoffCalculator;
  const landing = performancePackage.landingCalculator;

  return {
    ...(takeoff
      ? {
          takeoff: {
            flaps: {
              label: takeoff.inputs.flaps.label,
              options: takeoff.flapOptions.map(({ value, label }) => ({ value, label })),
            },
            antiIce: {
              label: takeoff.inputs.antiIce.label,
              options: [
                { value: false, label: "OFF" },
                { value: true, label: "ON" },
              ],
            },
          },
        }
      : {}),
    ...(landing
      ? {
          landing: {
            flaps: {
              label: "Flaps",
              options: landing.flapOptions.map(({ value, label }) => ({ value, label })),
            },
          },
        }
      : {}),
  };
}

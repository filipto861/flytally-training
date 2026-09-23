import type { PilotLandingCalculatorDefinition } from "../../../lib/pilot-landing-calculator.ts";

export const learjet35aLandingCalculatorDefinition: PilotLandingCalculatorDefinition = {
  flapOptions: [
    { value: "40", label: "40°" },
  ],
  vrefDatasetId: "learjet-35a-vref",
  landingClimbDatasetId: "learjet-35a-landing-climb-speed",
  approachClimbDatasetId: "learjet-35a-approach-climb-speed",
  landingDistanceDatasetId: "learjet-35a-landing-distance-flaps40",
};

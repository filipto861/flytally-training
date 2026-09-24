import approachClimbSpeedJson from "./approach-climb-speed.json";
import landingClimbSpeedJson from "./landing-climb-speed.json";
import landingDistanceFlaps40Json from "./landing-distance-flaps40.json";
import takeoffN1Json from "./takeoff-n1.json";
import takeoffN1AeroncaJson from "./takeoff-n1-aeronca.json";
import takeoffWeightLimitFlaps8Json from "./takeoff-weight-limit-flaps8.json";
import takeoffWeightLimitFlaps20Json from "./takeoff-weight-limit-flaps20.json";
import takeoffDistanceFlaps20Json from "./takeoff-distance-flaps20.json";
import takeoffDistanceFlaps8Json from "./takeoff-distance-flaps8.json";
import takeoffDistanceWindFlaps8Json from "./takeoff-distance-wind-flaps8.json";
import v1Flaps20Json from "./v1-flaps20.json";
import v1Flaps8Json from "./v1-flaps8.json";
import v1WindFlaps8Json from "./v1-wind-flaps8.json";
import v2Flaps20Json from "./v2-flaps20.json";
import v2Flaps8Json from "./v2-flaps8.json";
import vrFlaps20Json from "./vr-flaps20.json";
import vrFlaps8Json from "./vr-flaps8.json";
import vrefJson from "./vref.json";
import { learjet35aLandingCalculatorDefinition } from "./landing-calculator-definition.ts";
import { learjet35aTakeoffCalculatorDefinition } from "./takeoff-calculator-definition.ts";

import type { BundledPerformancePackage } from "../../../lib/performance-package.ts";
import type { PerformanceDataset } from "../../../lib/universal-aircraft-content.ts";

const approachClimbSpeed = approachClimbSpeedJson as unknown as PerformanceDataset;
const landingClimbSpeed = landingClimbSpeedJson as unknown as PerformanceDataset;
const landingDistanceFlaps40 = landingDistanceFlaps40Json as unknown as PerformanceDataset;
const takeoffN1 = takeoffN1Json as unknown as PerformanceDataset;
const takeoffN1Aeronca = takeoffN1AeroncaJson as unknown as PerformanceDataset;
const takeoffWeightLimitFlaps8 = takeoffWeightLimitFlaps8Json as unknown as PerformanceDataset;
const takeoffWeightLimitFlaps20 = takeoffWeightLimitFlaps20Json as unknown as PerformanceDataset;
const takeoffDistanceFlaps8 = takeoffDistanceFlaps8Json as unknown as PerformanceDataset;
const takeoffDistanceWindFlaps8 = takeoffDistanceWindFlaps8Json as unknown as PerformanceDataset;
const takeoffDistanceFlaps20 = takeoffDistanceFlaps20Json as unknown as PerformanceDataset;
const v1Flaps8 = v1Flaps8Json as unknown as PerformanceDataset;
const v1WindFlaps8 = v1WindFlaps8Json as unknown as PerformanceDataset;
const v1Flaps20 = v1Flaps20Json as unknown as PerformanceDataset;
const vrFlaps8 = vrFlaps8Json as unknown as PerformanceDataset;
const vrFlaps20 = vrFlaps20Json as unknown as PerformanceDataset;
const v2Flaps8 = v2Flaps8Json as unknown as PerformanceDataset;
const v2Flaps20 = v2Flaps20Json as unknown as PerformanceDataset;
const vref = vrefJson as unknown as PerformanceDataset;

export const learjet35aPerformancePackage: BundledPerformancePackage = {
  aircraftId: "learjet-35a",
  content: {
    aircraftId: "learjet-35a",
    title: "Learjet 35A Performance",
    sourcePolicy: "available-sources",
    sourceNote: "Source-backed performance package assembled from the available AFM, Bombardier checklist/QRH and FlightSafety training material.",
    disclaimer: "Sources: available training material. Not FAA-approved.",
    datasets: [
      approachClimbSpeed,
      landingClimbSpeed,
      landingDistanceFlaps40,
      takeoffN1,
      takeoffN1Aeronca,
      takeoffWeightLimitFlaps8,
      takeoffWeightLimitFlaps20,
      takeoffDistanceFlaps8,
      takeoffDistanceWindFlaps8,
      takeoffDistanceFlaps20,
      v1Flaps8,
      v1WindFlaps8,
      v1Flaps20,
      vrFlaps8,
      vrFlaps20,
      v2Flaps8,
      v2Flaps20,
      vref,
    ],
  },
  takeoffCalculator: learjet35aTakeoffCalculatorDefinition,
  landingCalculator: learjet35aLandingCalculatorDefinition,
};

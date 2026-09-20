import takeoffN1Json from "./takeoff-n1.json";
import v2Flaps20Json from "./v2-flaps20.json";
import v2Flaps8Json from "./v2-flaps8.json";
import vrFlaps20Json from "./vr-flaps20.json";
import vrFlaps8Json from "./vr-flaps8.json";
import vrefJson from "./vref.json";
import { learjet35aTakeoffCalculatorDefinition } from "./takeoff-calculator-definition.ts";

import type { BundledPerformancePackage } from "../../../lib/performance-package.ts";
import type { PerformanceDataset } from "../../../lib/universal-aircraft-content.ts";

const takeoffN1 = takeoffN1Json as unknown as PerformanceDataset;
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
      takeoffN1,
      vrFlaps8,
      vrFlaps20,
      v2Flaps8,
      v2Flaps20,
      vref,
    ],
  },
  takeoffCalculator: learjet35aTakeoffCalculatorDefinition,
};

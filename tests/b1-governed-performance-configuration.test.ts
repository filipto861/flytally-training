import assert from "node:assert/strict";
import test from "node:test";

import { learjet35aLandingCalculatorDefinition } from "../aircraft-data/learjet-35a/performance/landing-calculator-definition.ts";
import { learjet35aTakeoffCalculatorDefinition } from "../aircraft-data/learjet-35a/performance/takeoff-calculator-definition.ts";
import {
  getPerformanceConfigurationContract,
  type BundledPerformancePackage,
} from "../lib/performance-package.ts";

const packageContract = {
  aircraftId: "learjet-35a",
  content: {} as BundledPerformancePackage["content"],
  takeoffCalculator: learjet35aTakeoffCalculatorDefinition,
  landingCalculator: learjet35aLandingCalculatorDefinition,
} satisfies BundledPerformancePackage;

test("B1 derives governed Takeoff and Landing configuration from calculator metadata", () => {
  const contract = getPerformanceConfigurationContract(packageContract);

  assert.deepEqual(
    contract.takeoff?.flaps?.options,
    [
      { value: "8", label: "8°" },
      { value: "20", label: "20°" },
    ],
  );
  assert.deepEqual(
    contract.takeoff?.antiIce?.options,
    [
      { value: false, label: "OFF" },
      { value: true, label: "ON" },
    ],
  );
  assert.deepEqual(
    contract.landing?.flaps?.options,
    [{ value: "40", label: "40°" }],
  );
  assert.equal(contract.landing?.antiIce, undefined);
});

test("B1 keeps the landing flap configuration source-backed in the landing definition", () => {
  assert.deepEqual(
    learjet35aLandingCalculatorDefinition.flapOptions,
    [{ value: "40", label: "40°" }],
  );
});

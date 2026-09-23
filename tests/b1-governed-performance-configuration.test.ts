import assert from "node:assert/strict";
import test from "node:test";

import { learjet35aPerformancePackage } from "../aircraft-data/learjet-35a/performance/package.ts";
import { getPerformanceConfigurationContract } from "../lib/performance-package.ts";

test("B1 derives governed Takeoff and Landing configuration from the performance package", () => {
  const contract = getPerformanceConfigurationContract(learjet35aPerformancePackage);

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
    learjet35aPerformancePackage.landingCalculator?.flapOptions,
    [{ value: "40", label: "40°" }],
  );
});

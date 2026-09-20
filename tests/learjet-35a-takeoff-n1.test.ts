import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { validateContentPayload } from "../lib/content-contracts.ts";
import { calculateMultiAxisMetricGrid } from "../lib/performance-calculator.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const dataset = JSON.parse(
  fs.readFileSync(new URL("../aircraft-data/learjet-35a/performance/takeoff-n1.json", import.meta.url), "utf8"),
) as PerformanceDataset;

const calculate = (oatC: number, pressureAltitudeFt: number) =>
  calculateMultiAxisMetricGrid(dataset, { oatC, pressureAltitudeFt });

const n1 = (oatC: number, pressureAltitudeFt: number): number => {
  const calculation = calculate(oatC, pressureAltitudeFt);
  assert.equal(calculation.status, "ready");
  const value = calculation.metrics?.find((metric) => metric.key === "n1Percent")?.value;
  assert.equal(typeof value, "number");
  return value as number;
};

test("Learjet takeoff N1 dataset satisfies the governed multi-axis metric-grid contract", () => {
  const errors = validateContentPayload(
    "performance",
    { aircraftId: "learjet-35a", title: "Learjet 35A Performance", datasets: [dataset] },
    "learjet-35a",
  );
  assert.deepEqual(errors, []);
});

test("multi-axis metric-grid validator rejects an incomplete axis binding", () => {
  const broken: PerformanceDataset = {
    ...dataset,
    calculator: {
      kind: "multi-axis-metric-grid",
      operation: "takeoff",
      inputAxes: ["oatC"],
      outputKeys: ["n1Percent"],
    },
  };
  const errors = validateContentPayload(
    "performance",
    { aircraftId: "learjet-35a", title: "Learjet 35A Performance", datasets: [broken] },
    "learjet-35a",
  );
  assert.ok(errors.some((error) => /multi-axis metric grid must bind every dataset axis/.test(error)));
});

test("Learjet takeoff N1 returns an exact published grid node", () => {
  const calculation = calculate(16, 1000);
  assert.equal(calculation.status, "ready");
  assert.equal(calculation.method, "exact-source-row");
  assert.equal(n1(16, 1000), 97.0);
});

test("Learjet takeoff N1 performs bounded bilinear interpolation", () => {
  const calculation = calculate(17, 1500);
  assert.equal(calculation.status, "ready");
  assert.equal(calculation.method, "bounded-linear-interpolation");
  assert.equal(n1(17, 1500), 97.5);
});

test("Learjet takeoff N1 reproduces the AFM worked example within chart-reading precision", () => {
  // FlightSafety worked example for AFM Figure 5-14:
  // OAT 60°F (published table equivalent 16°C), PA 1,300 ft -> 97.3% N1.
  const value = n1(16, 1300);
  assert.ok(Math.abs(value - 97.3) <= 0.1, `expected ~97.3% N1, received ${value}%`);
});

test("Learjet takeoff N1 fails closed instead of extrapolating", () => {
  const hot = calculate(53, 0);
  assert.equal(hot.status, "unsupported");
  assert.match(hot.reason ?? "", /will not extrapolate/i);
  assert.equal(hot.metrics, undefined);

  const aboveEncodedAltitude = calculate(16, 11000);
  assert.equal(aboveEncodedAltitude.status, "unsupported");
  assert.match(aboveEncodedAltitude.reason ?? "", /will not extrapolate/i);
  assert.equal(aboveEncodedAltitude.metrics, undefined);
});

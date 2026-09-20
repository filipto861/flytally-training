import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { validateContentPayload } from "../lib/content-contracts.ts";
import { calculateMultiAxisMetricGrid } from "../lib/performance-calculator.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const dataset = JSON.parse(
  fs.readFileSync(new URL("../aircraft-data/learjet-35a/performance/vref.json", import.meta.url), "utf8"),
) as PerformanceDataset;

const resultAt = (grossWeight: number) => {
  const calculation = calculateMultiAxisMetricGrid(dataset, { grossWeight });
  const raw = calculation.metrics?.find((metric) => metric.key === "vref")?.value;
  return {
    ...calculation,
    vref: typeof raw === "number" ? raw : undefined,
  };
};

test("B5 VREF dataset satisfies the governed multi-axis metric-grid contract", () => {
  const errors = validateContentPayload(
    "performance",
    { aircraftId: "learjet-35a", title: "Learjet 35A Performance", datasets: [dataset] },
    "learjet-35a",
  );

  assert.deepEqual(errors, []);
  assert.equal(dataset.phase, "landing");
  assert.equal(dataset.calculator?.kind, "multi-axis-metric-grid");

  if (dataset.calculator?.kind === "multi-axis-metric-grid") {
    assert.equal(dataset.calculator.operation, "landing");
    assert.deepEqual(dataset.calculator.inputAxes, ["grossWeight"]);
    assert.deepEqual(dataset.calculator.outputKeys, ["vref"]);
  }
});

test("B5 VREF returns exact Bombardier checklist source rows", () => {
  const fourteen = resultAt(14000);
  assert.equal(fourteen.status, "ready");
  assert.equal(fourteen.method, "exact-source-row");
  assert.equal(fourteen.vref, 123);

  const maximumLandingWeight = resultAt(15300);
  assert.equal(maximumLandingWeight.status, "ready");
  assert.equal(maximumLandingWeight.method, "exact-source-row");
  assert.equal(maximumLandingWeight.vref, 129);
});

test("B5 VREF performs bounded linear interpolation between published gross weights", () => {
  const calculation = resultAt(12500);

  assert.equal(calculation.status, "ready");
  assert.equal(calculation.method, "bounded-linear-interpolation");
  assert.equal(calculation.vref, 117);
});

test("B5 VREF reproduces the FlightSafety AFM worked example at 12,466 lb", () => {
  const calculation = resultAt(12466);

  assert.equal(calculation.status, "ready");
  assert.equal(calculation.method, "bounded-linear-interpolation");
  assert.ok(calculation.vref !== undefined);
  assert.ok(Math.abs(calculation.vref - 116.864) < 1e-9);
  assert.equal(Math.round(calculation.vref), 117);
});

test("B5 VREF fails closed outside the standard landing-weight source envelope", () => {
  for (const grossWeight of [9999, 15301]) {
    const calculation = resultAt(grossWeight);

    assert.equal(calculation.status, "unsupported", String(grossWeight));
    assert.equal(calculation.vref, undefined, String(grossWeight));
    assert.match(calculation.reason ?? "", /will not extrapolate/i, String(grossWeight));
  }
});

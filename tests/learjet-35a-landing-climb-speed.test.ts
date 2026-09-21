import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { validateContentPayload } from "../lib/content-contracts.ts";
import { calculateMultiAxisMetricGrid } from "../lib/performance-calculator.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const dataset = JSON.parse(
  fs.readFileSync(new URL("../aircraft-data/learjet-35a/performance/landing-climb-speed.json", import.meta.url), "utf8"),
) as PerformanceDataset;

function speedAt(grossWeight: number): number | undefined {
  const result = calculateMultiAxisMetricGrid(dataset, { grossWeight });
  const value = result.metrics?.find((metric) => metric.key === "landingClimbSpeed")?.value;
  return typeof value === "number" ? value : undefined;
}

test("B10 landing-climb dataset satisfies the governed metric-grid contract", () => {
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
    assert.deepEqual(dataset.calculator.outputKeys, ["landingClimbSpeed"]);
  }
  assert.equal(dataset.interpolation, "linear-explicit");
});

test("B10 landing-climb dataset preserves the published weight axis and provenance", () => {
  assert.deepEqual(dataset.axes[0]?.values, [10000, 11000, 12000, 13000, 14000, 15000, 15300]);
  assert.equal(dataset.rows.length, 7);
  assert.ok(dataset.sources?.some((source) => source.manualId === "CL-102B" && source.pageLabel === "P-56"));
  assert.ok(dataset.sources?.some((source) => source.pageLabel === "P-57"));
  assert.ok(dataset.sources?.some((source) => source.pageLabel === "P-58"));
});

test("B10 landing-climb returns the exact 10,000 lb source row", () => {
  assert.equal(speedAt(10000), 105);
});

test("B10 landing-climb returns the exact 15,300 lb source row", () => {
  assert.equal(speedAt(15300), 129);
});

test("B10 landing-climb performs bounded interpolation between published weights", () => {
  const result = calculateMultiAxisMetricGrid(dataset, { grossWeight: 10500 });
  assert.equal(result.status, "ready");
  assert.equal(result.method, "bounded-linear-interpolation");
  assert.equal(speedAt(10500), 107.5);
});

test("B10 landing-climb fails closed outside the published weight envelope", () => {
  for (const grossWeight of [9999, 15301]) {
    const result = calculateMultiAxisMetricGrid(dataset, { grossWeight });
    assert.equal(result.status, "unsupported", String(grossWeight));
    assert.equal(result.metrics, undefined, String(grossWeight));
    assert.match(result.reason ?? "", /will not extrapolate/i);
  }
});

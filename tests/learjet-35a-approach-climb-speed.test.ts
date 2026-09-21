import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { validateContentPayload } from "../lib/content-contracts.ts";
import { calculateMultiAxisMetricGrid } from "../lib/performance-calculator.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const load = (file: string): PerformanceDataset => JSON.parse(
  fs.readFileSync(new URL(`../aircraft-data/learjet-35a/performance/${file}`, import.meta.url), "utf8"),
) as PerformanceDataset;

const dataset = load("approach-climb-speed.json");
const vref = load("vref.json");

function metricAt(source: PerformanceDataset, grossWeight: number, key: string): number | undefined {
  const result = calculateMultiAxisMetricGrid(source, { grossWeight });
  const value = result.metrics?.find((metric) => metric.key === key)?.value;
  return typeof value === "number" ? value : undefined;
}

test("B10 approach-climb dataset satisfies the governed metric-grid contract", () => {
  const errors = validateContentPayload(
    "performance",
    { aircraftId: "learjet-35a", title: "Learjet 35A Performance", datasets: [dataset] },
    "learjet-35a",
  );
  assert.deepEqual(errors, []);
  assert.equal(dataset.phase, "landing");
  assert.equal(dataset.calculator?.kind, "multi-axis-metric-grid");
  if (dataset.calculator?.kind === "multi-axis-metric-grid") {
    assert.deepEqual(dataset.calculator.inputAxes, ["grossWeight"]);
    assert.deepEqual(dataset.calculator.outputKeys, ["approachClimbSpeed"]);
  }
});

test("B10 approach-climb returns the exact 10,000 lb source row", () => {
  assert.equal(metricAt(dataset, 10000, "approachClimbSpeed"), 111);
});

test("B10 approach-climb preserves the critical 15,000 lb published value of 135 KIAS", () => {
  assert.equal(metricAt(dataset, 15000, "approachClimbSpeed"), 135);
});

test("B10 approach-climb returns the exact 15,300 lb source row", () => {
  assert.equal(metricAt(dataset, 15300, "approachClimbSpeed"), 136);
});

test("B10 approach-climb performs bounded interpolation rather than a derived VREF offset", () => {
  const result = calculateMultiAxisMetricGrid(dataset, { grossWeight: 10500 });
  assert.equal(result.status, "ready");
  assert.equal(result.method, "bounded-linear-interpolation");
  assert.equal(metricAt(dataset, 10500, "approachClimbSpeed"), 113.5);
});

test("B10 approach-climb remains a separately published schedule from VREF", () => {
  const approach = metricAt(dataset, 15000, "approachClimbSpeed");
  const reference = metricAt(vref, 15000, "vref");
  assert.equal(approach, 135);
  assert.equal(reference, 127);
  assert.equal((approach ?? 0) - (reference ?? 0), 8);
  assert.ok(dataset.notes?.some((note) => /not derived from VREF/i.test(note)));
});

test("B10 approach-climb fails closed outside the published weight envelope", () => {
  for (const grossWeight of [9999, 15301]) {
    const result = calculateMultiAxisMetricGrid(dataset, { grossWeight });
    assert.equal(result.status, "unsupported", String(grossWeight));
    assert.equal(result.metrics, undefined, String(grossWeight));
  }
});

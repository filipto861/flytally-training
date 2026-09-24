import assert from "node:assert/strict";
import test from "node:test";

import { validateContentPayload } from "../lib/content-contracts.ts";
import { calculatePostBaselineTransform } from "../lib/performance-calculator.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const transform: PerformanceDataset = {
  id: "test-post-baseline-transform",
  title: "Synthetic post-baseline transform",
  kind: "lookup-table",
  phase: "takeoff",
  calculator: {
    kind: "post-baseline-transform",
    operation: "takeoff",
    baselineAxisKey: "baseline",
    modifierAxisKey: "wind",
    outputKey: "corrected",
  },
  axes: [
    { key: "baseline", label: "Zero-wind baseline", unit: "ft", values: [3000, 4000] },
    { key: "wind", label: "Runway wind component", unit: "kt", values: [-10, 0, 30] },
  ],
  outputs: [
    { key: "corrected", label: "Corrected value", unit: "ft" },
  ],
  rows: [
    { inputs: { baseline: 3000, wind: -10 }, outputs: { corrected: 3300 } },
    { inputs: { baseline: 3000, wind: 0 }, outputs: { corrected: 3000 } },
    { inputs: { baseline: 3000, wind: 30 }, outputs: { corrected: 2700 } },
    { inputs: { baseline: 4000, wind: -10 }, outputs: { corrected: 4500 } },
    { inputs: { baseline: 4000, wind: 0 }, outputs: { corrected: 4000 } },
    { inputs: { baseline: 4000, wind: 30 }, outputs: { corrected: 3500 } },
  ],
  interpolation: "linear-explicit",
  sources: [{ manualId: "TEST", pageLabel: "fixture" }],
};

test("B6 post-baseline transform contract validates declarative axis/output bindings", () => {
  const errors = validateContentPayload(
    "performance",
    { aircraftId: "test", title: "Test Performance", datasets: [transform] },
    "test",
  );
  assert.deepEqual(errors, []);
});

test("B6 post-baseline transform returns exact source nodes", () => {
  const result = calculatePostBaselineTransform(transform, 4000, 30);
  assert.equal(result.status, "ready");
  assert.equal(result.method, "exact-source-row");
  assert.equal(result.value, 3500);
  assert.equal(result.unit, "ft");
});

test("B6 post-baseline transform preserves zero-modifier identity through bounded baseline interpolation", () => {
  const result = calculatePostBaselineTransform(transform, 3500, 0);
  assert.equal(result.status, "ready");
  assert.equal(result.method, "bounded-linear-interpolation");
  assert.equal(result.value, 3500);
});

test("B6 post-baseline transform interpolates headwind and tailwind branches independently", () => {
  const headwind = calculatePostBaselineTransform(transform, 3500, 15);
  assert.equal(headwind.status, "ready");
  assert.equal(headwind.value, 3300);

  const tailwind = calculatePostBaselineTransform(transform, 3500, -5);
  assert.equal(tailwind.status, "ready");
  assert.equal(tailwind.value, 3700);
});

test("B6 post-baseline transform fails closed outside either published axis envelope", () => {
  for (const [baseline, wind] of [[2500, 0], [4500, 0], [3500, -11], [3500, 31]] as const) {
    const result = calculatePostBaselineTransform(transform, baseline, wind);
    assert.equal(result.status, "unsupported");
    assert.equal(result.value, undefined);
    assert.match(result.reason ?? "", /will not extrapolate/i);
  }
});

test("B6 post-baseline transform reports incomplete inputs without guessing", () => {
  const missingBaseline = calculatePostBaselineTransform(transform, undefined, 10);
  assert.equal(missingBaseline.status, "incomplete");
  assert.match(missingBaseline.reason ?? "", /zero-wind baseline/i);

  const missingWind = calculatePostBaselineTransform(transform, 3500, undefined);
  assert.equal(missingWind.status, "incomplete");
  assert.match(missingWind.reason ?? "", /runway wind component/i);
});

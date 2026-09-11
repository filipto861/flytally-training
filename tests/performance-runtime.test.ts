import assert from "node:assert/strict";
import test from "node:test";

import {
  filterPerformanceRows,
  getExactPerformanceRow,
  getPerformanceSelectionState,
  performanceScalarFromKey,
  performanceScalarKey,
} from "../lib/performance-runtime.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const dataset: PerformanceDataset = {
  id: "generic-speed-table",
  title: "Generic speed table",
  kind: "lookup-table",
  axes: [
    { key: "weight", label: "Weight", unit: "kg", values: [500, 600] },
    { key: "flaps", label: "Flaps", values: ["0", "10"] },
  ],
  outputs: [{ key: "speed", label: "Speed", unit: "kt" }],
  rows: [
    { inputs: { weight: 500, flaps: "0" }, outputs: { speed: 70 } },
    { inputs: { weight: 500, flaps: "10" }, outputs: { speed: 65 } },
    { inputs: { weight: 600, flaps: "0" }, outputs: { speed: 75 } },
    { inputs: { weight: 600, flaps: "10" }, outputs: { speed: 70 } },
  ],
  interpolation: "none",
};

const interpolatedDataset: PerformanceDataset = {
  ...dataset,
  id: "generic-speed-table-linear",
  interpolation: "linear-explicit",
};

test("performance scalar keys round-trip typed values", () => {
  assert.equal(performanceScalarFromKey(performanceScalarKey(550)), 550);
  assert.equal(performanceScalarFromKey(performanceScalarKey("10")), "10");
  assert.equal(performanceScalarFromKey(performanceScalarKey(true)), true);
  assert.equal(performanceScalarFromKey("number:not-a-number"), undefined);
});

test("performance filtering is driven only by dataset axes", () => {
  const rows = filterPerformanceRows(dataset, { weight: performanceScalarKey(500) });
  assert.equal(rows.length, 2);
  assert.ok(rows.every((row) => row.inputs.weight === 500));
});

test("exact performance result requires every source axis to be selected", () => {
  assert.equal(getExactPerformanceRow(dataset, { weight: performanceScalarKey(500) }), undefined);
  const row = getExactPerformanceRow(dataset, {
    weight: performanceScalarKey(600),
    flaps: performanceScalarKey("10"),
  });
  assert.equal(row?.outputs.speed, 70);
});

test("datasets without explicit interpolation never synthesize a result", () => {
  const rows = filterPerformanceRows(dataset, {
    weight: performanceScalarKey(550),
    flaps: performanceScalarKey("10"),
  });
  assert.deepEqual(rows, []);

  const state = getPerformanceSelectionState(dataset, {
    weight: performanceScalarKey(550),
    flaps: performanceScalarKey("10"),
  });
  assert.equal(state.status, "no-match");
  assert.equal(state.resultRow, undefined);
});

test("linear-explicit datasets interpolate between numeric source breakpoints", () => {
  const state = getPerformanceSelectionState(interpolatedDataset, {
    weight: performanceScalarKey(550),
    flaps: performanceScalarKey("10"),
  });

  assert.equal(state.status, "interpolated");
  assert.equal(state.resultKind, "interpolated");
  assert.equal(state.resultRow?.inputs.weight, 550);
  assert.equal(state.resultRow?.inputs.flaps, "10");
  assert.equal(state.resultRow?.outputs.speed, 67.5);
  assert.equal(state.supportingRows.length, 2);
  assert.deepEqual(state.supportingRows.map((row) => row.inputs.weight), [500, 600]);
});

test("stored breakpoints remain exact even when interpolation is enabled", () => {
  const state = getPerformanceSelectionState(interpolatedDataset, {
    weight: performanceScalarKey(600),
    flaps: performanceScalarKey("0"),
  });

  assert.equal(state.status, "exact");
  assert.equal(state.resultKind, "stored");
  assert.equal(state.exactRow?.outputs.speed, 75);
  assert.equal(state.interpolatedRow, undefined);
});

test("linear-explicit interpolation refuses extrapolation and invented discrete values", () => {
  const outsideRange = getPerformanceSelectionState(interpolatedDataset, {
    weight: performanceScalarKey(650),
    flaps: performanceScalarKey("10"),
  });
  assert.equal(outsideRange.status, "no-match");
  assert.equal(outsideRange.resultRow, undefined);

  const inventedFlapSetting = getPerformanceSelectionState(interpolatedDataset, {
    weight: performanceScalarKey(550),
    flaps: performanceScalarKey("5"),
  });
  assert.equal(inventedFlapSetting.status, "no-match");
  assert.equal(inventedFlapSetting.resultRow, undefined);
});

test("performance selection state distinguishes partial, exact and unsupported combinations", () => {
  const partial = getPerformanceSelectionState(dataset, { weight: performanceScalarKey(500) });
  assert.equal(partial.status, "partial");
  assert.deepEqual(partial.missingAxisKeys, ["flaps"]);
  assert.equal(partial.matchingRows.length, 2);

  const exact = getPerformanceSelectionState(dataset, {
    weight: performanceScalarKey(600),
    flaps: performanceScalarKey("0"),
  });
  assert.equal(exact.status, "exact");
  assert.equal(exact.exactRow?.outputs.speed, 75);

  const unsupported = getPerformanceSelectionState(dataset, {
    weight: performanceScalarKey(550),
    flaps: performanceScalarKey("10"),
  });
  assert.equal(unsupported.status, "no-match");
  assert.equal(unsupported.exactRow, undefined);
});

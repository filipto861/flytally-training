import assert from "node:assert/strict";
import test from "node:test";

import { filterPerformanceRows, getExactPerformanceRow, performanceScalarKey } from "../lib/performance-runtime.ts";
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

test("performance runtime performs no implicit interpolation", () => {
  const rows = filterPerformanceRows(dataset, {
    weight: performanceScalarKey(550),
    flaps: performanceScalarKey("10"),
  });
  assert.deepEqual(rows, []);
});

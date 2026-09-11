import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const explorer = fs.readFileSync(new URL("../components/performance-explorer.tsx", import.meta.url), "utf8");
const runtime = fs.readFileSync(new URL("../lib/performance-runtime.ts", import.meta.url), "utf8");

test("performance workspace focuses one aircraft-defined dataset at a time", () => {
  assert.match(explorer, /aria-label="Performance datasets"/);
  assert.match(explorer, /visibleDatasets\.map\(\(dataset\)/);
  assert.match(explorer, /setSelectedId\(id\)/);
  assert.match(explorer, /window\.location\.hash/);
  assert.doesNotMatch(explorer, /learjet-35-36|Learjet/);
});

test("source-defined interpolation is explicit, bounded and source-row driven", () => {
  assert.match(explorer, /getPerformanceSelectionState\(dataset, filters\)/);
  assert.match(explorer, /isLinearPerformanceAxis\(dataset, axis\)/);
  assert.match(explorer, /type="number"/);
  assert.match(explorer, /step="any"/);
  assert.match(explorer, /No extrapolation was used\./);
  assert.match(explorer, /extrapolation outside the encoded range is never performed/);

  assert.match(runtime, /dataset\.interpolation !== "linear-explicit"/);
  assert.match(runtime, /selected < values\[0\] \|\| selected > values\[values\.length - 1\]/);
  assert.match(runtime, /matches\.length !== 1/);
  assert.match(runtime, /supportingRows/);
  assert.doesNotMatch(runtime, /learjet-35-36|Learjet/);
});

test("performance workspace keeps source units, supporting rows and provenance visible", () => {
  assert.match(explorer, /formatValue\(row\.inputs\[axis\.key\], axis\.unit\)/);
  assert.match(explorer, /formatValue\(row\.outputs\[output\.key\], output\.unit\)/);
  assert.match(explorer, /Supporting reference rows/);
  assert.match(explorer, /Source · \{sourceLabel\}/);
  assert.match(explorer, /Source-defined linear interpolation/);
});

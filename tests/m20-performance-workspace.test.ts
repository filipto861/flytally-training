import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const explorer = fs.readFileSync(new URL("../components/performance-explorer.tsx", import.meta.url), "utf8");
const runtime = fs.readFileSync(new URL("../lib/performance-runtime.ts", import.meta.url), "utf8");

test("performance workspace focuses one aircraft-defined dataset at a time", () => {
  assert.match(explorer, /aria-label="Performance datasets"/);
  assert.match(explorer, /datasets\.map\(\(dataset\)/);
  assert.match(explorer, /setSelectedId\(id\)/);
  assert.match(explorer, /window\.location\.hash/);
  assert.doesNotMatch(explorer, /learjet-35-36|Learjet/);
});

test("exact lookup remains source-row driven and visibly refuses invented interpolation", () => {
  assert.match(explorer, /getPerformanceSelectionState\(dataset, filters\)/);
  assert.match(explorer, /No exact source row exists for this combination\. No interpolation has been performed\./);
  assert.match(explorer, /currently returns stored source rows only; it does not synthesize an interpolated value/);
  assert.match(runtime, /matchingRows\.length === 1 \? matchingRows\[0\] : undefined/);
  assert.doesNotMatch(runtime, /interpolate|lerp|linearInterpolation|Math\.round/);
});

test("performance workspace keeps source units and provenance visible", () => {
  assert.match(explorer, /formatValue\(row\.inputs\[axis\.key\], axis\.unit\)/);
  assert.match(explorer, /formatValue\(row\.outputs\[output\.key\], output\.unit\)/);
  assert.match(explorer, /Source · \{sourceLabel\}/);
  assert.match(explorer, /source-defined linear/);
});

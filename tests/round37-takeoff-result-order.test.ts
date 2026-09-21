import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("Round 3.7 takeoff metrics render in chronological operating order", () => {
  const source = fs.readFileSync(new URL("../components/pilot-takeoff-calculator.tsx", import.meta.url), "utf8");
  const resultStart = source.indexOf('aria-label="Takeoff results"');
  const gridStart = source.indexOf("<MetricGrid>", resultStart);
  const gridEnd = source.indexOf("</MetricGrid>", gridStart);
  assert.ok(resultStart >= 0 && gridStart > resultStart && gridEnd > gridStart);
  const grid = source.slice(gridStart, gridEnd);
  const labels = [...grid.matchAll(/label="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(labels, ["N1", "V1", "VR", "V2", "Takeoff Distance"]);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const ui = read("components/pilot-takeoff-calculator.tsx");
const runtime = read("lib/pilot-takeoff-calculator.ts");
const definition = read("aircraft-data/learjet-35a/performance/takeoff-calculator-definition.ts");

function takeoffResultGrid(): string {
  const resultStart = ui.indexOf('aria-label="Takeoff results"');
  const gridStart = ui.indexOf("<MetricGrid>", resultStart);
  const gridEnd = ui.indexOf("</MetricGrid>", gridStart);
  assert.ok(resultStart >= 0 && gridStart > resultStart && gridEnd > gridStart);
  return ui.slice(gridStart, gridEnd);
}

test("Round 3.7 takeoff result contains exactly five operational metrics", () => {
  const labels = [...takeoffResultGrid().matchAll(/label="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(labels, ["N1", "V1", "VR", "V2", "Takeoff Distance"]);
  assert.equal((takeoffResultGrid().match(/<MetricCard/g) ?? []).length, 5);
});

test("Round 3.7 takeoff result does not display VREF", () => {
  assert.doesNotMatch(takeoffResultGrid(), /VREF|summary\.vref/);
});

test("Round 3.7 takeoff summary type no longer exposes a VREF field", () => {
  const summary = runtime.match(/export type PilotTakeoffSummary = \{([\s\S]*?)\n\};/);
  assert.ok(summary);
  assert.doesNotMatch(summary[1], /\bvref\b|vrefKias/);
});

test("Round 3.7 takeoff definition no longer binds the landing VREF dataset", () => {
  const contract = runtime.match(/export type PilotTakeoffCalculatorDefinition = \{([\s\S]*?)\n\};/);
  assert.ok(contract);
  assert.doesNotMatch(contract[1], /readonly vref\b/);
  assert.doesNotMatch(definition, /\bvref\s*:/);
  assert.doesNotMatch(definition, /learjet-35a-vref/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const forbiddenRuntime =
  /learjet|bristell|cessna|boeing|rotax|\b(?:N1|V1|VR|V2|VREF)\b|takeoff|landing/i;

test("B9-C wind-component runtime remains aircraft- and phase-agnostic", () => {
  const source = read("lib/aviation/wind-component.ts");
  assert.doesNotMatch(source, forbiddenRuntime);
  assert.doesNotMatch(source, /react|jsx|dataset/i);
});

test("B9-C runway-slope runtime remains aircraft- and phase-agnostic", () => {
  const source = read("lib/aviation/runway-slope.ts");
  assert.doesNotMatch(source, forbiddenRuntime);
  assert.doesNotMatch(source, /react|jsx|dataset/i);
});

test("B9-C environment panel contains no aircraft identity or performance-calculation binding", () => {
  const source = read("components/environment-context-panel.tsx");
  assert.doesNotMatch(source, /learjet|bristell|cessna|boeing|rotax/i);
  assert.doesNotMatch(source, /calculatePilotTakeoffSummary|calculatePilotLandingSummary|calculateMultiAxisMetricGrid/);
  assert.doesNotMatch(source, /aircraft-data\//);
});

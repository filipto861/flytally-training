import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("UX Round 3 workspace owns the shared environment state", () => {
  const source = fs.readFileSync(new URL("../components/performance-calculator.tsx", import.meta.url), "utf8");
  assert.match(source, /const \[selectedIcao, setSelectedIcao\]/);
  assert.match(source, /const \[runwayContext, setRunwayContext\]/);
  assert.match(source, /const \[metarSnapshot, setMetarSnapshot\]/);
});

test("UX Round 3 workspace renders Environment before Takeoff and Landing", () => {
  const source = fs.readFileSync(new URL("../components/performance-calculator.tsx", import.meta.url), "utf8");
  const environment = source.indexOf("<PerformanceEnvironmentSection");
  const takeoff = source.indexOf("<PilotTakeoffCalculator", environment);
  const landing = source.indexOf("<PilotLandingCalculator", takeoff);
  assert.ok(environment >= 0);
  assert.ok(takeoff > environment);
  assert.ok(landing > takeoff);
});

test("UX Round 3 workspace passes one shared environment to both pilot calculators", () => {
  const source = fs.readFileSync(new URL("../components/performance-calculator.tsx", import.meta.url), "utf8");
  assert.equal((source.match(/externalEnvironment=\{environment\}/g) ?? []).length, 2);
});

test("UX Round 3 landing package gate now requires the VREF dataset", () => {
  const source = fs.readFileSync(new URL("../components/performance-calculator.tsx", import.meta.url), "utf8");
  assert.match(source, /landingCalculator\.vrefDatasetId/);
});

test("UX Round 3 keeps the public PerformanceCalculator export", () => {
  const source = fs.readFileSync(new URL("../components/performance-calculator.tsx", import.meta.url), "utf8");
  assert.match(source, /function PerformanceWorkspace/);
  assert.match(source, /export function PerformanceCalculator/);
});

test("UX Round 3 takeoff can suppress its internal context widgets when external context is supplied", () => {
  const source = fs.readFileSync(new URL("../components/pilot-takeoff-calculator.tsx", import.meta.url), "utf8");
  assert.match(source, /externalEnvironment\?: ExternalPerformanceEnvironment/);
  assert.match(source, /!usesExternalEnvironment \? \(/);
});

test("UX Round 3 landing consumes runway-aligned wind from shared context for VAPP", () => {
  const source = fs.readFileSync(new URL("../components/pilot-landing-calculator.tsx", import.meta.url), "utf8");
  assert.match(source, /calculateWindComponents/);
  assert.match(source, /windComponentKt/);
  assert.match(source, /externalEnvironment\?: ExternalPerformanceEnvironment/);
});

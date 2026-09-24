import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("UX6.6 Performance is an input/result workspace rather than equal cards", () => {
  const presentation = read("components/ft-performance/FtPerformancePresentation.tsx");
  const css = read("components/ft-performance/ft-performance.module.css");

  assert.match(presentation, /performanceWorkspace/);
  assert.match(presentation, /Performance inputs/);
  assert.match(presentation, /Performance result/);
  assert.match(presentation, /TAKEOFF INPUTS/);
  assert.match(presentation, /Takeoff/);

  assert.match(css, /\.performanceWorkspace\s*\{[\s\S]*grid-template-columns/);
  assert.match(css, /\.resultPane\s*\{/);
  assert.match(css, /\.metricValue\s*\{[\s\S]*font-size:\s*1\.8rem/);
});

test("UX6.6 Performance displays real Active Flight plus operation-owned governed calculation context", () => {
  const presentation = read("components/ft-performance/FtPerformancePresentation.tsx");

  assert.match(presentation, /current\.departure\.icao/);
  assert.match(presentation, /current\.weight\.value/);
  assert.match(presentation, /buildTakeoffPerformanceContext/);
  assert.match(presentation, /identifier: runwayContext\.runwayIdent/);
  assert.match(presentation, /airportIcao: current\.departure\.icao/);
  assert.match(presentation, /takeoffCalculator\?\.flapOptions/);
  assert.match(presentation, /aria-label="Takeoff anti-ice"/);
  assert.match(presentation, /Performance setup required/);
  assert.doesNotMatch(presentation, /\b94\.2\b|\b121\b|\b126\b|\b135\b|\b4,820\b/);
});

test("UX6.6 preserves P2 runtime ownership and recalculation behavior", () => {
  const presentation = read("components/ft-performance/FtPerformancePresentation.tsx");

  assert.match(presentation, /computePerformance/);
  assert.match(presentation, /readTakeoffPerformanceState/);
  assert.match(presentation, /writeTakeoffPerformanceResultV2/);
  assert.match(presentation, /isContextValid/);
  assert.match(presentation, /FtPerformanceInvalidation/);
  assert.match(presentation, /FtPerformanceStrip/);
});

test("UX6.6 Flight visually promotes lifecycle state and brief dependencies", () => {
  const active = read("components/ft-flight/FtActiveFlight.tsx");
  const brief = read("components/ft-flight/FtFlightBrief.tsx");
  const css = read("components/ft-flight/ft-flight.module.css");

  assert.match(active, /data-lifecycle=\{flight\?\.lifecycle \?\? "NONE"\}/);
  assert.match(active, /current\.departure\.icao/);
  assert.match(active, /current\.destination\.icao/);
  assert.match(brief, /FtPerformancePresentation/);
  assert.match(css, /\.flightSummary\s*\{[\s\S]*grid-template-columns/);
  assert.match(css, /\.brief\s*\{[\s\S]*grid-template-columns:\s*repeat\(3/);
});

test("UX6.6 uses approved semantic tokens without hardcoded palette values", () => {
  for (const path of [
    "components/ft-performance/ft-performance.module.css",
    "components/ft-flight/ft-flight.module.css",
  ]) {
    const css = read(path);
    assert.match(css, /var\(--ft-accent\)/);
    assert.match(css, /var\(--ft-radius-panel\)/);
    assert.match(css, /var\(--ft-bg-operational\)/);
    assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
  }
});

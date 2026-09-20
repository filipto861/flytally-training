import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { learjet35aTakeoffCalculatorDefinition as definition } from "../aircraft-data/learjet-35a/performance/takeoff-calculator-definition.ts";
import {
  calculatePilotTakeoffSummary,
  formatPilotTakeoffMetric,
} from "../lib/pilot-takeoff-calculator.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const load = (file: string): PerformanceDataset => JSON.parse(
  fs.readFileSync(new URL(`../aircraft-data/learjet-35a/performance/${file}`, import.meta.url), "utf8"),
) as PerformanceDataset;

const datasets = [
  load("takeoff-n1.json"),
  load("vr-flaps8.json"),
  load("vr-flaps20.json"),
  load("v2-flaps8.json"),
  load("v2-flaps20.json"),
  load("vref.json"),
];

test("B6 registers the pilot calculator as data instead of branching the UI on aircraft identity", () => {
  const registry = fs.readFileSync(new URL("../lib/bundled-performance-content.ts", import.meta.url), "utf8");
  const page = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/performance/page.tsx", import.meta.url), "utf8");
  const calculator = fs.readFileSync(new URL("../components/pilot-takeoff-calculator.tsx", import.meta.url), "utf8");

  assert.match(registry, /learjet35aPerformancePackage/);
  assert.match(page, /getBundledPerformancePackage\(aircraftId\)/);
  assert.doesNotMatch(page, /aircraftId\s*===\s*["']learjet-35a["']/);
  assert.doesNotMatch(calculator, /Learjet|learjet-35a|vr-flaps8|v2-flaps8/i);
});

test("B6 exact source inputs return N1, VR, V2 and VREF together", () => {
  const result = calculatePilotTakeoffSummary(datasets, definition, {
    pressureAltitude: 1000,
    oat: 16,
    takeoffWeight: 15000,
    flaps: "8",
    antiIce: false,
  });

  assert.equal(result.n1.status, "ready");
  assert.equal(result.n1.value, 97.0);
  assert.equal(formatPilotTakeoffMetric(result.n1), "97.0 %");

  assert.deepEqual(
    [result.vr.value, result.v2.value, result.vref.value],
    [130, 133, 127],
  );
  assert.equal(formatPilotTakeoffMetric(result.vr), "130 KIAS");
  assert.equal(formatPilotTakeoffMetric(result.v2), "133 KIAS");
  assert.equal(formatPilotTakeoffMetric(result.vref), "127 KIAS");

  assert.equal(result.v1.status, "pending");
  assert.equal(result.takeoffDistance.status, "pending");
});

test("B6 flap selection switches the source-backed VR and V2 datasets live", () => {
  const result = calculatePilotTakeoffSummary(datasets, definition, {
    pressureAltitude: 1000,
    oat: 16,
    takeoffWeight: 15000,
    flaps: "20",
    antiIce: false,
  });

  assert.equal(result.vr.value, 127);
  assert.equal(result.v2.value, 126);
  assert.equal(result.vref.value, 127);
});

test("B6 fails closed per metric when an input is outside that dataset envelope", () => {
  const highTakeoffWeight = calculatePilotTakeoffSummary(datasets, definition, {
    pressureAltitude: 1000,
    oat: 16,
    takeoffWeight: 16000,
    flaps: "8",
    antiIce: false,
  });

  assert.equal(highTakeoffWeight.vr.status, "ready");
  assert.equal(highTakeoffWeight.vr.value, 134);
  assert.equal(highTakeoffWeight.v2.status, "ready");
  assert.equal(highTakeoffWeight.v2.value, 137);
  assert.equal(highTakeoffWeight.vref.status, "out-of-range");
  assert.equal(formatPilotTakeoffMetric(highTakeoffWeight.vref), "Out of range");

  const belowAllSpeedTables = calculatePilotTakeoffSummary(datasets, definition, {
    pressureAltitude: 1000,
    oat: 16,
    takeoffWeight: 9999,
    flaps: "8",
    antiIce: false,
  });
  assert.equal(belowAllSpeedTables.vr.status, "out-of-range");
  assert.equal(belowAllSpeedTables.v2.status, "out-of-range");
  assert.equal(belowAllSpeedTables.vref.status, "out-of-range");
});

test("B6 anti-ice ON does not reuse the anti-ice OFF N1 grid", () => {
  const result = calculatePilotTakeoffSummary(datasets, definition, {
    pressureAltitude: 1000,
    oat: 16,
    takeoffWeight: 15000,
    flaps: "8",
    antiIce: true,
  });

  assert.equal(result.n1.status, "unavailable");
  assert.match(result.n1.reason ?? "", /Anti-ice ON N1 data is not available/i);
  assert.equal(formatPilotTakeoffMetric(result.n1), "Unavailable");
  assert.equal(result.vr.value, 130);
  assert.equal(result.v2.value, 133);
});

test("B6 UI is live-input driven and exposes the requested pilot fields and placeholders", () => {
  const ui = fs.readFileSync(new URL("../components/pilot-takeoff-calculator.tsx", import.meta.url), "utf8");
  const presentation = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/performance/takeoff-calculator-definition.ts", import.meta.url),
    "utf8",
  );

  assert.match(ui, /definition\.inputs\.pressureAltitude\.label/);
  assert.match(ui, /definition\.inputs\.oat\.label/);
  assert.match(ui, /definition\.inputs\.takeoffWeight\.label/);
  assert.match(ui, /type="checkbox"/);
  assert.match(ui, /calculatePilotTakeoffSummary/);
  assert.match(ui, /label="N1"/);
  assert.match(ui, /label="VR"/);
  assert.match(ui, /label="V2"/);
  assert.match(ui, /label="VREF"/);
  assert.match(ui, /label="V1"/);
  assert.match(ui, /label="Takeoff Distance"/);
  assert.doesNotMatch(ui, />Calculate<\/button>/);

  assert.match(presentation, /Pressure Altitude/);
  assert.match(presentation, /Takeoff Weight/);
  assert.match(presentation, /label: "8°"/);
  assert.match(presentation, /label: "20°"/);
  assert.match(presentation, /Sources: available training material\. Not FAA-approved\./);
});

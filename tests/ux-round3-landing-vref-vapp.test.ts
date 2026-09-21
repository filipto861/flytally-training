import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { learjet35aLandingCalculatorDefinition as definition } from "../aircraft-data/learjet-35a/performance/landing-calculator-definition.ts";
import { calculatePilotLandingSummary } from "../lib/pilot-landing-calculator.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const load = (file: string): PerformanceDataset => JSON.parse(
  fs.readFileSync(new URL(`../aircraft-data/learjet-35a/performance/${file}`, import.meta.url), "utf8"),
) as PerformanceDataset;

const datasets = [
  load("vref.json"),
  load("landing-climb-speed.json"),
  load("approach-climb-speed.json"),
  load("landing-distance-flaps40.json"),
];

test("UX Round 3 landing definition binds the existing VREF dataset", () => {
  assert.equal(definition.vrefDatasetId, "learjet-35a-vref");
});

test("UX Round 3 VREF is returned directly from the source-backed lookup", () => {
  const result = calculatePilotLandingSummary(datasets, definition, { grossWeight: 15000 });
  assert.equal(result.vrefKias.status, "ready");
  assert.equal(result.vrefKias.value, 127);
  assert.equal(result.vrefKias.unit, "KIAS");
});

test("UX Round 3 VAPP equals VREF when no wind context is available", () => {
  const result = calculatePilotLandingSummary(datasets, definition, { grossWeight: 15000 });
  assert.equal(result.vappKias.status, "ready");
  assert.equal(result.vappKias.value, 127);
  assert.match(result.vappKias.reason ?? "", /no runway-aligned wind context/i);
});

test("UX Round 3 VAPP remains VREF below the 10 kt headwind threshold", () => {
  const result = calculatePilotLandingSummary(datasets, definition, {
    grossWeight: 15000,
    windComponentKt: 9.9,
  });
  assert.equal(result.vappKias.value, 127);
});

test("UX Round 3 VAPP adds 5 kt at a headwind component of 10 kt or greater", () => {
  const result = calculatePilotLandingSummary(datasets, definition, {
    grossWeight: 15000,
    windComponentKt: 10,
  });
  assert.equal(result.vappKias.value, 132);
  assert.match(result.vappKias.reason ?? "", /FlightSafety training guidance/i);
});

test("UX Round 3 VAPP does not add speed for a tailwind", () => {
  const result = calculatePilotLandingSummary(datasets, definition, {
    grossWeight: 15000,
    windComponentKt: -8,
  });
  assert.equal(result.vappKias.value, 127);
});

test("UX Round 3 VAPP fails closed with VREF outside the encoded weight envelope", () => {
  const result = calculatePilotLandingSummary(datasets, definition, {
    grossWeight: 16000,
    windComponentKt: 15,
  });
  assert.equal(result.vrefKias.status, "out-of-range");
  assert.equal(result.vappKias.status, "out-of-range");
  assert.equal(result.vappKias.value, undefined);
});

test("UX Round 3 landing UI promotes VREF, VAPP and landing distance", () => {
  const source = fs.readFileSync(new URL("../components/pilot-landing-calculator.tsx", import.meta.url), "utf8");
  assert.match(source, /label="VREF"/);
  assert.match(source, /label="VAPP"/);
  assert.match(source, /label="Landing Distance"/);
  assert.match(source, /Go-around reference/);
  assert.match(source, /Landing Climb Speed/);
  assert.match(source, /Approach Climb Speed/);
});

test("UX Round 3 landing UI explains the go-around reference semantics", () => {
  const source = fs.readFileSync(new URL("../components/pilot-landing-calculator.tsx", import.meta.url), "utf8");
  assert.match(source, /Balked landing climb speed/);
  assert.match(source, /FAR 25\.119/);
  assert.match(source, /Missed approach climb speed/);
  assert.match(source, /FAR 25\.121/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { learjet35aLandingCalculatorDefinition as definition } from "../aircraft-data/learjet-35a/performance/landing-calculator-definition.ts";
import { calculatePilotLandingSummary } from "../lib/pilot-landing-calculator.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const load = (file: string): PerformanceDataset => JSON.parse(
  fs.readFileSync(new URL(`../aircraft-data/learjet-35a/performance/${file}`, import.meta.url), "utf8"),
) as PerformanceDataset;

const vref = load("vref.json");
const landingClimb = load("landing-climb-speed.json");
const approachClimb = load("approach-climb-speed.json");
const landingDistance = load("landing-distance-flaps40.json");
const datasets = [vref, landingClimb, approachClimb, landingDistance];

test("B10 landing definition binds the four source datasets explicitly", () => {
  assert.deepEqual(definition, {
    vrefDatasetId: "learjet-35a-vref",
    landingClimbDatasetId: "learjet-35a-landing-climb-speed",
    approachClimbDatasetId: "learjet-35a-approach-climb-speed",
    landingDistanceDatasetId: "learjet-35a-landing-distance-flaps40",
  });
});

test("B10 pilot landing summary returns all source-backed metrics plus derived VAPP", () => {
  const summary = calculatePilotLandingSummary(datasets, definition, {
    pressureAltitude: 0,
    oat: 16,
    grossWeight: 15000,
  });
  assert.equal(summary.vrefKias.status, "ready");
  assert.equal(summary.vrefKias.value, 127);
  assert.equal(summary.vrefKias.unit, "KIAS");
  assert.equal(summary.vappKias.status, "ready");
  assert.equal(summary.vappKias.value, 127);
  assert.equal(summary.landingClimbSpeed.status, "ready");
  assert.equal(summary.landingClimbSpeed.value, 127);
  assert.equal(summary.landingClimbSpeed.unit, "KIAS");
  assert.equal(summary.approachClimbSpeed.status, "ready");
  assert.equal(summary.approachClimbSpeed.value, 135);
  assert.equal(summary.approachClimbSpeed.unit, "KIAS");
  assert.equal(summary.landingDistanceFt.status, "ready");
  assert.equal(summary.landingDistanceFt.value, 5015);
  assert.equal(summary.landingDistanceFt.unit, "FT");
});

test("B10 pilot landing summary uses bounded interpolation from the shared engine", () => {
  const summary = calculatePilotLandingSummary(datasets, definition, {
    pressureAltitude: 1000,
    oat: 16,
    grossWeight: 10500,
  });
  assert.equal(summary.vrefKias.value, 107.5);
  assert.equal(summary.vappKias.value, 107.5);
  assert.equal(summary.landingClimbSpeed.value, 107.5);
  assert.equal(summary.approachClimbSpeed.value, 113.5);
  assert.equal(summary.landingDistanceFt.value, 4101.25);
});

test("B10 pilot landing summary keeps speed metrics available when distance is sparse", () => {
  const summary = calculatePilotLandingSummary(datasets, definition, {
    pressureAltitude: 4000,
    oat: 38,
    grossWeight: 15000,
  });
  assert.equal(summary.vrefKias.status, "ready");
  assert.equal(summary.vappKias.status, "ready");
  assert.equal(summary.landingClimbSpeed.status, "ready");
  assert.equal(summary.approachClimbSpeed.status, "ready");
  assert.equal(summary.landingDistanceFt.status, "out-of-range");
  assert.equal(summary.landingDistanceFt.value, undefined);
});

test("B10 pilot landing summary distinguishes missing inputs from unavailable source data", () => {
  const missing = calculatePilotLandingSummary(datasets, definition, {});
  assert.equal(missing.vrefKias.status, "missing");
  assert.equal(missing.vappKias.status, "missing");
  assert.equal(missing.landingClimbSpeed.status, "missing");
  assert.equal(missing.approachClimbSpeed.status, "missing");
  assert.equal(missing.landingDistanceFt.status, "missing");

  const unavailable = calculatePilotLandingSummary([], definition, {
    pressureAltitude: 0,
    oat: 16,
    grossWeight: 15000,
  });
  assert.equal(unavailable.vrefKias.status, "unavailable");
  assert.equal(unavailable.vappKias.status, "unavailable");
  assert.equal(unavailable.landingClimbSpeed.status, "unavailable");
  assert.equal(unavailable.approachClimbSpeed.status, "unavailable");
  assert.equal(unavailable.landingDistanceFt.status, "unavailable");
});

test("B10 speed outputs require only gross weight while landing distance requires all three inputs", () => {
  const summary = calculatePilotLandingSummary(datasets, definition, { grossWeight: 14000 });
  assert.equal(summary.vrefKias.status, "ready");
  assert.equal(summary.vrefKias.value, 123);
  assert.equal(summary.vappKias.status, "ready");
  assert.equal(summary.vappKias.value, 123);
  assert.equal(summary.landingClimbSpeed.status, "ready");
  assert.equal(summary.landingClimbSpeed.value, 123);
  assert.equal(summary.approachClimbSpeed.status, "ready");
  assert.equal(summary.approachClimbSpeed.value, 130);
  assert.equal(summary.landingDistanceFt.status, "missing");
});

test("B10 landing runtime remains aircraft-agnostic and delegates interpolation to the shared engine", () => {
  const source = fs.readFileSync(new URL("../lib/pilot-landing-calculator.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /learjet|bristell|cessna|boeing|rotax|flaps40/i);
  assert.match(source, /calculateMultiAxisMetricGrid/);
  assert.doesNotMatch(source, /interpolat(?:e|ion).*function|nearest/i);
});

test("B10 landing UI remains aircraft-agnostic and consumes shared performance primitives", () => {
  const source = fs.readFileSync(new URL("../components/pilot-landing-calculator.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /learjet|bristell|cessna|boeing|rotax/i);
  assert.match(source, /FieldRow/);
  assert.match(source, /InputWithUnit/);
  assert.match(source, /MetricCard/);
  assert.match(source, /MetricGrid/);
  assert.doesNotMatch(source, /MetarStatus|AirportRunwaySelector/);
});

test("B10 bundled package registers the landing datasets and landing definition", () => {
  const source = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/performance/package.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /vref\.json/);
  assert.match(source, /landing-climb-speed\.json/);
  assert.match(source, /approach-climb-speed\.json/);
  assert.match(source, /landing-distance-flaps40\.json/);
  assert.match(source, /landingCalculator: learjet35aLandingCalculatorDefinition/);
});

test("B10 performance workspace accepts and renders an optional landing calculator without changing takeoff props", () => {
  const component = fs.readFileSync(new URL("../components/performance-calculator.tsx", import.meta.url), "utf8");
  const page = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/performance/page.tsx", import.meta.url), "utf8");
  const packageContract = fs.readFileSync(new URL("../lib/performance-package.ts", import.meta.url), "utf8");
  assert.match(component, /landingCalculator\?: PilotLandingCalculatorDefinition/);
  assert.match(component, /hasLandingCalculatorDatasets/);
  assert.match(component, /landingCalculator\.vrefDatasetId/);
  assert.match(component, /landingCalculator\.landingClimbDatasetId/);
  assert.match(component, /landingCalculator\.approachClimbDatasetId/);
  assert.match(component, /landingCalculator\.landingDistanceDatasetId/);
  assert.match(packageContract, /landingCalculator\?: PilotLandingCalculatorDefinition/);
  assert.match(component, /<PilotLandingCalculator/);
  assert.match(component, /datasets=\{runtimeDatasets\}/);
  assert.match(component, /definition=\{landingCalculator\}/);
  assert.match(component, /externalEnvironment=\{environment\}/);
  assert.match(component, /takeoffCalculator\?: PilotTakeoffCalculatorDefinition/);
  assert.match(page, /landingCalculator=\{bundledPackage\?\.landingCalculator\}/);
  assert.match(page, /takeoffCalculator=\{bundledPackage\?\.takeoffCalculator\}/);
});

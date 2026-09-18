import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPerformanceCalculatorProfile,
  calculateLandingDistance,
  calculateTakeoffDistance,
  getLandingSurfaceOptions,
  getLandingWeights,
  getMetricLookupResults,
  getTakeoffSurfaceOptions,
  getTakeoffWeights,
} from "../lib/performance-calculator.ts";
import { validateContentPayload } from "../lib/content-contracts.ts";
import type { AircraftPerformanceContent, PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const takeoffFactors: PerformanceDataset = {
  id: "departure-penalties",
  title: "Departure penalties",
  kind: "lookup-table",
  phase: "takeoff",
  calculator: {
    kind: "distance-factor",
    operation: "takeoff",
    baselineDistanceInput: { key: "chartDistance", label: "Chart distance", unit: "m" },
    runwayAvailableInput: { key: "tora", label: "TORA", unit: "m", optional: true },
    selector: {
      kind: "output-options",
      label: "Runway condition",
      lookupAxis: "massBand",
      baseline: { value: "clean", label: "Published baseline", fixedFactor: 1 },
      options: [{ value: "damp", label: "Damp", factorOutputKey: "dampPenalty" }],
    },
  },
  axes: [{ key: "massBand", label: "Mass", unit: "kg", values: [1000, 1200] }],
  outputs: [{ key: "dampPenalty", label: "Damp factor" }],
  rows: [
    { inputs: { massBand: 1000 }, outputs: { dampPenalty: 1.1 } },
    { inputs: { massBand: 1200 }, outputs: { dampPenalty: 1.2 } },
  ],
  interpolation: "none",
};

const landingFactors: PerformanceDataset = {
  id: "arrival-surface-table",
  title: "Arrival surface table",
  kind: "lookup-table",
  phase: "landing",
  calculator: {
    kind: "distance-factor",
    operation: "landing",
    baselineDistanceInput: { key: "chartDistance", label: "Chart distance", unit: "m" },
    runwayAvailableInput: { key: "lda", label: "LDA", unit: "m", optional: true },
    selector: {
      kind: "axis",
      label: "Runway state",
      axisKey: "runwayCondition",
      factorOutput: "multiplier",
      baseline: { value: "normal", label: "Published baseline", fixedFactor: 1 },
    },
    constraints: [{
      when: { axisKey: "runwayCondition", values: ["ice"] },
      input: { key: "surfaceTemperature", label: "Surface temperature", unit: "°C" },
      operator: "lte",
      value: 5,
      message: "Ice factor is published only at or below 5°C.",
    }],
  },
  axes: [{ key: "runwayCondition", label: "Runway state", values: ["wet", "ice"] }],
  outputs: [{ key: "multiplier", label: "Distance multiplier" }],
  rows: [
    { inputs: { runwayCondition: "wet" }, outputs: { multiplier: 1.25 } },
    { inputs: { runwayCondition: "ice" }, outputs: { multiplier: 1.8 } },
  ],
  interpolation: "none",
};

const landingMetrics: PerformanceDataset = {
  id: "arrival-reference-values",
  title: "Arrival reference values",
  kind: "lookup-table",
  phase: "landing",
  calculator: {
    kind: "metric-lookup",
    operation: "landing",
    axisKey: "landingMass",
    outputKeys: ["referenceVelocity", "approachVelocity"],
  },
  axes: [{ key: "landingMass", label: "Landing mass", unit: "kg", values: [900, 1000] }],
  outputs: [
    { key: "referenceVelocity", label: "Reference speed", unit: "KIAS" },
    { key: "approachVelocity", label: "Approach speed", unit: "KIAS" },
  ],
  rows: [
    { inputs: { landingMass: 900 }, outputs: { referenceVelocity: 70, approachVelocity: 75 } },
    { inputs: { landingMass: 1000 }, outputs: { referenceVelocity: 73, approachVelocity: 78 } },
  ],
  interpolation: "none",
};

const payload: AircraftPerformanceContent = {
  aircraftId: "second-aircraft",
  title: "Performance",
  datasets: [takeoffFactors, landingFactors, landingMetrics],
};

test("v3.1 M2B1 validates a complete non-Learjet factor/metric vocabulary", () => {
  assert.deepEqual(validateContentPayload("performance", payload, "second-aircraft"), []);
});

test("v3.1 M2B1 discovers and executes output-backed takeoff factors from declarations", () => {
  const profile = buildPerformanceCalculatorProfile(payload.datasets);
  assert.equal(profile.takeoffFactorDataset?.id, takeoffFactors.id);
  assert.deepEqual(getTakeoffWeights(profile), [1000, 1200]);
  assert.deepEqual(getTakeoffSurfaceOptions(profile).map((option) => option.value), ["clean", "damp"]);

  const result = calculateTakeoffDistance(profile, {
    dryDistance: 500,
    runwayAvailable: 700,
    weight: 1000,
    surface: "damp",
  });
  assert.equal(result.status, "ready");
  assert.equal(result.factor, 1.1);
  assert.equal(result.correctedDistance, 550);
  assert.equal(result.margin, 150);
});

test("v3.1 M2B1 executes axis-backed landing factors and declared constraints", () => {
  const profile = buildPerformanceCalculatorProfile(payload.datasets);
  assert.deepEqual(getLandingSurfaceOptions(profile), ["normal", "wet", "ice"]);

  const missing = calculateLandingDistance(profile, { dryDistance: 400, surface: "ice" });
  assert.equal(missing.status, "incomplete");
  assert.match(missing.reason ?? "", /5°C/);

  const outside = calculateLandingDistance(profile, { dryDistance: 400, surface: "ice", oatC: 6 });
  assert.equal(outside.status, "unsupported");
  assert.match(outside.reason ?? "", /5°C/);

  const ready = calculateLandingDistance(profile, { dryDistance: 400, surface: "ice", oatC: 4 });
  assert.equal(ready.status, "ready");
  assert.equal(ready.factor, 1.8);
  assert.equal(ready.correctedDistance, 720);
});

test("v3.1 M2B1 generic metric lookup has no dependency on weight/vref/vapp keys", () => {
  const profile = buildPerformanceCalculatorProfile(payload.datasets);
  assert.equal(profile.landingSpeedDataset?.id, landingMetrics.id);
  assert.deepEqual(getLandingWeights(profile), [900, 1000]);
  assert.deepEqual(getMetricLookupResults(landingMetrics, 900), [
    { key: "referenceVelocity", label: "Reference speed", unit: "KIAS", value: 70 },
    { key: "approachVelocity", label: "Approach speed", unit: "KIAS", value: 75 },
  ]);
});

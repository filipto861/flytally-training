import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  buildPerformanceCalculatorProfile,
  calculateLandingDistance,
  calculateTakeoffDistance,
  getLandingSpeeds,
  getLandingSurfaceOptions,
  getLandingWeights,
  getTakeoffSurfaceOptions,
  getTakeoffWeights,
} from "../lib/performance-calculator.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const takeoffFactors: PerformanceDataset = {
  id: "source-takeoff-factors",
  title: "Takeoff distance factors",
  kind: "lookup-table",
  axes: [{ key: "weight", label: "Weight", unit: "lb", values: [14000, 15000] }],
  outputs: [
    { key: "wet8", label: "Wet 8" }, { key: "wet20", label: "Wet 20" },
    { key: "moderate", label: "Moderate" }, { key: "heavy", label: "Heavy" },
    { key: "compactedSnow", label: "Compacted snow" }, { key: "wetIce", label: "Wet ice" },
  ],
  rows: [
    { inputs: { weight: 14000 }, outputs: { wet8: 1.2, wet20: 1.3, moderate: 1.8, heavy: 2.2, compactedSnow: 1.4, wetIce: 2.9 } },
    { inputs: { weight: 15000 }, outputs: { wet8: 1.2, wet20: 1.2, moderate: 1.7, heavy: 2.2, compactedSnow: 1.3, wetIce: 2.6 } },
  ],
  interpolation: "linear-explicit",
};

const landingFactors: PerformanceDataset = {
  id: "source-landing-factors",
  title: "Landing distance factors",
  kind: "lookup-table",
  axes: [{ key: "surface", label: "Surface", values: ["Wet", "Compacted snow", "Wet ice"] }],
  outputs: [{ key: "factor", label: "Landing distance factor" }],
  rows: [
    { inputs: { surface: "Wet" }, outputs: { factor: 1.4 } },
    { inputs: { surface: "Compacted snow" }, outputs: { factor: 1.7 } },
    { inputs: { surface: "Wet ice" }, outputs: { factor: 3.9 } },
  ],
  interpolation: "none",
};

const landingSpeeds: PerformanceDataset = {
  id: "source-landing-speeds",
  title: "Landing speeds",
  kind: "lookup-table",
  axes: [{ key: "weight", label: "Landing weight", unit: "lb", values: [13000, 14000] }],
  outputs: [{ key: "vref", label: "VREF", unit: "KIAS" }, { key: "vapp", label: "VAPP", unit: "KIAS" }],
  rows: [
    { inputs: { weight: 13000 }, outputs: { vref: 119, vapp: 126 } },
    { inputs: { weight: 14000 }, outputs: { vref: 123, vapp: 130 } },
  ],
  interpolation: "none",
};

const profile = buildPerformanceCalculatorProfile([takeoffFactors, landingFactors, landingSpeeds]);

test("M38 discovers calculator inputs from published dataset shape without an aircraft id", () => {
  assert.equal(profile.takeoffFactorDataset?.id, takeoffFactors.id);
  assert.equal(profile.landingFactorDataset?.id, landingFactors.id);
  assert.equal(profile.landingSpeedDataset?.id, landingSpeeds.id);
  assert.deepEqual(getTakeoffWeights(profile), [14000, 15000]);
  assert.deepEqual(getLandingWeights(profile), [13000, 14000]);
  assert.ok(getTakeoffSurfaceOptions(profile).some((option) => option.value === "wet-20"));
  assert.deepEqual(getLandingSurfaceOptions(profile), ["Dry", "Wet", "Compacted snow", "Wet ice"]);
});

test("takeoff calculator applies only an exact stored correction row", () => {
  const result = calculateTakeoffDistance(profile, { dryDistance: 3000, runwayAvailable: 5000, weight: 14000, surface: "wet-20" });
  assert.equal(result.status, "ready");
  assert.equal(result.factor, 1.3);
  assert.equal(result.correctedDistance, 3900);
  assert.equal(result.margin, 1100);
  assert.equal(result.withinRunway, true);

  const interpolatedWeight = calculateTakeoffDistance(profile, { dryDistance: 3000, runwayAvailable: 5000, weight: 14500, surface: "wet-20" });
  assert.equal(interpolatedWeight.status, "unsupported");
  assert.match(interpolatedWeight.reason ?? "", /will not interpolate/i);
});

test("landing calculator applies exact runway factor and independently returns exact VREF/VAPP", () => {
  const result = calculateLandingDistance(profile, { dryDistance: 2500, runwayAvailable: 4000, surface: "Wet" });
  assert.equal(result.status, "ready");
  assert.equal(result.factor, 1.4);
  assert.equal(result.correctedDistance, 3500);
  assert.equal(result.margin, 500);
  assert.deepEqual(getLandingSpeeds(profile, 13000), { vref: 119, vapp: 126 });
  assert.equal(getLandingSpeeds(profile, 13500), undefined);
});

test("temperature-limited landing factors fail closed outside source conditions", () => {
  const missingTemperature = calculateLandingDistance(profile, { dryDistance: 2500, surface: "Wet ice" });
  assert.equal(missingTemperature.status, "incomplete");
  const tooWarm = calculateLandingDistance(profile, { dryDistance: 2500, surface: "Wet ice", oatC: 5 });
  assert.equal(tooWarm.status, "unsupported");
  const supported = calculateLandingDistance(profile, { dryDistance: 2500, surface: "Wet ice", oatC: 4 });
  assert.equal(supported.status, "ready");
  assert.equal(supported.factor, 3.9);
});

test("performance page is calculator-first and keeps the legacy dataset explorer behind progressive disclosure", () => {
  const page = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/performance/page.tsx", import.meta.url), "utf8");
  const calculator = fs.readFileSync(new URL("../components/performance-calculator.tsx", import.meta.url), "utf8");
  assert.match(page, /<PerformanceCalculator/);
  assert.doesNotMatch(page, /<PerformanceExplorer/);
  assert.match(calculator, />Takeoff<\/button>/);
  assert.match(calculator, />Landing<\/button>/);
  assert.match(calculator, /Reference data & other performance tables/);
  assert.match(calculator, /<PerformanceExplorer datasets=\{datasets\}/);
  assert.match(calculator, /Dry takeoff field length/);
  assert.match(calculator, /Dry landing distance/);
  assert.doesNotMatch(calculator, /learjet-35-36|Learjet|Cessna|Boeing|DA40/i);
});

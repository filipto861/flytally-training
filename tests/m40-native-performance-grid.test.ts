import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  buildPerformanceCalculatorProfile,
  calculateNativeDistanceGrid,
  getNativeGridSurfaceOptions,
} from "../lib/performance-calculator.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const takeoffGrid: PerformanceDataset = {
  id: "generic-takeoff-distance-grid",
  title: "Takeoff distance grid",
  kind: "lookup-table",
  axes: [
    { key: "airportAltitudeFt", label: "Airport altitude", unit: "ft", values: [0, 2000] },
    { key: "isaDeviationC", label: "ISA deviation", unit: "°C", values: [0, 10] },
    { key: "surface", label: "Surface", values: ["Concrete", "Grass"] },
  ],
  outputs: [
    { key: "oatC", label: "OAT", unit: "°C" },
    { key: "groundRunM", label: "Ground run", unit: "m" },
    { key: "distance50ftM", label: "50 ft distance", unit: "m" },
  ],
  rows: [
    { inputs: { airportAltitudeFt: 0, isaDeviationC: 0, surface: "Concrete" }, outputs: { oatC: 15, groundRunM: 100, distance50ftM: 300 } },
    { inputs: { airportAltitudeFt: 0, isaDeviationC: 10, surface: "Concrete" }, outputs: { oatC: 25, groundRunM: 120, distance50ftM: 340 } },
    { inputs: { airportAltitudeFt: 2000, isaDeviationC: 0, surface: "Concrete" }, outputs: { oatC: 11, groundRunM: 140, distance50ftM: 380 } },
    { inputs: { airportAltitudeFt: 2000, isaDeviationC: 10, surface: "Concrete" }, outputs: { oatC: 21, groundRunM: 160, distance50ftM: 420 } },
    { inputs: { airportAltitudeFt: 0, isaDeviationC: 0, surface: "Grass" }, outputs: { oatC: 15, groundRunM: 130, distance50ftM: 330 } },
    { inputs: { airportAltitudeFt: 0, isaDeviationC: 10, surface: "Grass" }, outputs: { oatC: 25, groundRunM: 150, distance50ftM: 370 } },
    { inputs: { airportAltitudeFt: 2000, isaDeviationC: 0, surface: "Grass" }, outputs: { oatC: 11, groundRunM: 170, distance50ftM: 410 } },
    { inputs: { airportAltitudeFt: 2000, isaDeviationC: 10, surface: "Grass" }, outputs: { oatC: 21, groundRunM: 190, distance50ftM: 450 } },
  ],
  interpolation: "linear-explicit",
};

const landingGrid: PerformanceDataset = {
  ...takeoffGrid,
  id: "generic-landing-distance-grid",
  title: "Landing distance grid",
};

test("M40 discovers native takeoff and landing grids without aircraft-specific logic", () => {
  const profile = buildPerformanceCalculatorProfile([takeoffGrid, landingGrid]);
  assert.equal(profile.takeoffGridDataset?.id, takeoffGrid.id);
  assert.equal(profile.landingGridDataset?.id, landingGrid.id);
  assert.deepEqual(getNativeGridSurfaceOptions(profile.takeoffGridDataset), ["Concrete", "Grass"]);
});

test("native grid returns exact source row unchanged", () => {
  const result = calculateNativeDistanceGrid(takeoffGrid, {
    airportAltitudeFt: 0,
    oatC: 15,
    surface: "Concrete",
    runwayAvailableM: 500,
  });
  assert.equal(result.status, "ready");
  assert.equal(result.method, "exact-source-row");
  assert.equal(result.isaDeviationC, 0);
  assert.equal(result.groundRunM, 100);
  assert.equal(result.distance50ftM, 300);
  assert.equal(result.distance50ftMarginM, 200);
  assert.equal(result.withinRunway, true);
});

test("native grid performs bounded bilinear software interpolation and reports it", () => {
  // Source ISA temperature at 1000 ft is interpolated between 15°C and 11°C = 13°C.
  // OAT 18°C therefore corresponds to ISA +5°C, exactly halfway in both axes.
  const result = calculateNativeDistanceGrid(takeoffGrid, {
    airportAltitudeFt: 1000,
    oatC: 18,
    surface: "Concrete",
    runwayAvailableM: 500,
  });
  assert.equal(result.status, "ready");
  assert.equal(result.method, "bounded-linear-interpolation");
  assert.equal(result.sourceIsaTemperatureC, 13);
  assert.equal(result.isaDeviationC, 5);
  assert.equal(result.groundRunM, 130);
  assert.equal(result.distance50ftM, 360);
  assert.equal(result.withinRunway, true);
});

test("native grid refuses extrapolation beyond altitude or ISA-deviation envelope", () => {
  const highAltitude = calculateNativeDistanceGrid(takeoffGrid, { airportAltitudeFt: 2500, oatC: 10, surface: "Concrete" });
  assert.equal(highAltitude.status, "unsupported");
  assert.match(highAltitude.reason ?? "", /altitude.*outside/i);

  const tooHot = calculateNativeDistanceGrid(takeoffGrid, { airportAltitudeFt: 0, oatC: 40, surface: "Concrete" });
  assert.equal(tooHot.status, "unsupported");
  assert.match(tooHot.reason ?? "", /will not extrapolate/i);
});

test("native grid refuses between-row interpolation when dataset does not explicitly enable it", () => {
  const exactOnly = { ...takeoffGrid, interpolation: "none" as const };
  const result = calculateNativeDistanceGrid(exactOnly, { airportAltitudeFt: 1000, oatC: 18, surface: "Concrete" });
  assert.equal(result.status, "unsupported");
  assert.match(result.reason ?? "", /does not permit software interpolation/i);
});

test("calculator UI exposes native EFB inputs while retaining generic fallback", () => {
  const calculator = fs.readFileSync(new URL("../components/performance-calculator.tsx", import.meta.url), "utf8");
  assert.match(calculator, /Airport altitude/);
  assert.match(calculator, /Runway surface/);
  assert.match(calculator, /Runway available/);
  assert.match(calculator, /Published-table envelope/);
  assert.match(calculator, /bounded linear interpolation/i);
  assert.doesNotMatch(calculator, /bristell|learjet|cessna|boeing|da40/i);
});

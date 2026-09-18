import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { validateContentPayload } from "../lib/content-contracts.ts";
import { createStructuredStarterPayload } from "../lib/content-authoring-templates.ts";
import {
  buildPerformanceCalculatorProfile,
  calculateNativeDistanceGrid,
  getNativeGridSurfaceOptions,
} from "../lib/performance-calculator.ts";
import type { AircraftPerformanceContent, PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const arbitraryGrid: PerformanceDataset = {
  id: "field-length-tool",
  title: "Published field length",
  kind: "lookup-table",
  phase: "takeoff",
  calculator: {
    kind: "runway-distance-grid",
    operation: "takeoff",
    bindings: {
      altitudeAxis: "fieldElevation",
      isaDeviationAxis: "deltaIsa",
      surfaceAxis: "runwayState",
      sourceTemperatureOutput: "tableTemperature",
      groundRunOutput: "roll",
      obstacleDistanceOutput: "clearanceDistance",
    },
    oatInput: { key: "outsideAirTemperature", label: "Outside air temperature", unit: "°C" },
    runwayAvailableInput: { key: "tora", label: "TORA", unit: "m", optional: true },
    obstacleHeight: { value: 50, unit: "ft" },
  },
  axes: [
    { key: "fieldElevation", label: "Field elevation", unit: "ft", values: [0, 2000] },
    { key: "deltaIsa", label: "ISA deviation", unit: "°C", values: [0, 10] },
    { key: "runwayState", label: "Runway state", values: ["Paved"] },
  ],
  outputs: [
    { key: "tableTemperature", label: "Table OAT", unit: "°C" },
    { key: "roll", label: "Ground roll", unit: "m" },
    { key: "clearanceDistance", label: "Distance over obstacle", unit: "m" },
  ],
  rows: [
    { inputs: { fieldElevation: 0, deltaIsa: 0, runwayState: "Paved" }, outputs: { tableTemperature: 15, roll: 100, clearanceDistance: 300 } },
    { inputs: { fieldElevation: 0, deltaIsa: 10, runwayState: "Paved" }, outputs: { tableTemperature: 25, roll: 120, clearanceDistance: 340 } },
    { inputs: { fieldElevation: 2000, deltaIsa: 0, runwayState: "Paved" }, outputs: { tableTemperature: 11, roll: 140, clearanceDistance: 380 } },
    { inputs: { fieldElevation: 2000, deltaIsa: 10, runwayState: "Paved" }, outputs: { tableTemperature: 21, roll: 160, clearanceDistance: 420 } },
  ],
  interpolation: "linear-explicit",
};

test("v3.1 M2A validates declarative calculator bindings with arbitrary aircraft-owned field names", () => {
  const payload: AircraftPerformanceContent = { aircraftId: "second-aircraft", title: "Performance", datasets: [arbitraryGrid] };
  assert.deepEqual(validateContentPayload("performance", payload, "second-aircraft"), []);
});

test("v3.1 M2A runway calculator executes declared bindings without legacy magic dataset keys", () => {
  const profile = buildPerformanceCalculatorProfile([arbitraryGrid]);
  assert.equal(profile.takeoffGridDataset?.id, arbitraryGrid.id);
  assert.deepEqual(getNativeGridSurfaceOptions(arbitraryGrid), ["Paved"]);

  const exact = calculateNativeDistanceGrid(arbitraryGrid, {
    airportAltitudeFt: 0,
    oatC: 15,
    surface: "Paved",
    runwayAvailableM: 500,
  });
  assert.equal(exact.status, "ready");
  assert.equal(exact.groundRunM, 100);
  assert.equal(exact.distance50ftM, 300);

  const interpolated = calculateNativeDistanceGrid(arbitraryGrid, {
    airportAltitudeFt: 1000,
    oatC: 18,
    surface: "Paved",
    runwayAvailableM: 500,
  });
  assert.equal(interpolated.status, "ready");
  assert.equal(interpolated.method, "bounded-linear-interpolation");
  assert.equal(interpolated.groundRunM, 130);
  assert.equal(interpolated.distance50ftM, 360);
});

test("v3.1 M2A rejects calculator bindings that reference unpublished fields", () => {
  const broken: PerformanceDataset = {
    ...arbitraryGrid,
    calculator: {
      ...arbitraryGrid.calculator!,
      bindings: {
        ...(arbitraryGrid.calculator!.kind === "runway-distance-grid" ? arbitraryGrid.calculator!.bindings : {}),
        altitudeAxis: "missing-axis",
        isaDeviationAxis: "deltaIsa",
        surfaceAxis: "runwayState",
        sourceTemperatureOutput: "tableTemperature",
        groundRunOutput: "roll",
        obstacleDistanceOutput: "clearanceDistance",
      },
    } as PerformanceDataset["calculator"],
  };
  const errors = validateContentPayload("performance", { aircraftId: "second-aircraft", title: "Performance", datasets: [broken] }, "second-aircraft");
  assert.ok(errors.some((error) => /bindings must reference existing dataset axes and outputs/.test(error)));
});

test("v3.1 M2A Studio starter advertises explicit performance semantics", () => {
  const starter = createStructuredStarterPayload("second-aircraft", "performance");
  const dataset = (starter.datasets as Array<Record<string, unknown>>)[0];
  assert.equal(dataset.phase, "reference");
  assert.deepEqual(dataset.calculator, { kind: "metric-lookup", operation: "reference", axisKey: "axis1", outputKeys: ["output1"] });
});

test("v3.1 M2A Performance Explorer prefers declared phase metadata before legacy inference", () => {
  const source = fs.readFileSync(new URL("../components/performance-explorer.tsx", import.meta.url), "utf8");
  assert.match(source, /dataset\.phase \?\? dataset\.calculator\?\.operation/);
  assert.match(source, /declaredPhaseLabels/);
});

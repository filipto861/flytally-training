import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { calculateOperationalNativeDistanceGrid } from "../lib/operational-performance-policy.ts";
import { calculateNativeDistanceGrid } from "../lib/performance-calculator.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const exactOnlyGrid: PerformanceDataset = {
  id: "generic-runway-distance-grid",
  title: "Takeoff distance grid",
  kind: "lookup-table",
  axes: [
    { key: "airportAltitudeFt", label: "Airport altitude", unit: "ft", values: [0, 2000] },
    { key: "isaDeviationC", label: "ISA deviation", unit: "°C", values: [0, 10] },
    { key: "surface", label: "Surface", values: ["Concrete"] },
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
  ],
  interpolation: "none",
};

test("M52 governed source interpolation policy is also authoritative in Fly", () => {
  const input = { airportAltitudeFt: 1000, oatC: 18, surface: "Concrete", runwayAvailableM: 500 };
  const governed = calculateNativeDistanceGrid(exactOnlyGrid, input);
  assert.equal(governed.status, "unsupported");
  assert.match(governed.reason ?? "", /does not permit software interpolation/i);

  const operational = calculateOperationalNativeDistanceGrid(exactOnlyGrid, input);
  assert.equal(operational.status, "unsupported");
  assert.match(operational.reason ?? "", /does not permit software interpolation/i);
  assert.equal(exactOnlyGrid.interpolation, "none");
});

test("M52 operational interpolation never extrapolates and requires the published envelope", () => {
  const outside = calculateOperationalNativeDistanceGrid(exactOnlyGrid, {
    airportAltitudeFt: 2500,
    oatC: 10,
    surface: "Concrete",
  });
  assert.equal(outside.status, "unsupported");
  assert.match(outside.reason ?? "", /outside the published source-table envelope/i);
});

test("M52 preserves exact source rows and marks them separately from interpolated results", () => {
  const exact = calculateOperationalNativeDistanceGrid(exactOnlyGrid, {
    airportAltitudeFt: 0,
    oatC: 15,
    surface: "Concrete",
  });
  assert.equal(exact.status, "ready");
  assert.equal(exact.method, "exact-source-row");
  assert.equal(exact.distance50ftM, 300);

  const performance = fs.readFileSync(new URL("../components/operational-performance.tsx", import.meta.url), "utf8");
  assert.match(performance, /Published table value/);
  assert.match(performance, /Interpolated between published rows/);
  assert.match(performance, /calculateOperationalNativeDistanceGrid/);
  assert.doesNotMatch(performance, /bristell|learjet|cessna|boeing|da40/i);
});

test("M52 adds a deliberate whole-checklist reset without removing phase reset", () => {
  const checklist = fs.readFileSync(new URL("../components/operational-checklist.tsx", import.meta.url), "utf8");
  assert.match(checklist, /Reset all/);
  assert.match(checklist, /Confirm all/);
  assert.match(checklist, /Confirm reset of entire checklist/);
  assert.match(checklist, /setCompleted\(new Set\(\)\)/);
  assert.match(checklist, /setPhaseId\(firstPhase\?\.id \?\? ""\)/);
  assert.match(checklist, /function resetPhase\(\)/);
  assert.match(checklist, /function resetAll\(\)/);
  assert.doesNotMatch(checklist, /bristell|learjet|cessna|boeing|da40/i);
});

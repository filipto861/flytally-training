import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { learjet35aTakeoffCalculatorDefinition as definition } from "../aircraft-data/learjet-35a/performance/takeoff-calculator-definition.ts";
import { validateContentPayload } from "../lib/content-contracts.ts";
import { calculateMultiAxisMetricGrid } from "../lib/performance-calculator.ts";
import { calculatePilotTakeoffSummary, formatPilotTakeoffMetric } from "../lib/pilot-takeoff-calculator.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const load = (file: string): PerformanceDataset => JSON.parse(
  fs.readFileSync(new URL(`../aircraft-data/learjet-35a/performance/${file}`, import.meta.url), "utf8"),
) as PerformanceDataset;

const f8 = load("takeoff-distance-flaps8.json");
const f20 = load("takeoff-distance-flaps20.json");
const v1f8 = load("v1-flaps8.json");
const v1f20 = load("v1-flaps20.json");

const datasets = [
  load("takeoff-n1.json"),
  f8,
  f20,
  v1f8,
  v1f20,
  load("vr-flaps8.json"),
  load("vr-flaps20.json"),
  load("v2-flaps8.json"),
  load("v2-flaps20.json"),
  load("vref.json"),
];

function calculate(
  dataset: PerformanceDataset,
  pressureAltitude: number,
  oat: number,
  grossWeight: number,
) {
  return calculateMultiAxisMetricGrid(dataset, { pressureAltitude, oat, grossWeight });
}

function distance(
  dataset: PerformanceDataset,
  pressureAltitude: number,
  oat: number,
  grossWeight: number,
): number | undefined {
  const result = calculate(dataset, pressureAltitude, oat, grossWeight);
  return result.metrics?.find((metric) => metric.key === "distance")?.value as number | undefined;
}

function coordinateSet(dataset: PerformanceDataset): Set<string> {
  return new Set(dataset.rows.map((row) =>
    [row.inputs.pressureAltitude, row.inputs.oat, row.inputs.grossWeight].join("|"),
  ));
}

test("B8 takeoff-distance datasets satisfy the governed multi-axis metric-grid contract", () => {
  for (const dataset of [f8, f20]) {
    const errors = validateContentPayload(
      "performance",
      { aircraftId: "learjet-35a", title: "Learjet 35A Performance", datasets: [dataset] },
      "learjet-35a",
    );
    assert.deepEqual(errors, [], dataset.id);
    assert.equal(dataset.kind, "lookup-table");
    assert.equal(dataset.phase, "takeoff");
    assert.equal(dataset.calculator?.kind, "multi-axis-metric-grid");
    if (dataset.calculator?.kind === "multi-axis-metric-grid") {
      assert.deepEqual(dataset.calculator.inputAxes, ["pressureAltitude", "oat", "grossWeight"]);
      assert.deepEqual(dataset.calculator.outputKeys, ["distance"]);
    }
    assert.equal(dataset.interpolation, "linear-explicit");
    assert.ok(dataset.rows.every((row) => typeof row.outputs.distance === "number"));
  }
});

test("B8 source axes include the complete CL-102B pressure-altitude, OAT and weight grids", () => {
  for (const dataset of [f8, f20]) {
    assert.deepEqual(dataset.axes.find((axis) => axis.key === "pressureAltitude")?.values, [
      0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000,
    ]);
    assert.deepEqual(dataset.axes.find((axis) => axis.key === "oat")?.values, [-18, -7, 4, 16, 27, 38]);
    assert.deepEqual(dataset.axes.find((axis) => axis.key === "grossWeight")?.values, [
      10000, 11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 18300,
    ]);
  }
});

test("B8 distance datasets preserve CL-102B provenance and baseline conditions", () => {
  for (const dataset of [f8, f20]) {
    assert.ok(dataset.sources?.some((source) => source.manualId === "CL-102B"));
    assert.ok(dataset.notes?.some((note) =>
      /dry runway, zero wind, zero runway gradient, anti-ice off and anti-skid on/i.test(note),
    ));
    assert.ok(dataset.notes?.some((note) => /Sparse high\/hot source regions are intentionally absent/i.test(note)));
  }
});

test("B8 distance grids pair one-for-one with the published B7 V1 coordinates", () => {
  assert.equal(f8.rows.length, 575);
  assert.equal(f20.rows.length, 517);
  assert.deepEqual([...coordinateSet(f8)].sort(), [...coordinateSet(v1f8)].sort());
  assert.deepEqual([...coordinateSet(f20)].sort(), [...coordinateSet(v1f20)].sort());
});

test("B8 Flaps 8 returns exact Sea Level source nodes", () => {
  assert.equal(distance(f8, 0, -18, 18300), 4686);
  assert.equal(distance(f8, 0, -18, 10000), 2085);
  assert.equal(distance(f8, 0, 16, 15000), 3431);
});

test("B8 Flaps 8 returns exact 1,000 ft source nodes", () => {
  assert.equal(distance(f8, 1000, 16, 15000), 3632);
  assert.equal(distance(f8, 1000, 38, 18000), 8200);
  assert.equal(calculate(f8, 1000, 38, 18300).status, "unsupported");
});

test("B8 Flaps 8 returns exact 2,000 ft source nodes", () => {
  assert.equal(distance(f8, 2000, 16, 15000), 3857);
  assert.equal(distance(f8, 2000, 38, 17000), 7930);
  assert.equal(calculate(f8, 2000, 38, 18000).status, "unsupported");
});

test("B8 Flaps 8 returns exact mid-altitude source nodes", () => {
  assert.equal(distance(f8, 3000, -18, 18300), 5254);
  assert.equal(distance(f8, 6000, 16, 15000), 5240);
  assert.equal(distance(f8, 9000, 4, 18300), 10546);
});

test("B8 Flaps 20 returns exact Sea Level source nodes", () => {
  assert.equal(distance(f20, 0, -18, 18300), 4509);
  assert.equal(distance(f20, 0, -18, 10000), 2115);
  assert.equal(distance(f20, 0, 16, 15000), 3324);
});

test("B8 Flaps 20 preserves the published Sea Level 38°C sparse edge", () => {
  assert.equal(distance(f20, 0, 38, 15000), 4410);
  assert.equal(distance(f20, 0, 38, 16000), 5084);
  assert.equal(calculate(f20, 0, 38, 17000).status, "unsupported");
});

test("B8 Flaps 20 returns exact 1,000 ft source nodes", () => {
  assert.equal(distance(f20, 1000, 16, 15000), 3500);
  assert.equal(distance(f20, 1000, 38, 15000), 4831);
  assert.equal(calculate(f20, 1000, 38, 16000).status, "unsupported");
});

test("B8 Flaps 20 returns exact 2,000 ft source nodes", () => {
  assert.equal(distance(f20, 2000, 16, 15000), 3677);
  assert.equal(distance(f20, 2000, 38, 15000), 5252);
  assert.equal(calculate(f20, 2000, 38, 16000).status, "unsupported");
});

test("B8 performs bounded pressure-altitude interpolation", () => {
  const result = calculate(f8, 3500, -18, 15000);
  assert.equal(result.status, "ready");
  assert.equal(result.method, "bounded-linear-interpolation");
  assert.equal(distance(f8, 3500, -18, 15000), 3528);
});

test("B8 performs bounded temperature interpolation", () => {
  const result = calculate(f8, 0, 21.5, 15000);
  assert.equal(result.status, "ready");
  assert.equal(result.method, "bounded-linear-interpolation");
  assert.equal(distance(f8, 0, 21.5, 15000), 3644);
});

test("B8 performs bounded weight interpolation", () => {
  const result = calculate(f8, 0, 16, 14500);
  assert.equal(result.status, "ready");
  assert.equal(result.method, "bounded-linear-interpolation");
  assert.equal(distance(f8, 0, 16, 14500), 3233);
});

test("B8 1,300 ft no-wind baseline resolves independently from the FlightSafety wind-corrected example", () => {
  const result = calculate(f8, 1300, 16, 15000);
  assert.equal(result.status, "ready");
  assert.equal(result.method, "bounded-linear-interpolation");
  assert.ok(Math.abs((distance(f8, 1300, 16, 15000) ?? 0) - 3699.5) < 0.1);
});

test("B8 sparse exact high/hot Flaps 8 cells fail closed", () => {
  const result = calculate(f8, 7000, 38, 18300);
  assert.equal(result.status, "unsupported");
  assert.equal(result.metrics, undefined);
});

test("B8 sparse exact high/hot Flaps 20 cells fail closed", () => {
  const result = calculate(f20, 7000, 38, 15000);
  assert.equal(result.status, "unsupported");
  assert.equal(result.metrics, undefined);
});

test("B8 interpolation fails closed when a required sparse source corner is missing", () => {
  const result = calculate(f8, 6500, 32.5, 15000);
  assert.equal(result.status, "unsupported");
  assert.equal(result.metrics, undefined);
  assert.match(result.reason ?? "", /unavailable source corners|will not extrapolate/i);
});

test("B8 fails closed below and above the published gross-weight envelope", () => {
  for (const grossWeight of [9000, 19000]) {
    const result = calculate(f8, 0, 16, grossWeight);
    assert.equal(result.status, "unsupported");
    assert.equal(result.metrics, undefined);
  }
});

test("B8 fails closed below and above the published OAT envelope", () => {
  for (const oat of [-25, 45]) {
    const result = calculate(f8, 3000, oat, 15000);
    assert.equal(result.status, "unsupported");
    assert.equal(result.metrics, undefined);
  }
});

test("B8 fails closed below and above the published pressure-altitude envelope", () => {
  for (const pressureAltitude of [-1, 12000]) {
    const result = calculate(f8, pressureAltitude, 16, 15000);
    assert.equal(result.status, "unsupported");
    assert.equal(result.metrics, undefined);
  }
});

test("B8 Flaps 8 and Flaps 20 remain distinct source datasets", () => {
  assert.notEqual(f8.id, f20.id);
  assert.equal(distance(f8, 0, 16, 15000), 3431);
  assert.equal(distance(f20, 0, 16, 15000), 3324);
});

test("B8 pilot summary returns source-backed distance for both flap selections", () => {
  const f8Result = calculatePilotTakeoffSummary(datasets, definition, {
    pressureAltitude: 1000,
    oat: 16,
    takeoffWeight: 15000,
    flaps: "8",
    antiIce: false,
  });
  assert.equal(f8Result.takeoffDistance.status, "ready");
  assert.equal(f8Result.takeoffDistance.value, 3632);
  assert.equal(formatPilotTakeoffMetric(f8Result.takeoffDistance), "3,632 FT");

  const f20Result = calculatePilotTakeoffSummary(datasets, definition, {
    pressureAltitude: 1000,
    oat: 16,
    takeoffWeight: 15000,
    flaps: "20",
    antiIce: false,
  });
  assert.equal(f20Result.takeoffDistance.status, "ready");
  assert.equal(f20Result.takeoffDistance.value, 3500);
});

test("B8 anti-ice ON does not fall through to the anti-ice OFF distance grid", () => {
  for (const flaps of ["8", "20"]) {
    const result = calculatePilotTakeoffSummary(datasets, definition, {
      pressureAltitude: 1000,
      oat: 16,
      takeoffWeight: 15000,
      flaps,
      antiIce: true,
    });
    assert.equal(result.takeoffDistance.status, "unavailable");
    assert.equal(result.takeoffDistance.value, undefined);
    assert.match(result.takeoffDistance.reason ?? "", /Anti-ice ON takeoff distance data is not available/i);
  }
});

test("B8 bundled performance package registers both takeoff-distance source grids", () => {
  const pkgSource = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/performance/package.ts", import.meta.url),
    "utf8",
  );
  assert.match(pkgSource, /takeoff-distance-flaps8\.json/);
  assert.match(pkgSource, /takeoff-distance-flaps20\.json/);
  assert.match(pkgSource, /takeoffDistanceFlaps8/);
  assert.match(pkgSource, /takeoffDistanceFlaps20/);
});

test("B8 distance bindings live in aircraft data while the generic performance engine stays aircraft-agnostic", () => {
  const engine = fs.readFileSync(new URL("../lib/performance-calculator.ts", import.meta.url), "utf8");
  const binding = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/performance/takeoff-calculator-definition.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(engine, /learjet/i);
  assert.doesNotMatch(engine, /flaps8|flaps20/i);
  assert.doesNotMatch(engine, /takeoff-distance-flaps/i);
  assert.match(binding, /learjet-35a-takeoff-distance-flaps8/);
  assert.match(binding, /learjet-35a-takeoff-distance-flaps20/);
});

test("B8 removes the Learjet takeoff-distance placeholder while preserving generic placeholder fallback support", () => {
  assert.equal(definition.placeholders.some((item) => item.key === "takeoffDistance"), false);
  const runtimeSource = fs.readFileSync(new URL("../lib/pilot-takeoff-calculator.ts", import.meta.url), "utf8");
  assert.match(runtimeSource, /placeholders\.find\(\(item\) => item\.key === "takeoffDistance"\)/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { learjet35aTakeoffCalculatorDefinition as definition } from "../aircraft-data/learjet-35a/performance/takeoff-calculator-definition.ts";
import { validateContentPayload } from "../lib/content-contracts.ts";
import { calculateMultiAxisMetricGrid } from "../lib/performance-calculator.ts";
import { calculatePilotTakeoffSummary } from "../lib/pilot-takeoff-calculator.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const load = (file: string): PerformanceDataset => JSON.parse(
  fs.readFileSync(new URL(`../aircraft-data/learjet-35a/performance/${file}`, import.meta.url), "utf8"),
) as PerformanceDataset;

const f8 = load("v1-flaps8.json");
const f20 = load("v1-flaps20.json");
const datasets = [
  load("takeoff-n1.json"),
  f8,
  f20,
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

function value(
  dataset: PerformanceDataset,
  pressureAltitude: number,
  oat: number,
  grossWeight: number,
): number | undefined {
  const result = calculate(dataset, pressureAltitude, oat, grossWeight);
  return result.metrics?.find((metric) => metric.key === "v1")?.value as number | undefined;
}

test("B7 V1 datasets satisfy the governed multi-axis metric-grid contract", () => {
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
      assert.deepEqual(dataset.calculator.outputKeys, ["v1"]);
    }
    assert.equal(dataset.interpolation, "linear-explicit");
    assert.ok(dataset.rows.every((row) => typeof row.outputs.v1 === "number"));
  }
});

test("B7 V1 source axes include the complete CL-102B pressure-altitude grid", () => {
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

test("B7 V1 datasets preserve CL-102B provenance and baseline conditions", () => {
  for (const dataset of [f8, f20]) {
    assert.ok(dataset.sources?.some((source) => source.manualId === "CL-102B"));
    assert.ok(dataset.notes?.some((note) => /dry runway, zero wind, zero runway gradient, anti-ice off and anti-skid on/i.test(note)));
    assert.ok(dataset.notes?.some((note) => /Sparse high\/hot source regions are intentionally absent/i.test(note)));
  }
});

test("B7 Flaps 8 returns exact Sea Level source nodes", () => {
  assert.equal(value(f8, 0, -18, 18300), 136);
  assert.equal(value(f8, 0, 16, 15000), 115);
  assert.equal(value(f8, 0, -18, 10000), 103);
});

test("B7 Flaps 8 returns exact 1,000 and 2,000 ft source nodes", () => {
  assert.equal(value(f8, 1000, 16, 15000), 116);
  assert.equal(value(f8, 2000, 16, 15000), 117);
  assert.equal(value(f8, 1000, 38, 18000), 141);
  assert.equal(calculate(f8, 1000, 38, 18300).status, "unsupported");
});

test("B7 Flaps 8 returns exact published nodes beyond the low-altitude blocks", () => {
  assert.equal(value(f8, 3000, -18, 18300), 136);
  const result = calculate(f8, 6000, 16, 15000);
  assert.equal(result.status, "ready");
  assert.equal(result.method, "exact-source-row");
  assert.equal(value(f8, 6000, 16, 15000), 121);
});

test("B7 Flaps 20 returns exact source nodes including the published Sea Level 38°C row", () => {
  assert.equal(value(f20, 0, 16, 15000), 111);
  assert.equal(value(f20, 0, 16, 10000), 103);
  assert.equal(value(f20, 0, 16, 18300), 131);
  assert.equal(value(f20, 0, 38, 15000), 118);
  assert.equal(value(f20, 0, 38, 16000), 125);
  assert.equal(calculate(f20, 0, 38, 17000).status, "unsupported");
});

test("B7 Flaps 20 returns exact 1,000 and 2,000 ft source nodes", () => {
  assert.equal(value(f20, 1000, 16, 15000), 111);
  assert.equal(value(f20, 2000, 16, 15000), 111);
  assert.equal(value(f20, 1000, 38, 15000), 120);
  assert.equal(value(f20, 2000, 38, 15000), 123);
});

test("B7 performs bounded pressure-altitude interpolation", () => {
  const result = calculate(f8, 3500, -18, 15000);
  assert.equal(result.status, "ready");
  assert.equal(result.method, "bounded-linear-interpolation");
  assert.equal(value(f8, 3500, -18, 15000), 116.5);
});

test("B7 performs bounded temperature interpolation", () => {
  const result = calculate(f8, 0, 21.5, 15000);
  assert.equal(result.status, "ready");
  assert.equal(result.method, "bounded-linear-interpolation");
  assert.equal(value(f8, 0, 21.5, 15000), 116.5);
});

test("B7 performs bounded weight interpolation", () => {
  const result = calculate(f8, 0, 16, 14500);
  assert.equal(result.status, "ready");
  assert.equal(result.method, "bounded-linear-interpolation");
  assert.equal(value(f8, 0, 16, 14500), 112);
});

test("B7 1,300 ft FlightSafety baseline cross-check resolves to 116.3 KIAS before unmodeled corrections", () => {
  const result = calculate(f8, 1300, 16, 15000);
  assert.equal(result.status, "ready");
  assert.equal(result.method, "bounded-linear-interpolation");
  assert.ok(Math.abs((value(f8, 1300, 16, 15000) ?? 0) - 116.3) < 0.1);
});

test("B7 sparse exact high/hot source cells fail closed", () => {
  const result = calculate(f8, 7000, 38, 18300);
  assert.equal(result.status, "unsupported");
  assert.equal(result.metrics, undefined);
  assert.match(result.reason ?? "", /unavailable source corners|will not extrapolate/i);
});

test("B7 Flaps 20 sparse high/hot source cells fail closed", () => {
  const result = calculate(f20, 7000, 38, 15000);
  assert.equal(result.status, "unsupported");
  assert.equal(result.metrics, undefined);
});

test("B7 interpolation fails closed when any required sparse source corner is missing", () => {
  const result = calculate(f8, 6500, 32.5, 15000);
  assert.equal(result.status, "unsupported");
  assert.equal(result.metrics, undefined);
  assert.match(result.reason ?? "", /unavailable source corners|will not extrapolate/i);
});

test("B7 fails closed outside the published gross-weight envelope", () => {
  for (const grossWeight of [9000, 19000]) {
    const result = calculate(f8, 0, 16, grossWeight);
    assert.equal(result.status, "unsupported");
    assert.equal(result.metrics, undefined);
  }
});

test("B7 fails closed outside the published OAT envelope", () => {
  for (const oat of [-25, 45]) {
    const result = calculate(f8, 3000, oat, 15000);
    assert.equal(result.status, "unsupported");
    assert.equal(result.metrics, undefined);
  }
});

test("B7 fails closed outside the published pressure-altitude envelope", () => {
  for (const pressureAltitude of [-1, 12000]) {
    const result = calculate(f8, pressureAltitude, 16, 15000);
    assert.equal(result.status, "unsupported");
    assert.equal(result.metrics, undefined);
  }
});

test("B7 Flaps 8 and Flaps 20 remain distinct source datasets", () => {
  assert.notEqual(f8.id, f20.id);
  assert.equal(value(f8, 0, 16, 15000), 115);
  assert.equal(value(f20, 0, 16, 15000), 111);
});

test("B7 pilot summary returns source-backed V1 for both flap selections", () => {
  const f8Result = calculatePilotTakeoffSummary(datasets, definition, {
    pressureAltitude: 1000,
    oat: 16,
    takeoffWeight: 15000,
    flaps: "8",
    antiIce: false,
  });
  assert.equal(f8Result.v1.status, "ready");
  assert.equal(f8Result.v1.value, 116);

  const f20Result = calculatePilotTakeoffSummary(datasets, definition, {
    pressureAltitude: 1000,
    oat: 16,
    takeoffWeight: 15000,
    flaps: "20",
    antiIce: false,
  });
  assert.equal(f20Result.v1.status, "ready");
  assert.equal(f20Result.v1.value, 111);
});

test("B7 anti-ice ON does not fall through to the anti-ice OFF V1 grid", () => {
  for (const flaps of ["8", "20"]) {
    const result = calculatePilotTakeoffSummary(datasets, definition, {
      pressureAltitude: 1000,
      oat: 16,
      takeoffWeight: 15000,
      flaps,
      antiIce: true,
    });
    assert.equal(result.v1.status, "unavailable");
    assert.equal(result.v1.value, undefined);
    assert.match(result.v1.reason ?? "", /Anti-ice ON V1 data is not available/i);
  }
});

test("B7 bundled performance package registers both V1 source grids", () => {
  const pkg = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/performance/package.ts", import.meta.url),
    "utf8",
  );
  assert.match(pkg, /v1-flaps8\.json/);
  assert.match(pkg, /v1-flaps20\.json/);
  assert.match(pkg, /v1Flaps8/);
  assert.match(pkg, /v1Flaps20/);
});

test("B7 V1 bindings live in aircraft data while the generic performance engine stays aircraft-agnostic", () => {
  const engine = fs.readFileSync(new URL("../lib/performance-calculator.ts", import.meta.url), "utf8");
  const binding = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/performance/takeoff-calculator-definition.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(engine, /learjet/i);
  assert.doesNotMatch(engine, /flaps8|flaps20/i);
  assert.doesNotMatch(engine, /\bV1\b/);
  assert.match(binding, /learjet-35a-v1-flaps8/);
  assert.match(binding, /learjet-35a-v1-flaps20/);
});

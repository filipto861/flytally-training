import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { validateContentPayload } from "../lib/content-contracts.ts";
import { calculateMultiAxisMetricGrid } from "../lib/performance-calculator.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const dataset = JSON.parse(
  fs.readFileSync(new URL("../aircraft-data/learjet-35a/performance/landing-distance-flaps40.json", import.meta.url), "utf8"),
) as PerformanceDataset;

function calculate(pressureAltitude: number, oat: number, grossWeight: number) {
  return calculateMultiAxisMetricGrid(dataset, { pressureAltitude, oat, grossWeight });
}

function distance(pressureAltitude: number, oat: number, grossWeight: number): number | undefined {
  const result = calculate(pressureAltitude, oat, grossWeight);
  const value = result.metrics?.find((metric) => metric.key === "landingDistanceFt")?.value;
  return typeof value === "number" ? value : undefined;
}

test("B10 landing-distance dataset satisfies the governed multi-axis metric-grid contract", () => {
  const errors = validateContentPayload(
    "performance",
    { aircraftId: "learjet-35a", title: "Learjet 35A Performance", datasets: [dataset] },
    "learjet-35a",
  );
  assert.deepEqual(errors, []);
  assert.equal(dataset.kind, "lookup-table");
  assert.equal(dataset.phase, "landing");
  assert.equal(dataset.calculator?.kind, "multi-axis-metric-grid");
  if (dataset.calculator?.kind === "multi-axis-metric-grid") {
    assert.equal(dataset.calculator.operation, "landing");
    assert.deepEqual(dataset.calculator.inputAxes, ["pressureAltitude", "oat", "grossWeight"]);
    assert.deepEqual(dataset.calculator.outputKeys, ["landingDistanceFt"]);
  }
  assert.equal(dataset.interpolation, "linear-explicit");
});

test("B10 landing-distance axes match the published CL-102B grids", () => {
  assert.deepEqual(dataset.axes.find((axis) => axis.key === "pressureAltitude")?.values, [0, 2000, 4000, 6000, 8000, 10000]);
  assert.deepEqual(dataset.axes.find((axis) => axis.key === "oat")?.values, [-18, -7, 4, 16, 27, 38]);
  assert.deepEqual(dataset.axes.find((axis) => axis.key === "grossWeight")?.values, [10000, 11000, 12000, 13000, 14000, 15000, 15300]);
  assert.equal(dataset.rows.length, 227);
});

test("B10 landing-distance stores published FACTORED values directly", () => {
  assert.equal(dataset.outputs[0]?.key, "landingDistanceFt");
  assert.equal(dataset.outputs[0]?.unit, "FT");
  assert.ok(dataset.title.includes("Factored"));
  assert.ok(dataset.notes?.some((note) => /FACTORED landing-distance values are published directly/i.test(note)));
  assert.ok(dataset.rows.every((row) => typeof row.outputs.landingDistanceFt === "number"));
  assert.equal(dataset.outputs.some((output) => /actual/i.test(output.key)), false);
});

test("B10 landing-distance preserves CL-102B P-56/P-57/P-58 provenance and baseline conditions", () => {
  assert.deepEqual(dataset.sources?.map((source) => source.pageLabel), ["P-56", "P-57", "P-58"]);
  assert.ok(dataset.notes?.some((note) => /dry runway, zero wind, zero runway gradient, anti-ice off and anti-skid on/i.test(note)));
  assert.ok(dataset.notes?.some((note) => /Sparse high\/hot source regions are intentionally absent/i.test(note)));
});

test("B10 landing-distance returns exact source nodes across every pressure-altitude block", () => {
  assert.equal(distance(0, -18, 10000), 3680);
  assert.equal(distance(2000, 38, 15300), 5604);
  assert.equal(distance(4000, 38, 14000), 5412);
  assert.equal(distance(6000, 38, 13000), 5379);
  assert.equal(distance(8000, 16, 15300), 6232);
  assert.equal(distance(10000, 4, 15300), 6445);
});

test("B10 landing-distance fails closed for exact sparse high-hot cells", () => {
  for (const [pressureAltitude, oat, grossWeight] of [
    [4000, 38, 15000],
    [6000, 38, 14000],
    [8000, 27, 15000],
    [10000, 38, 15300],
  ] as const) {
    const result = calculate(pressureAltitude, oat, grossWeight);
    assert.equal(result.status, "unsupported", [pressureAltitude, oat, grossWeight].join("/"));
    assert.equal(result.metrics, undefined);
  }
});

test("B10 landing-distance performs bounded pressure-altitude interpolation", () => {
  const result = calculate(1000, 16, 15000);
  assert.equal(result.status, "ready");
  assert.equal(result.method, "bounded-linear-interpolation");
  assert.equal(distance(1000, 16, 15000), 5143.5);
});

test("B10 landing-distance performs bounded temperature interpolation", () => {
  const result = calculate(0, 21.5, 15000);
  assert.equal(result.status, "ready");
  assert.equal(result.method, "bounded-linear-interpolation");
  assert.equal(distance(0, 21.5, 15000), 5076);
});

test("B10 landing-distance performs bounded gross-weight interpolation", () => {
  const result = calculate(0, 16, 14500);
  assert.equal(result.status, "ready");
  assert.equal(result.method, "bounded-linear-interpolation");
  assert.equal(distance(0, 16, 14500), 4897.5);
});

test("B10 landing-distance interpolation fails closed when any required sparse corner is unpublished", () => {
  const result = calculate(3000, 32.5, 14500);
  assert.equal(result.status, "unsupported");
  assert.equal(result.metrics, undefined);
  assert.match(result.reason ?? "", /unavailable source corners|will not extrapolate/i);
});

test("B10 landing-distance fails closed outside the pressure-altitude envelope", () => {
  for (const pressureAltitude of [-1, 10001]) {
    assert.equal(calculate(pressureAltitude, 16, 13000).status, "unsupported");
  }
});

test("B10 landing-distance fails closed outside the OAT envelope", () => {
  for (const oat of [-19, 39]) {
    assert.equal(calculate(0, oat, 13000).status, "unsupported");
  }
});

test("B10 landing-distance fails closed outside the landing-weight envelope", () => {
  for (const grossWeight of [9999, 15301]) {
    assert.equal(calculate(0, 16, grossWeight).status, "unsupported");
  }
});

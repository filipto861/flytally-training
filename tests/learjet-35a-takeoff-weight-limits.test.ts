import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { validateContentPayload } from "../lib/content-contracts.ts";
import { calculateMultiAxisMetricGrid } from "../lib/performance-calculator.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const load = (file: string): PerformanceDataset => JSON.parse(
  fs.readFileSync(
    new URL(`../aircraft-data/learjet-35a/performance/${file}`, import.meta.url),
    "utf8",
  ),
) as PerformanceDataset;

const f8 = load("takeoff-weight-limit-flaps8.json");
const f20 = load("takeoff-weight-limit-flaps20.json");

function calculate(
  dataset: PerformanceDataset,
  pressureAltitude: number,
  oat: number,
) {
  return calculateMultiAxisMetricGrid(dataset, { pressureAltitude, oat });
}

function limit(
  dataset: PerformanceDataset,
  pressureAltitude: number,
  oat: number,
): number | undefined {
  return calculate(dataset, pressureAltitude, oat)
    .metrics?.find((metric) => metric.key === "maxTakeoffWeight")?.value as number | undefined;
}

test("PP.2 takeoff weight-limit datasets satisfy the governed metric-grid contract", () => {
  for (const dataset of [f8, f20]) {
    const errors = validateContentPayload(
      "performance",
      {
        aircraftId: "learjet-35a",
        title: "Learjet 35A Performance",
        datasets: [dataset],
      },
      "learjet-35a",
    );
    assert.deepEqual(errors, [], dataset.id);
    assert.equal(dataset.phase, "takeoff");
    assert.equal(dataset.calculator?.kind, "multi-axis-metric-grid");
    if (dataset.calculator?.kind === "multi-axis-metric-grid") {
      assert.deepEqual(dataset.calculator.inputAxes, ["pressureAltitude", "oat"]);
      assert.deepEqual(dataset.calculator.outputKeys, ["maxTakeoffWeight"]);
    }
    assert.equal(dataset.interpolation, "linear-explicit");
    assert.equal(dataset.rows.length, 62);
  }
});

test("PP.2 weight-limit grids preserve the CL-102B source axes and baseline conditions", () => {
  for (const dataset of [f8, f20]) {
    assert.deepEqual(
      dataset.axes.find((axis) => axis.key === "pressureAltitude")?.values,
      [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000],
    );
    assert.deepEqual(
      dataset.axes.find((axis) => axis.key === "oat")?.values,
      [-18, -7, 4, 16, 27, 38],
    );
    assert.ok(dataset.sources?.some((source) => source.manualId === "CL-102B"));
    assert.ok(dataset.notes?.some((note) =>
      /dry runway, zero wind, zero runway gradient, anti-ice off and anti-skid on/i.test(note),
    ));
  }
});

test("PP.2 Flaps 8 exact source nodes include the 18,300 lb continuation ceiling", () => {
  assert.equal(limit(f8, 0, 38), 18300);
  assert.equal(limit(f8, 7000, 16), 18300);
  assert.equal(limit(f8, 8000, 16), 17950);
  assert.equal(limit(f8, 9000, 27), 15400);
  assert.equal(limit(f8, 10000, 4), 17750);
  assert.equal(limit(f8, 10000, 16), 16800);
  assert.equal(limit(f8, 10000, 27), 14850);
});

test("PP.2 Flaps 20 exact source nodes preserve its distinct high/hot limits", () => {
  assert.equal(limit(f20, 0, 38), 16350);
  assert.equal(limit(f20, 3000, 27), 16850);
  assert.equal(limit(f20, 5000, 16), 17700);
  assert.equal(limit(f20, 8000, 4), 17700);
  assert.equal(limit(f20, 9000, 27), 13350);
  assert.equal(limit(f20, 10000, -7), 17850);
  assert.equal(limit(f20, 10000, 27), 12850);
});

test("PP.2 weight-limit grids perform bounded source interpolation", () => {
  const altitude = calculate(f8, 9500, 16);
  assert.equal(altitude.status, "ready");
  assert.equal(altitude.method, "bounded-linear-interpolation");
  assert.equal(limit(f8, 9500, 16), 17100);

  const temperature = calculate(f8, 10000, 10);
  assert.equal(temperature.status, "ready");
  assert.equal(temperature.method, "bounded-linear-interpolation");
  assert.equal(limit(f8, 10000, 10), 17275);

  const bilinear = calculate(f20, 5500, 21.5);
  assert.equal(bilinear.status, "ready");
  assert.equal(bilinear.method, "bounded-linear-interpolation");
  assert.equal(limit(f20, 5500, 21.5), 16400);
});

test("PP.2 blank high/hot source regions remain fail-closed", () => {
  for (const dataset of [f8, f20]) {
    assert.equal(calculate(dataset, 10000, 38).status, "unsupported");
    assert.equal(calculate(dataset, 9500, 32.5).status, "unsupported");
  }
});

test("PP.2 weight-limit grids never extrapolate beyond source altitude or temperature", () => {
  for (const dataset of [f8, f20]) {
    for (const pressureAltitude of [-1, 11000]) {
      assert.equal(calculate(dataset, pressureAltitude, 16).status, "unsupported");
    }
    for (const oat of [-25, 45]) {
      assert.equal(calculate(dataset, 3000, oat).status, "unsupported");
    }
  }
});

test("PP.2 Flaps 8 and Flaps 20 weight-limit schedules remain distinct", () => {
  assert.notEqual(f8.id, f20.id);
  assert.equal(limit(f8, 10000, 16), 16800);
  assert.equal(limit(f20, 10000, 16), 14500);
});

test("PP.2 bundled Learjet package registers both takeoff weight-limit grids", () => {
  const source = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/performance/package.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /takeoff-weight-limit-flaps8\.json/);
  assert.match(source, /takeoff-weight-limit-flaps20\.json/);
  assert.match(source, /takeoffWeightLimitFlaps8/);
  assert.match(source, /takeoffWeightLimitFlaps20/);
});

test("PP.2 weight-limit data remain aircraft-owned while generic interpolation stays aircraft-agnostic", () => {
  const engine = fs.readFileSync(
    new URL("../lib/performance-calculator.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(engine, /learjet/i);
  assert.doesNotMatch(engine, /partial.?power/i);
});

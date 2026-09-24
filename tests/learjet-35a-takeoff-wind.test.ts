import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { validateContentPayload } from "../lib/content-contracts.ts";
import {
  calculateMultiAxisMetricGrid,
  calculatePostBaselineTransform,
} from "../lib/performance-calculator.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const load = (file: string): PerformanceDataset => JSON.parse(
  fs.readFileSync(new URL(`../aircraft-data/learjet-35a/performance/${file}`, import.meta.url), "utf8"),
) as PerformanceDataset;

const distanceBaseline = load("takeoff-distance-flaps8.json");
const v1Baseline = load("v1-flaps8.json");
const distanceWind = load("takeoff-distance-wind-flaps8.json");
const v1Wind = load("v1-wind-flaps8.json");

function metric(
  dataset: PerformanceDataset,
  inputs: Readonly<Record<string, number>>,
  key: string,
): number {
  const result = calculateMultiAxisMetricGrid(dataset, inputs);
  assert.equal(result.status, "ready");
  const value = result.metrics?.find((candidate) => candidate.key === key)?.value;
  assert.equal(typeof value, "number");
  return value as number;
}

test("B6.1 Learjet Flaps 8 wind datasets satisfy the governed post-baseline transform contract", () => {
  for (const dataset of [distanceWind, v1Wind]) {
    const errors = validateContentPayload(
      "performance",
      { aircraftId: "learjet-35a", title: "Learjet 35A Performance", datasets: [dataset] },
      "learjet-35a",
    );
    assert.deepEqual(errors, [], dataset.id);
    assert.equal(dataset.phase, "takeoff");
    assert.equal(dataset.calculator?.kind, "post-baseline-transform");
    assert.equal(dataset.interpolation, "linear-explicit");
    assert.ok(dataset.sources?.some((source) => source.manualId === "FM-102"));
  }
});

test("B6.1 source notes preserve signed wind semantics and forbid double regulatory factoring", () => {
  for (const dataset of [distanceWind, v1Wind]) {
    assert.ok(dataset.notes?.some((note) => /tailwind negative, headwind positive/i.test(note)));
    assert.ok(dataset.notes?.some((note) => /50% headwind and 150% tailwind/i.test(note)));
    assert.ok(dataset.notes?.some((note) => /do not pre-factor/i.test(note)));
  }
});

test("B6.1 takeoff-distance wind transform returns exact graph-digitized source nodes", () => {
  const tailwind = calculatePostBaselineTransform(distanceWind, 5000, -10);
  assert.equal(tailwind.status, "ready");
  assert.equal(tailwind.method, "exact-source-row");
  assert.equal(tailwind.value, 6000);

  const headwind = calculatePostBaselineTransform(distanceWind, 5000, 30);
  assert.equal(headwind.status, "ready");
  assert.equal(headwind.value, 4100);
});

test("B6.1 V1 wind transform returns exact graph-digitized source nodes", () => {
  const tailwind = calculatePostBaselineTransform(v1Wind, 130, -10);
  assert.equal(tailwind.status, "ready");
  assert.equal(tailwind.value, 128);

  const headwind = calculatePostBaselineTransform(v1Wind, 130, 30);
  assert.equal(headwind.status, "ready");
  assert.equal(headwind.value, 132);
});

test("B6.1 zero wind is an explicit identity transform across multiple ordinates", () => {
  for (const baseline of [2000, 3500, 6000, 8500, 11000]) {
    const result = calculatePostBaselineTransform(distanceWind, baseline, 0);
    assert.equal(result.status, "ready");
    assert.equal(result.value, baseline);
  }

  for (const baseline of [103, 105, 120, 135, 142]) {
    const result = calculatePostBaselineTransform(v1Wind, baseline, 0);
    assert.equal(result.status, "ready");
    assert.equal(result.value, baseline);
  }
});

test("B6.1 bounded interpolation preserves independent headwind and tailwind branches", () => {
  const headwind = calculatePostBaselineTransform(distanceWind, 5250, 15);
  assert.equal(headwind.status, "ready");
  assert.equal(headwind.method, "bounded-linear-interpolation");
  assert.equal(headwind.value, 4775);

  const tailwind = calculatePostBaselineTransform(distanceWind, 5250, -5);
  assert.equal(tailwind.status, "ready");
  assert.equal(tailwind.method, "bounded-linear-interpolation");
  assert.equal(tailwind.value, 5550);

  const v1Headwind = calculatePostBaselineTransform(v1Wind, 117.5, 15);
  assert.equal(v1Headwind.status, "ready");
  assert.equal(v1Headwind.value, 118.5);
});

test("B6.1 FlightSafety worked example is reproduced within graphical chart-reading precision", () => {
  const zeroWindDistance = metric(
    distanceBaseline,
    { pressureAltitude: 1300, oat: 16, grossWeight: 15000 },
    "distance",
  );
  assert.ok(Math.abs(zeroWindDistance - 3699.5) < 0.1);

  const correctedDistance = calculatePostBaselineTransform(distanceWind, zeroWindDistance, 15);
  assert.equal(correctedDistance.status, "ready");
  assert.ok(Math.abs((correctedDistance.value ?? 0) - 3400) <= 100);

  const zeroWindV1 = metric(
    v1Baseline,
    { pressureAltitude: 1300, oat: 16, grossWeight: 15000 },
    "v1",
  );
  assert.ok(Math.abs(zeroWindV1 - 116.3) < 0.1);

  const correctedV1 = calculatePostBaselineTransform(v1Wind, zeroWindV1, 15);
  assert.equal(correctedV1.status, "ready");
  assert.ok(Math.abs((correctedV1.value ?? 0) - 118) <= 1);
});

test("B6.1 source caps and sparse high-distance tailwind regions remain fail-closed", () => {
  const v1LowerCap = calculatePostBaselineTransform(v1Wind, 103, -10);
  assert.equal(v1LowerCap.status, "ready");
  assert.equal(v1LowerCap.value, 103);

  const unavailableHighTailwind = calculatePostBaselineTransform(distanceWind, 10000, -10);
  assert.equal(unavailableHighTailwind.status, "unsupported");
  assert.equal(unavailableHighTailwind.value, undefined);

  const unavailableSparseInterpolation = calculatePostBaselineTransform(distanceWind, 9750, -5);
  assert.equal(unavailableSparseInterpolation.status, "unsupported");
  assert.equal(unavailableSparseInterpolation.value, undefined);

  const unavailableUpperV1 = calculatePostBaselineTransform(v1Wind, 142, 10);
  assert.equal(unavailableUpperV1.status, "unsupported");
  assert.equal(unavailableUpperV1.value, undefined);
});

test("B6.1 wind transforms never extrapolate beyond the published baseline or wind envelope", () => {
  for (const [baseline, wind] of [[1900, 0], [11100, 0], [5000, -11], [5000, 31]] as const) {
    const result = calculatePostBaselineTransform(distanceWind, baseline, wind);
    assert.equal(result.status, "unsupported");
    assert.equal(result.value, undefined);
  }

  for (const [baseline, wind] of [[102, 0], [143, 0], [120, -11], [120, 31]] as const) {
    const result = calculatePostBaselineTransform(v1Wind, baseline, wind);
    assert.equal(result.status, "unsupported");
    assert.equal(result.value, undefined);
  }
});

test("B6.1 package registers only verified Flaps 8 wind transforms; Flaps 20 remains blocked", () => {
  const pkgSource = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/performance/package.ts", import.meta.url),
    "utf8",
  );
  assert.match(pkgSource, /takeoff-distance-wind-flaps8\.json/);
  assert.match(pkgSource, /v1-wind-flaps8\.json/);
  assert.doesNotMatch(pkgSource, /wind-flaps20/i);
});

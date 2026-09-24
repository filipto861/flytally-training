import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { calculateMultiAxisMetricGrid } from "../lib/performance-calculator.ts";
import { normalizePressureAltitudeToSeaLevelFloor } from "../lib/performance/source-envelope.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const read = (path: string) =>
  fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");

const loadDataset = (file: string): PerformanceDataset => JSON.parse(
  read(`aircraft-data/learjet-35a/performance/${file}`),
) as PerformanceDataset;

test("PA floor maps negative derived pressure altitude to the published S.L. source floor", () => {
  assert.deepEqual(normalizePressureAltitudeToSeaLevelFloor(-100), {
    observedPressureAltitudeFt: -100,
    performancePressureAltitudeFt: 0,
    method: "sea-level-floor",
  });
});

test("PA floor leaves zero and positive pressure altitude unchanged", () => {
  assert.deepEqual(normalizePressureAltitudeToSeaLevelFloor(0), {
    observedPressureAltitudeFt: 0,
    performancePressureAltitudeFt: 0,
    method: "identity",
  });
  assert.deepEqual(normalizePressureAltitudeToSeaLevelFloor(7350), {
    observedPressureAltitudeFt: 7350,
    performancePressureAltitudeFt: 7350,
    method: "identity",
  });
});

test("PA floor rejects non-finite inputs instead of hiding a bad calculation", () => {
  assert.throws(
    () => normalizePressureAltitudeToSeaLevelFloor(Number.NaN),
    /finite/i,
  );
});

test("LFMN-like -100 ft PA can resolve N1, V1 and Takeoff Distance through the S.L. floor", () => {
  const pressureAltitudeFt =
    normalizePressureAltitudeToSeaLevelFloor(-100).performancePressureAltitudeFt;

  const n1 = calculateMultiAxisMetricGrid(
    loadDataset("takeoff-n1.json"),
    { oatC: 24, pressureAltitudeFt },
  );
  const v1 = calculateMultiAxisMetricGrid(
    loadDataset("v1-flaps8.json"),
    { pressureAltitude: pressureAltitudeFt, oat: 24, grossWeight: 15000 },
  );
  const distance = calculateMultiAxisMetricGrid(
    loadDataset("takeoff-distance-flaps8.json"),
    { pressureAltitude: pressureAltitudeFt, oat: 24, grossWeight: 15000 },
  );

  assert.equal(n1.status, "ready");
  assert.equal(v1.status, "ready");
  assert.equal(distance.status, "ready");

  assert.equal(n1.method, "bounded-linear-interpolation");
  assert.equal(v1.method, "bounded-linear-interpolation");
  assert.equal(distance.method, "bounded-linear-interpolation");
});

test("Takeoff controller keeps observed PA visible but feeds the S.L. floor into performance dependencies", () => {
  const controller = read("components/ft-performance/use-performance-operation.ts");
  const presentation = read("components/ft-performance/FtPerformancePresentation.tsx");

  assert.match(controller, /normalizePressureAltitudeToSeaLevelFloor/);
  assert.match(controller, /performancePressureAltitudeFt/);
  assert.match(
    controller,
    /pressureAltitudeFt: performancePressureAltitudeFt/,
  );
  assert.match(
    presentation,
    /Performance PA/,
  );
  assert.match(
    presentation,
    /S\.L\. chart floor/,
  );
});

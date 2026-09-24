import assert from "node:assert/strict";
import test from "node:test";

import {
  solveHighestAssumedTemperature,
  validateAssumedTemperatureSolverRequest,
  type AssumedTemperatureCandidate,
  type AssumedTemperatureSolverRequest,
} from "../lib/performance/assumed-temperature.ts";

const candidate = (
  temperature: number,
  performanceWeightLimit: number,
  correctedTakeoffDistance: number,
  v1 = 120,
  sourceDatasetIds: readonly string[] = ["weight-limit", "takeoff-distance", "v1"],
): AssumedTemperatureCandidate => ({
  temperature,
  performanceWeightLimit,
  correctedTakeoffDistance,
  v1,
  sourceDatasetIds,
});

const request = (
  overrides: Partial<AssumedTemperatureSolverRequest> = {},
): AssumedTemperatureSolverRequest => ({
  temperatureUnit: "F",
  distanceUnit: "FT",
  weightUnit: "LB",
  ambientTemperature: 50,
  takeoffWeight: 15000,
  ambientPerformanceWeightLimit: 18300,
  tora: 6000,
  asda: 5800,
  eligibilityChecks: [
    { key: "dry-hard-paved", label: "Dry hard-paved runway", satisfied: true },
    { key: "anti-ice-off", label: "Anti-ice OFF", satisfied: true },
    { key: "anti-skid-operative", label: "Anti-skid operative", satisfied: true },
    { key: "recent-full-rated", label: "Recent full-rated takeoff", satisfied: true },
  ],
  candidates: [
    candidate(60, 18000, 4300, 118),
    candidate(80, 17000, 5000, 121),
    candidate(100, 14900, 5700, 125),
  ],
  ...overrides,
});

test("PP.2 generic assumed-temperature contract rejects invalid operational inputs", () => {
  const errors = validateAssumedTemperatureSolverRequest(request({
    takeoffWeight: 0,
    tora: Number.NaN,
    candidates: [
      candidate(80, 17000, 5000, 121, []),
      candidate(80, 16000, 5100),
    ],
  }));

  assert.ok(errors.some((error) => /Takeoff weight/i.test(error)));
  assert.ok(errors.some((error) => /TORA/i.test(error)));
  assert.ok(errors.some((error) => /sourceDatasetIds/i.test(error)));
  assert.ok(errors.some((error) => /duplicates assumed temperature/i.test(error)));
});

test("PP.2 eligibility checks fail closed before selecting an assumed temperature", () => {
  const result = solveHighestAssumedTemperature(request({
    eligibilityChecks: [
      { key: "dry-hard-paved", label: "Dry hard-paved runway", satisfied: true },
      {
        key: "anti-ice-off",
        label: "Anti-ice OFF",
        satisfied: false,
        reason: "Reduced thrust is unavailable with anti-ice ON.",
      },
    ],
  }));

  assert.equal(result.status, "ineligible");
  if (result.status !== "ineligible") return;
  assert.deepEqual(result.failedChecks.map((check) => check.key), ["anti-ice-off"]);
});

test("PP.2 ambient performance weight limitation must cover actual takeoff weight", () => {
  const result = solveHighestAssumedTemperature(request({
    ambientPerformanceWeightLimit: 14900,
  }));

  assert.deepEqual(result, {
    status: "no-solution",
    reason: "ambient-weight-limit",
    usableTakeoffFieldLength: 5800,
  });
});

test("PP.2 usable takeoff field length is the lower of TORA and ASDA", () => {
  const result = solveHighestAssumedTemperature(request({
    tora: 5600,
    asda: 6200,
  }));

  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  assert.equal(result.usableTakeoffFieldLength, 5600);
  assert.equal(result.limitingDeclaredDistance, "TORA");

  const tied = solveHighestAssumedTemperature(request({
    tora: 6000,
    asda: 6000,
  }));
  assert.equal(tied.status, "ready");
  if (tied.status !== "ready") return;
  assert.equal(tied.limitingDeclaredDistance, "BOTH");
});

test("PP.2 solver selects the highest supplied candidate satisfying runway and weight constraints", () => {
  const result = solveHighestAssumedTemperature(request());

  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  assert.equal(result.assumedTemperature, 80);
  assert.equal(result.ambientTemperature, 50);
  assert.equal(result.assumedPerformanceWeightLimit, 17000);
  assert.equal(result.correctedTakeoffDistance, 5000);
  assert.equal(result.v1, 121);
});

test("PP.2 assumed-temperature weight limitation is independently enforced", () => {
  const result = solveHighestAssumedTemperature(request({
    candidates: [
      candidate(60, 18000, 4300),
      candidate(80, 14999, 4500),
      candidate(100, 14900, 4700),
    ],
  }));

  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  assert.equal(result.assumedTemperature, 60);
});

test("PP.2 runway limit is independently enforced after source-backed corrections", () => {
  const result = solveHighestAssumedTemperature(request({
    candidates: [
      candidate(60, 18000, 4300),
      candidate(80, 17000, 5900),
      candidate(100, 16000, 6100),
    ],
  }));

  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  assert.equal(result.assumedTemperature, 60);
  assert.equal(result.correctedTakeoffDistance, 4300);
});

test("PP.2 solver never treats ambient temperature as a reduced-thrust solution", () => {
  const result = solveHighestAssumedTemperature(request({
    candidates: [
      candidate(40, 18300, 4000),
      candidate(50, 18300, 4100),
    ],
  }));

  assert.deepEqual(result, {
    status: "no-solution",
    reason: "no-reduced-thrust-candidate",
    usableTakeoffFieldLength: 5800,
  });
});

test("PP.2 solver does not invent temperatures between supplied source-supported candidates", () => {
  const result = solveHighestAssumedTemperature(request({
    candidates: [
      candidate(60, 18000, 4300),
      candidate(100, 14900, 5700),
    ],
  }));

  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  assert.equal(result.assumedTemperature, 60);
  assert.notEqual(result.assumedTemperature, 80);
});

test("PP.2 ready result preserves the selected candidate source identity", () => {
  const result = solveHighestAssumedTemperature(request({
    candidates: [
      candidate(
        80,
        17000,
        5000,
        121,
        ["weight-limit-f8", "takeoff-distance-f8", "wind-distance-f8", "v1-f8", "wind-v1-f8"],
      ),
    ],
  }));

  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  assert.deepEqual(result.sourceDatasetIds, [
    "weight-limit-f8",
    "takeoff-distance-f8",
    "wind-distance-f8",
    "v1-f8",
    "wind-v1-f8",
  ]);
});

test("PP.2 generic solver source remains aircraft-agnostic", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(
    new URL("../lib/performance/assumed-temperature.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /learjet/i);
  assert.doesNotMatch(source, /aeronca|tr-?4000/i);
});

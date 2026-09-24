import assert from "node:assert/strict";
import test from "node:test";

import { learjet35aPerformancePackage } from "../aircraft-data/learjet-35a/performance/package.ts";
import { learjet35aTakeoffCalculatorDefinition } from "../aircraft-data/learjet-35a/performance/takeoff-calculator-definition.ts";
import {
  solveLearjet35aAssumedTemperature,
  type Learjet35aAssumedTemperatureRequest,
} from "../aircraft-data/learjet-35a/performance/partial-power-adapter.ts";
import { manualDeclaredDistanceFt } from "../lib/aviation/declared-distances.ts";

const datasets = learjet35aPerformancePackage.content.datasets;

function request(
  overrides: Partial<Learjet35aAssumedTemperatureRequest> = {},
): Learjet35aAssumedTemperatureRequest {
  return {
    pressureAltitudeFt: 0,
    ambientTemperatureC: 16,
    takeoffWeightLb: 15000,
    flaps: "8",
    runwayWindComponentKt: 0,
    declaredDistances: {
      tora: manualDeclaredDistanceFt(10000),
      asda: manualDeclaredDistanceFt(10000),
    },
    eligibility: {
      runwayDryHardPaved: true,
      antiIce: false,
      antiSkidOperative: true,
      fullRatedTakeoffWithin30Days: true,
    },
    ...overrides,
  };
}

function solve(
  overrides: Partial<Learjet35aAssumedTemperatureRequest> = {},
) {
  return solveLearjet35aAssumedTemperature(
    datasets,
    learjet35aTakeoffCalculatorDefinition,
    request(overrides),
  );
}

test("PP.2 Learjet adapter selects the highest source-axis assumed temperature at zero wind", () => {
  const result = solve();

  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;

  assert.equal(result.assumedTemperature, 38);
  assert.equal(result.ambientTemperature, 16);
  assert.equal(result.assumedPerformanceWeightLimit, 18300);
  assert.equal(result.correctedTakeoffDistance, 4663);
  assert.equal(result.v1, 122);
  assert.deepEqual(result.sourceDatasetIds, [
    "learjet-35a-takeoff-weight-limit-flaps8",
    "learjet-35a-takeoff-distance-flaps8",
    "learjet-35a-v1-flaps8",
    "learjet-35a-takeoff-distance-wind-flaps8",
    "learjet-35a-v1-wind-flaps8",
  ]);
});

test("PP.2 Learjet Flaps 8 candidate evaluation preserves B6 wind correction", () => {
  const result = solve({
    runwayWindComponentKt: 15,
    declaredDistances: {
      tora: manualDeclaredDistanceFt(4000),
      asda: manualDeclaredDistanceFt(4500),
    },
  });

  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;

  // The 38°C candidate exceeds the 4,000 ft usable limit after the B6
  // correction, while the 27°C candidate remains feasible.
  assert.equal(result.assumedTemperature, 27);
  assert.ok(result.correctedTakeoffDistance < 4000);
  assert.equal(result.v1, 119);
  assert.equal(result.usableTakeoffFieldLength, 4000);
  assert.equal(result.limitingDeclaredDistance, "TORA");
});

test("PP.2 Learjet adapter applies ambient and assumed-temperature weight limits independently", () => {
  const result = solve({
    flaps: "20",
    takeoffWeightLb: 17000,
    runwayWindComponentKt: 0,
  });

  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;

  // At sea level the Flaps 20 38°C weight limit is 16,350 lb, so the
  // 17,000 lb airplane must step down to the next source-supported candidate.
  assert.equal(result.assumedTemperature, 27);
  assert.equal(result.assumedPerformanceWeightLimit, 18300);
});

test("PP.2 Learjet Flaps 20 nonzero wind remains fail-closed without a verified wind source", () => {
  const result = solve({
    flaps: "20",
    runwayWindComponentKt: 10,
  });

  assert.equal(result.status, "unsupported");
  if (result.status !== "unsupported") return;
  assert.match(result.reason, /No source-backed nonzero-wind.*Flaps 20/i);
});

test("PP.2 Learjet Flaps 20 zero wind can use the governed baseline", () => {
  const result = solve({
    flaps: "20",
    runwayWindComponentKt: 0,
  });

  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  assert.equal(result.assumedTemperature, 38);
  assert.equal(result.correctedTakeoffDistance, 4410);
  assert.equal(result.v1, 118);
  assert.deepEqual(result.sourceDatasetIds, [
    "learjet-35a-takeoff-weight-limit-flaps20",
    "learjet-35a-takeoff-distance-flaps20",
    "learjet-35a-v1-flaps20",
  ]);
});

test("PP.2 Learjet adapter requires both TORA and ASDA", () => {
  const result = solve({
    declaredDistances: {
      tora: manualDeclaredDistanceFt(10000),
    },
  });

  assert.equal(result.status, "unsupported");
  if (result.status !== "unsupported") return;
  assert.match(result.reason, /missing ASDA/i);
});

test("PP.2 Learjet adapter propagates explicit operational eligibility checks", () => {
  const result = solve({
    eligibility: {
      runwayDryHardPaved: true,
      antiIce: true,
      antiSkidOperative: true,
      fullRatedTakeoffWithin30Days: true,
    },
  });

  assert.equal(result.status, "ineligible");
  if (result.status !== "ineligible") return;
  assert.deepEqual(
    result.failedChecks.map((check) => check.key),
    ["anti-ice-off"],
  );
});

test("PP.2 Learjet adapter fails closed outside the ambient weight-limit source region", () => {
  const result = solve({
    pressureAltitudeFt: 10000,
    ambientTemperatureC: 38,
  });

  assert.equal(result.status, "unsupported");
  if (result.status !== "unsupported") return;
  assert.match(result.reason, /Ambient takeoff-weight limitation.*outside/i);
});

test("PP.2 Learjet adapter does not expose reduced N1 while source semantics remain unresolved", () => {
  const result = solve();

  assert.equal(result.status, "ready");
  assert.equal("n1" in result, false);
  assert.equal("reducedN1" in result, false);
});

test("PP.2 Learjet-specific source identities stay outside the generic assumed-temperature runtime", async () => {
  const { readFile } = await import("node:fs/promises");
  const generic = await readFile(
    new URL("../lib/performance/assumed-temperature.ts", import.meta.url),
    "utf8",
  );
  const adapter = await readFile(
    new URL("../aircraft-data/learjet-35a/performance/partial-power-adapter.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(generic, /learjet|flaps8|flaps20/i);
  assert.match(adapter, /learjet-35a-takeoff-weight-limit-flaps8/);
  assert.match(adapter, /learjet-35a-takeoff-weight-limit-flaps20/);
  assert.match(adapter, /No source-backed nonzero-wind Partial Power correction/);
});

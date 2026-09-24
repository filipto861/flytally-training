import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";
import type { PartialPowerN1SourceExtract } from "../lib/performance/partial-power-source.ts";
import { learjet35aTakeoffCalculatorDefinition } from "../aircraft-data/learjet-35a/performance/takeoff-calculator-definition.ts";
import {
  evaluateLearjet35aAeroncaPartialPower,
  type Learjet35aAssumedTemperatureRequest,
} from "../aircraft-data/learjet-35a/performance/partial-power-adapter.ts";
import { manualDeclaredDistanceFt } from "../lib/aviation/declared-distances.ts";

const loadDataset = (file: string): PerformanceDataset => JSON.parse(
  fs.readFileSync(
    new URL(`../aircraft-data/learjet-35a/performance/${file}`, import.meta.url),
    "utf8",
  ),
) as PerformanceDataset;

const loadExtract = (file: string): PartialPowerN1SourceExtract => JSON.parse(
  fs.readFileSync(
    new URL(
      `../aircraft-data/learjet-35a/performance/source-extracts/${file}`,
      import.meta.url,
    ),
    "utf8",
  ),
) as PartialPowerN1SourceExtract;

const datasets: readonly PerformanceDataset[] = [
  loadDataset("takeoff-n1-aeronca.json"),
  loadDataset("takeoff-weight-limit-flaps8.json"),
  loadDataset("takeoff-weight-limit-flaps20.json"),
  loadDataset("takeoff-distance-flaps8.json"),
  loadDataset("takeoff-distance-flaps20.json"),
  loadDataset("v1-flaps8.json"),
  loadDataset("v1-flaps20.json"),
  loadDataset("takeoff-distance-wind-flaps8.json"),
  loadDataset("v1-wind-flaps8.json"),
];

const aeronca = loadExtract("partial-power-n1-aeronca.json");
const noReversers = loadExtract("partial-power-n1-no-reversers.json");

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

function evaluate(
  overrides: Partial<Learjet35aAssumedTemperatureRequest> = {},
) {
  return evaluateLearjet35aAeroncaPartialPower(
    datasets,
    learjet35aTakeoffCalculatorDefinition,
    aeronca,
    request(overrides),
  );
}

test("PP.3 Aeronca integration uses configuration-specific P-5.1 full-rated N1", () => {
  const result = evaluate();

  assert.equal(result.status, "source-supported");
  if (result.status !== "source-supported") return;

  assert.equal(result.assumedTemperature, 38);
  assert.equal(result.fullRatedN1, 94.5);
  assert.equal(result.reducedN1, 88.0);
  assert.equal(result.n1ReductionPoints, 6.5);
  assert.equal(result.n1Method, "exact-source-cell");
  assert.equal(result.n1SourcePageLabel, "P-6.1");
  assert.equal(result.thrustReversers, "aeronca");
});

test("PP.3 Aeronca integration steps down when the P-6.1 7.7-point N1 reduction limit binds", () => {
  const result = evaluate({
    pressureAltitudeFt: 2000,
  });

  assert.equal(result.status, "source-supported");
  if (result.status !== "source-supported") return;

  assert.equal(result.fullRatedN1, 96.4);
  assert.equal(result.assumedTemperature, 36);
  assert.ok(Math.abs(result.reducedN1 - 88.736) < 1e-9);
  assert.ok(result.n1ReductionPoints <= 7.7);
  assert.ok(result.n1ReductionPoints > 7.6);
});

test("PP.3 Aeronca integration can use AFMS-authorized bounded N1 interpolation for ambient temperature", () => {
  const result = evaluate({
    ambientTemperatureC: 12,
  });

  assert.equal(result.status, "source-supported");
  if (result.status !== "source-supported") return;

  assert.equal(result.assumedTemperature, 38);
  assert.equal(result.n1Method, "bounded-source-interpolation");
  assert.deepEqual(result.n1InterpolationAuthority, {
    manualId: "AFMS-W1072",
    figure: "5",
    configuration: "aeronca",
  });
  assert.ok(Math.abs(result.reducedN1 - 87.488) < 1e-9);
  assert.ok(Math.abs(result.fullRatedN1 - 93.73333333333333) < 1e-9);
});

test("PP.3 Aeronca reduced-N1 interpolation follows a non-node assumed temperature", () => {
  const result = evaluate({
    pressureAltitudeFt: 2000,
  });

  assert.equal(result.status, "source-supported");
  if (result.status !== "source-supported") return;

  assert.equal(result.assumedTemperature, 36);
  assert.equal(result.n1Method, "bounded-source-interpolation");
  assert.deepEqual(result.n1InterpolationAuthority, {
    manualId: "AFMS-W1072",
    figure: "5",
    configuration: "aeronca",
  });
});

test("PP.3 Aeronca integration preserves PP.2 operational eligibility gating", () => {
  const result = evaluate({
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

test("PP.3 Aeronca integration rejects a non-Aeronca reduced-N1 source schedule", () => {
  const result = evaluateLearjet35aAeroncaPartialPower(
    datasets,
    learjet35aTakeoffCalculatorDefinition,
    noReversers,
    request(),
  );

  assert.equal(result.status, "unsupported");
  if (result.status !== "unsupported") return;
  assert.match(result.reason, /requires the Aeronca reduced-N1 source schedule/i);
});

test("PP.3 Aeronca integration remains explicitly non-operational", () => {
  const result = evaluate();

  assert.equal(result.status, "source-supported");
  if (result.status !== "source-supported") return;

  assert.equal(result.operationalUseBlocked, true);
  assert.deepEqual(result.operationalBlockers, [
    "rated-thrust-reduction-25-percent-unresolved",
  ]);
  assert.equal("status" in result, true);
  assert.notEqual(result.status, "ready");
});

test("PP.3 Aeronca integration preserves PP.2 runway/wind/source provenance", () => {
  const result = evaluate({
    runwayWindComponentKt: 15,
    declaredDistances: {
      tora: manualDeclaredDistanceFt(4000),
      asda: manualDeclaredDistanceFt(4500),
    },
  });

  assert.equal(result.status, "source-supported");
  if (result.status !== "source-supported") return;

  assert.equal(result.usableTakeoffFieldLength, 4000);
  assert.equal(result.limitingDeclaredDistance, "TORA");
  assert.ok(result.correctedTakeoffDistance <= 4000);
  assert.ok(result.sourceDatasetIds.includes("learjet-35a-takeoff-distance-wind-flaps8"));
  assert.ok(result.sourceDatasetIds.includes("learjet-35a-v1-wind-flaps8"));
  assert.equal(result.n1SourceExtractId, aeronca.id);
});

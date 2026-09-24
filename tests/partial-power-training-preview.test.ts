import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { learjet35aPerformancePackage } from "../aircraft-data/learjet-35a/performance/package.ts";
import { manualDeclaredDistanceFt } from "../lib/aviation/declared-distances.ts";
import {
  evaluatePartialPowerTrainingPreview,
  type PartialPowerTrainingPreviewRequest,
} from "../lib/performance/partial-power-training-preview.ts";

const definition = learjet35aPerformancePackage.takeoffCalculator;
if (!definition) throw new Error("Learjet takeoff calculator definition is required by this test.");

function request(
  overrides: Partial<PartialPowerTrainingPreviewRequest> = {},
): PartialPowerTrainingPreviewRequest {
  return {
    aircraftId: "learjet-35a",
    datasets: learjet35aPerformancePackage.content.datasets,
    definition,
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
    thrustReversers: "aeronca",
    ...overrides,
  };
}

test("PP.4 training preview exposes the existing Aeronca source-supported result without promoting it to ready", () => {
  const result = evaluatePartialPowerTrainingPreview(request());

  assert.equal(result.status, "source-supported");
  if (result.status !== "source-supported") return;

  assert.equal(result.assumedTemperature, 38);
  assert.equal(result.fullRatedN1, 94.5);
  assert.equal(result.reducedN1, 88);
  assert.equal(result.operationalUseBlocked, true);
  assert.deepEqual(result.operationalBlockers, [
    "rated-thrust-reduction-25-percent-unresolved",
  ]);
});

test("PP.4 training preview requires explicit thrust-reverser configuration", () => {
  const result = evaluatePartialPowerTrainingPreview(request({
    thrustReversers: "unknown",
  }));

  assert.equal(result.status, "unsupported");
  if (result.status !== "unsupported") return;
  assert.match(result.reason, /select the installed thrust-reverser configuration/i);
});

test("PP.4 training preview keeps unsupported N1 schedules fail-closed", () => {
  for (const thrustReversers of ["none", "tr4000"] as const) {
    const result = evaluatePartialPowerTrainingPreview(request({ thrustReversers }));
    assert.equal(result.status, "unsupported", thrustReversers);
  }
});

test("PP.4 training preview preserves operational eligibility checks", () => {
  const result = evaluatePartialPowerTrainingPreview(request({
    eligibility: {
      runwayDryHardPaved: true,
      antiIce: false,
      antiSkidOperative: false,
      fullRatedTakeoffWithin30Days: true,
    },
  }));

  assert.equal(result.status, "ineligible");
  if (result.status !== "ineligible") return;
  assert.deepEqual(result.failedChecks.map((check) => check.key), [
    "anti-skid-operative",
  ]);
});

test("PP.4 controller defaults to Full Rated and never persists a Partial Power preview as an operational snapshot", () => {
  const source = fs.readFileSync(
    new URL("../components/ft-performance/use-performance-operation.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /useState<TakeoffThrustMode>\("full-rated"\)/);

  const partialStart = source.indexOf('if (thrustMode === "partial-power")');
  const operationalWrite = source.indexOf("const observation = weather.observation", partialStart);
  assert.ok(partialStart >= 0);
  assert.ok(operationalWrite > partialStart);

  const partialBranch = source.slice(partialStart, operationalWrite);
  assert.match(partialBranch, /evaluatePartialPowerTrainingPreview/);
  assert.match(partialBranch, /setPartialPowerPreview/);
  assert.doesNotMatch(partialBranch, /writeTakeoffPerformanceResultV2/);
  assert.match(partialBranch, /return;/);
});

test("PP.4 pilot UI makes Partial Power explicit and visibly non-operational", () => {
  const source = fs.readFileSync(
    new URL("../components/ft-performance/FtPerformancePresentation.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Takeoff thrust mode/);
  assert.match(source, />Full Rated</);
  assert.match(source, />Partial Power \/ Assumed Temperature</);
  assert.match(source, /SOURCE-SUPPORTED TRAINING PREVIEW/);
  assert.match(source, /not operationally accepted/i);
  assert.match(source, /maximum 25% rated-takeoff-thrust reduction check/i);
});

import assert from "node:assert/strict";
import test from "node:test";

import { learjet3536CompleteLimitations, learjet3536CompletePerformance } from "../lib/learjet-pilot-data.ts";
import { staticTrainingContentSeed } from "../lib/static-content-repository.ts";
import { validateUniversalTrainingContentPayload } from "../lib/universal-aircraft-content.ts";

const JAYDEE = "jaydee-learjet-35a-checklist-v1-35-wip1";
const CAE = "cae-simuflite-learjet-35-36-crh-feb-2007";
const FSI = "fsi-learjet-35-36-ptm-r1-1";

function dataset(id: string) {
  const value = learjet3536CompletePerformance.datasets.find((item) => item.id === id);
  assert.ok(value, `missing performance dataset ${id}`);
  return value;
}

test("Learjet pilot performance payload is broad and validates against the universal contract", () => {
  assert.ok(learjet3536CompletePerformance.datasets.length >= 20);
  assert.deepEqual(validateUniversalTrainingContentPayload("performance", learjet3536CompletePerformance), []);
});

test("Learjet pilot limitations payload validates and preserves source/configuration distinctions", () => {
  assert.deepEqual(validateUniversalTrainingContentPayload("limitations", learjet3536CompleteLimitations), []);
  assert.ok(learjet3536CompleteLimitations.groups.some((group) => group.id === "cae-century-iii-fc200-airspeeds"));
  assert.ok(learjet3536CompleteLimitations.groups.some((group) => group.id === "cae-rvsm-fc530-overspeed-reference"));
  assert.ok(learjet3536CompleteLimitations.groups.some((group) => group.id === "jaydee-35a-engine-limits"));
});

test("JayDee supplementary takeoff table is complete and never interpolated", () => {
  const value = dataset("jaydee-takeoff-speeds");
  assert.equal(value.rows.length, 12);
  assert.equal(value.interpolation, "none");
  assert.deepEqual(value.applicability?.variants, ["35A"]);
  assert.ok(value.sources?.every((source) => source.manualId === JAYDEE));

  const row = value.rows.find((candidate) => candidate.inputs.grossWeight === 18000 && candidate.inputs.flaps === 8);
  assert.deepEqual(row?.outputs, { vr: 142, v2: 145 });
});

test("JayDee VREF and maximum-continuous tables retain every published quick-reference row", () => {
  const vref = dataset("jaydee-landing-vref");
  const maxContinuous = dataset("jaydee-max-continuous-n1");
  assert.equal(vref.rows.length, 9);
  assert.equal(maxContinuous.rows.length, 10);
  assert.equal(vref.rows.find((row) => row.inputs.grossWeight === 15000)?.outputs.vref, 128);
  assert.equal(maxContinuous.rows.find((row) => row.inputs.altitude === 45000)?.outputs.n1, 96.4);
});

test("primary training performance remains source-bound instead of being merged into simulator values", () => {
  const takeoffPlanning = dataset("fsi-takeoff-planning-sequence");
  const climbSegments = dataset("fsi-climb-segment-requirements");
  assert.ok(takeoffPlanning.sources?.every((source) => source.manualId === FSI));
  assert.ok(climbSegments.sources?.every((source) => source.manualId === FSI));

  const caeGroup = learjet3536CompleteLimitations.groups.find((group) => group.id === "cae-century-iii-fc200-airspeeds");
  assert.ok(caeGroup?.sources?.every((source) => source.manualId === CAE));
});

test("static governed seed promotes the comprehensive performance and limitation modules", () => {
  const performance = staticTrainingContentSeed.nativeModules?.find((module) => module.domain === "performance");
  const limitations = staticTrainingContentSeed.nativeModules?.find((module) => module.domain === "limitations");
  assert.equal(performance?.payload, learjet3536CompletePerformance);
  assert.equal(limitations?.payload, learjet3536CompleteLimitations);
});

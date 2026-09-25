import assert from "node:assert/strict";
import test from "node:test";

import {
  learjet35aQrhEmergencyBatch5,
  learjet35aQrhEmergencyBatch5ReleaseStatus,
} from "../aircraft-data/learjet-35a/qrh/emergency-batch-5.ts";
import {
  filterAbnormalEmergencyForConfiguration,
  type AircraftConfiguration,
} from "../lib/aircraft-applicability.ts";
import {
  type AircraftQrhStep,
  validateUniversalAbnormalEmergencyPayload,
} from "../lib/universal-abnormal-emergency.ts";

function configuration(
  serialNumber: string | undefined,
  amk76: "installed" | "not-installed" | "unknown" = "unknown",
  amk78: "installed" | "not-installed" | "unknown" = "unknown",
): AircraftConfiguration {
  return {
    variant: "source-review",
    serialNumber,
    equipment: new Set<string>(),
    modifications: new Map([
      ["amk-76-7", amk76],
      ["amk-78-13", amk78],
    ]),
  };
}

function scenarioStages(serialNumber: string, amk76: "installed" | "not-installed" | "unknown", amk78: "installed" | "not-installed" | "unknown", scenarioId: string) {
  const filtered = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhEmergencyBatch5,
    configuration(serialNumber, amk76, amk78),
  );
  return filtered.scenarios.find((scenario) => scenario.id === scenarioId)?.stages.map((stage) => stage.id) ?? [];
}

function flatten(steps: readonly AircraftQrhStep[]): AircraftQrhStep[] {
  return steps.flatMap((step) =>
    step.kind === "condition"
      ? [step, ...step.branches.flatMap((branch) => flatten(branch.steps))]
      : [step],
  );
}

test("QRH.3F serial/AMK Emergency batch satisfies the generic v2 contract", () => {
  assert.equal(learjet35aQrhEmergencyBatch5ReleaseStatus, "staged-source-review");
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(learjet35aQrhEmergencyBatch5), []);
  assert.deepEqual(
    learjet35aQrhEmergencyBatch5.scenarios.map((scenario) => scenario.id),
    ["bleed-air-light", "cabin-cockpit-fire-smoke-fumes"],
  );
});

test("QRH.3F BLEED AIR LIGHT selects the exact E-20 source family without AMK inference", () => {
  assert.deepEqual(scenarioStages("35-050", "not-installed", "unknown", "bleed-air-light"), ["bleed-air-e20"]);
  assert.deepEqual(scenarioStages("35-050", "installed", "unknown", "bleed-air-light"), ["bleed-air-e20-1"]);
  assert.deepEqual(scenarioStages("35-050", "unknown", "unknown", "bleed-air-light"), []);
  assert.deepEqual(scenarioStages("35-082", "unknown", "unknown", "bleed-air-light"), ["bleed-air-e20-1"]);
  assert.deepEqual(scenarioStages("35-100", "unknown", "unknown", "bleed-air-light"), ["bleed-air-e20-1"]);
  assert.deepEqual(scenarioStages("35-107", "unknown", "unknown", "bleed-air-light"), ["bleed-air-e20-2"]);
  assert.deepEqual(scenarioStages("35-108", "unknown", "unknown", "bleed-air-light"), ["bleed-air-e20-1"]);
  assert.deepEqual(scenarioStages("35-113", "unknown", "unknown", "bleed-air-light"), ["bleed-air-e20-2"]);
  assert.deepEqual(scenarioStages("36-032", "unknown", "unknown", "bleed-air-light"), ["bleed-air-e20-2"]);
});

test("QRH.3F fire procedure preserves independent E-22 and E-23 effectivity families", () => {
  assert.deepEqual(
    scenarioStages("35-100", "unknown", "not-installed", "cabin-cockpit-fire-smoke-fumes"),
    ["fire-e22", "fire-e23", "fire-e24"],
  );
  assert.deepEqual(
    scenarioStages("35-100", "unknown", "installed", "cabin-cockpit-fire-smoke-fumes"),
    ["fire-e22", "fire-e23-1", "fire-e24"],
  );
  assert.deepEqual(
    scenarioStages("35-150", "unknown", "not-installed", "cabin-cockpit-fire-smoke-fumes"),
    ["fire-e22-1", "fire-e23", "fire-e24"],
  );
  assert.deepEqual(
    scenarioStages("35-150", "unknown", "installed", "cabin-cockpit-fire-smoke-fumes"),
    ["fire-e22-1", "fire-e23-1", "fire-e24"],
  );
  assert.deepEqual(
    scenarioStages("35-203", "unknown", "unknown", "cabin-cockpit-fire-smoke-fumes"),
    ["fire-e22-1", "fire-e23-1", "fire-e24"],
  );
  assert.deepEqual(
    scenarioStages("35-205", "unknown", "not-installed", "cabin-cockpit-fire-smoke-fumes"),
    ["fire-e22-1", "fire-e23", "fire-e24"],
  );
  assert.deepEqual(
    scenarioStages("35-205", "unknown", "installed", "cabin-cockpit-fire-smoke-fumes"),
    ["fire-e22-1", "fire-e23-1", "fire-e24"],
  );
});

test("QRH.3F prior-aircraft fire effectivity fails closed when AMK 78-13 state is unknown", () => {
  const filtered = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhEmergencyBatch5,
    configuration("35-100", "unknown", "unknown"),
  );
  assert.equal(
    filtered.scenarios.some((scenario) => scenario.id === "cabin-cockpit-fire-smoke-fumes"),
    false,
  );

  const noSerial = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhEmergencyBatch5,
    configuration(undefined, "unknown", "not-installed"),
  );
  assert.equal(noSerial.scenarios.length, 0);
});

test("QRH.3F visual source review marks only CABIN/COCKPIT FIRE steps 1 through 3 as memory", () => {
  const fire = learjet35aQrhEmergencyBatch5.scenarios.find(
    (scenario) => scenario.id === "cabin-cockpit-fire-smoke-fumes",
  );
  assert.ok(fire);

  for (const stageId of ["fire-e22", "fire-e22-1"]) {
    const stage = fire.stages.find((candidate) => candidate.id === stageId);
    assert.ok(stage);
    const memory = flatten(stage.steps as readonly AircraftQrhStep[])
      .filter((step) => step.kind === "action" && step.memoryItem === true)
      .map((step) => step.label);
    assert.deepEqual(memory, ["1", "2", "3"]);
  }

  const bleed = learjet35aQrhEmergencyBatch5.scenarios.find(
    (scenario) => scenario.id === "bleed-air-light",
  );
  assert.ok(bleed);
  assert.equal(JSON.stringify(bleed).includes('"memoryItem":true'), false);
  assert.equal(
    fire.stages
      .filter((stage) => stage.id === "fire-e23" || stage.id === "fire-e23-1" || stage.id === "fire-e24")
      .some((stage) => JSON.stringify(stage).includes('"memoryItem":true')),
    false,
  );
});

test("QRH.3F preserves source-specific electrical bus lists and the common E-24 continuation", () => {
  const serialized = JSON.stringify(learjet35aQrhEmergencyBatch5);
  assert.match(serialized, /R ESS BUS/);
  assert.match(serialized, /R ESS A BUS/);
  assert.match(serialized, /R ESS B BUS/);
  assert.match(serialized, /EMER BAT or EMER PWR Switch\(es\) — OFF/);
  assert.match(serialized, /Standby Attitude Gyro — CAGE, then UNCAGE to erect/);
  assert.match(serialized, /35-202 thru 35-204, 35-206 & on/);
  assert.match(serialized, /prior aircraft incorporating AMK 78-13/);
});

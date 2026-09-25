import assert from "node:assert/strict";
import test from "node:test";

import {
  learjet35aQrhEmergencyBatch6,
  learjet35aQrhEmergencyBatch6ReleaseStatus,
  learjet35aQrhThrustReverserConfigurationKeys,
} from "../aircraft-data/learjet-35a/qrh/emergency-batch-6.ts";
import {
  filterAbnormalEmergencyForConfiguration,
  type AircraftConfiguration,
} from "../lib/aircraft-applicability.ts";
import {
  type AircraftQrhStep,
  validateUniversalAbnormalEmergencyPayload,
} from "../lib/universal-abnormal-emergency.ts";

function configuration(
  aeronca: "installed" | "not-installed" | "unknown",
  tr4000: "installed" | "not-installed" | "unknown",
): AircraftConfiguration {
  return {
    variant: "source-review",
    equipment: new Set<string>(),
    configurationEquipment: new Map([
      [learjet35aQrhThrustReverserConfigurationKeys.aeronca, aeronca],
      [learjet35aQrhThrustReverserConfigurationKeys.tr4000, tr4000],
    ]),
  };
}

function flatten(steps: readonly AircraftQrhStep[]): AircraftQrhStep[] {
  return steps.flatMap((step) =>
    step.kind === "condition"
      ? [step, ...step.branches.flatMap((branch) => flatten(branch.steps))]
      : [step],
  );
}

test("QRH.3G thrust-reverser Emergency batch satisfies the generic v2 contract", () => {
  assert.equal(learjet35aQrhEmergencyBatch6ReleaseStatus, "staged-source-review");
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(learjet35aQrhEmergencyBatch6), []);
  assert.deepEqual(
    learjet35aQrhEmergencyBatch6.scenarios.map((scenario) => scenario.id),
    [
      "inadvertent-thrust-reverser-deployment-during-takeoff",
      "indication-of-thrust-reverser-deployment-during-takeoff",
    ],
  );
});

test("QRH.3G Aeronca configuration receives only the E-35 source path", () => {
  const filtered = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhEmergencyBatch6,
    configuration("installed", "not-installed"),
  );
  assert.deepEqual(
    filtered.scenarios.map((scenario) => [
      scenario.id,
      scenario.stages.map((stage) => stage.id),
    ]),
    [[
      "inadvertent-thrust-reverser-deployment-during-takeoff",
      ["aeronca-below-v1", "aeronca-above-v1"],
    ]],
  );
});

test("QRH.3G TR-4000 configuration preserves the split indexed E-35.1 procedures", () => {
  const filtered = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhEmergencyBatch6,
    configuration("not-installed", "installed"),
  );
  assert.deepEqual(
    filtered.scenarios.map((scenario) => [
      scenario.id,
      scenario.stages.map((stage) => stage.id),
    ]),
    [
      [
        "inadvertent-thrust-reverser-deployment-during-takeoff",
        ["tr4000-below-v1"],
      ],
      [
        "indication-of-thrust-reverser-deployment-during-takeoff",
        ["tr4000-above-v1"],
      ],
    ],
  );
});

test("QRH.3G unknown, absent or contradictory thrust-reverser identity fails closed", () => {
  for (const candidate of [
    configuration("unknown", "unknown"),
    configuration("not-installed", "not-installed"),
    configuration("installed", "installed"),
  ]) {
    const filtered = filterAbnormalEmergencyForConfiguration(
      learjet35aQrhEmergencyBatch6,
      candidate,
    );
    assert.equal(filtered.scenarios.length, 0);
  }

  const absent: AircraftConfiguration = {
    variant: "source-review",
    equipment: new Set<string>(),
  };
  assert.equal(
    filterAbnormalEmergencyForConfiguration(
      learjet35aQrhEmergencyBatch6,
      absent,
    ).scenarios.length,
    0,
  );
});

test("QRH.3G E-35 Aeronca boxed-memory boundaries are exact", () => {
  const scenario = learjet35aQrhEmergencyBatch6.scenarios.find(
    (candidate) => candidate.id === "inadvertent-thrust-reverser-deployment-during-takeoff",
  );
  assert.ok(scenario);

  const below = scenario.stages.find((stage) => stage.id === "aeronca-below-v1");
  const above = scenario.stages.find((stage) => stage.id === "aeronca-above-v1");
  assert.ok(below);
  assert.ok(above);

  assert.deepEqual(
    flatten(below.steps as readonly AircraftQrhStep[])
      .filter((step) => step.kind === "action" && step.memoryItem === true)
      .map((step) => step.kind === "action" ? step.label : undefined),
    ["1", "2", "3"],
  );
  assert.deepEqual(
    flatten(above.steps as readonly AircraftQrhStep[])
      .filter((step) => step.kind === "action" && step.memoryItem === true)
      .map((step) => step.kind === "action" ? step.label : undefined),
    ["1", "2", "3", "4", "5", "6", "7"],
  );
  assert.equal(
    JSON.stringify(above).includes('"aeronca-above-8","kind":"action","label":"8","text":"Thrust Lever (affected engine) — CUTOFF","memoryItem":true'),
    false,
  );
});

test("QRH.3G E-35.1 TR-4000 boxed-memory boundary includes the step-8 condition and action", () => {
  const scenario = learjet35aQrhEmergencyBatch6.scenarios.find(
    (candidate) => candidate.id === "indication-of-thrust-reverser-deployment-during-takeoff",
  );
  assert.ok(scenario);
  const stage = scenario.stages[0];
  assert.ok(stage);

  const flattened = flatten(stage.steps as readonly AircraftQrhStep[]);
  assert.deepEqual(
    flattened
      .filter((step) => step.kind === "action" && step.memoryItem === true)
      .map((step) => step.kind === "action" ? step.label : undefined),
    ["1", "2", "3", "4", "5", "6", "7", undefined],
  );

  const condition = stage.steps.find(
    (step) => step.kind === "condition" && step.id === "tr4000-above-deploy-stays-on",
  );
  assert.ok(condition && condition.kind === "condition");
  assert.equal(condition.branches[0]?.memoryItem, true);
});

test("QRH.3G preserves source differences instead of normalizing Aeronca and TR-4000", () => {
  const serialized = JSON.stringify(learjet35aQrhEmergencyBatch6);
  assert.match(serialized, /Emer Stow Switch — EMER STOW/);
  assert.match(serialized, /Thrust Reverser Control Switches — OFF/);
  assert.match(serialized, /If UNLOCK or DEPLOY lights stay on/);
  assert.match(serialized, /8\. If DEPLOY light stays on/);
  assert.match(serialized, /Abnormal Checklist/);
  assert.match(serialized, /Tab 5, this section/);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  learjet35aQrhEmergencyBatch4,
  learjet35aQrhEmergencyBatch4DeferredEffectivity,
  learjet35aQrhEmergencyBatch4ReleaseStatus,
} from "../aircraft-data/learjet-35a/qrh/emergency-batch-4.ts";
import {
  type AircraftQrhStep,
  validateUniversalAbnormalEmergencyPayload,
} from "../lib/universal-abnormal-emergency.ts";

function flatten(steps: readonly AircraftQrhStep[]): AircraftQrhStep[] {
  return steps.flatMap((step) =>
    step.kind === "condition"
      ? [step, ...step.branches.flatMap((branch) => flatten(branch.steps))]
      : [step],
  );
}

test("QRH.3D ALL-aircraft emergency batch satisfies the generic v2 contract", () => {
  assert.equal(learjet35aQrhEmergencyBatch4ReleaseStatus, "staged-source-review");
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(learjet35aQrhEmergencyBatch4), []);
  assert.equal(learjet35aQrhEmergencyBatch4.scenarios.length, 12);
  assert.ok(
    learjet35aQrhEmergencyBatch4.scenarios.every(
      (scenario) => scenario.effectivity.kind === "all-aircraft" && scenario.effectivity.sourceText === "ALL",
    ),
  );
});

test("QRH.3D keeps serial/AMK-specific E-20 and E-22/E-23 families fail-closed", () => {
  assert.deepEqual(
    learjet35aQrhEmergencyBatch4DeferredEffectivity.map((item) => item.id),
    ["bleed-air-light", "cabin-cockpit-fire-smoke-fumes"],
  );
  const ids = new Set(learjet35aQrhEmergencyBatch4.scenarios.map((scenario) => scenario.id));
  assert.equal(ids.has("bleed-air-light"), false);
  assert.equal(ids.has("cabin-cockpit-fire-smoke-fumes"), false);
});

test("QRH.3D Emergency Descent memory box is exactly steps 1 through 8", () => {
  const scenario = learjet35aQrhEmergencyBatch4.scenarios.find(
    (candidate) => candidate.id === "cabin-altitude-warning-emergency-descent",
  );
  assert.ok(scenario);
  const steps = flatten(scenario.stages[0]!.steps as readonly AircraftQrhStep[]);
  assert.deepEqual(
    steps.filter((step) => step.kind === "action" && step.memoryItem === true).map((step) => step.id),
    ["ed-1", "ed-2", "ed-3", "ed-4", "ed-5", "ed-6", "ed-7", "ed-8"],
  );
});

test("QRH.3D preserves boxed memory boundaries across flight-control procedures", () => {
  const byId = new Map(learjet35aQrhEmergencyBatch4.scenarios.map((scenario) => [scenario.id, scenario] as const));
  const memoryActions = (scenarioId: string) => {
    const scenario = byId.get(scenarioId);
    assert.ok(scenario);
    return scenario.stages
      .flatMap((stage) => flatten(stage.steps as readonly AircraftQrhStep[]))
      .filter((step) => step.kind === "action" && step.memoryItem === true)
      .map((step) => step.id);
  };

  assert.deepEqual(memoryActions("overspeed-recovery"), [
    "overspeed-1", "overspeed-2", "overspeed-3", "overspeed-4", "overspeed-5", "overspeed-6",
  ]);
  assert.deepEqual(memoryActions("pitch-axis-malfunction"), [
    "pitch-1", "pitch-2", "pitch-3a", "pitch-3b", "pitch-4", "pitch-5", "pitch-6",
  ]);
  assert.deepEqual(memoryActions("roll-or-yaw-axis-malfunction"), [
    "roll-yaw-1", "roll-yaw-2", "roll-yaw-3", "roll-yaw-4",
  ]);
});

test("QRH.3D preserves emergency braking, evacuation, stall and aborted-takeoff memory boxes", () => {
  const byId = new Map(learjet35aQrhEmergencyBatch4.scenarios.map((scenario) => [scenario.id, scenario] as const));
  const memoryActions = (scenarioId: string) => {
    const scenario = byId.get(scenarioId);
    assert.ok(scenario);
    return scenario.stages
      .flatMap((stage) => flatten(stage.steps as readonly AircraftQrhStep[]))
      .filter((step) => step.kind === "action" && step.memoryItem === true)
      .map((step) => step.id);
  };

  assert.deepEqual(memoryActions("emergency-braking"), ["emergency-braking-1", "emergency-braking-2"]);
  assert.deepEqual(memoryActions("emergency-evacuation"), [
    "evac-1", "evac-2", "evac-3", "evac-4a", "evac-4b", "evac-4c", "evac-4d", "evac-5",
  ]);
  assert.deepEqual(memoryActions("stall-warning-activates"), ["stall-1", "stall-2", "stall-3", "stall-4"]);
  assert.deepEqual(memoryActions("aborted-takeoff"), ["abort-1", "abort-2", "abort-3"]);
});

test("QRH.3D preserves source-defined operational information without inventing memory semantics", () => {
  const serialized = JSON.stringify(learjet35aQrhEmergencyBatch4);
  assert.match(serialized, /Anti-skid protection is not available during emergency braking/);
  assert.match(serialized, /Best Glide Speed/);
  assert.match(serialized, /2 nm per 1000 feet/);
  assert.match(serialized, /DO NOT OPEN LOWER HALF OF CABIN DOOR/);

  for (const id of ["control-system-jam", "fuel-press-light", "ditching", "landing-both-engines-inop"]) {
    const scenario = learjet35aQrhEmergencyBatch4.scenarios.find((candidate) => candidate.id === id);
    assert.ok(scenario);
    assert.equal(JSON.stringify(scenario).includes('"memoryItem":true'), false);
  }
});

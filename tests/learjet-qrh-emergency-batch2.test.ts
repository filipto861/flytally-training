import assert from "node:assert/strict";
import test from "node:test";

import {
  learjet35aQrhEmergencyBatch2,
  learjet35aQrhEmergencyBatch2Deferred,
  learjet35aQrhEmergencyBatch2ReleaseStatus,
} from "../aircraft-data/learjet-35a/qrh/emergency-batch-2.ts";
import {
  type AircraftQrhConditionBranch,
  type AircraftQrhStep,
  validateUniversalAbnormalEmergencyPayload,
} from "../lib/universal-abnormal-emergency.ts";
import { toOperationalEmergency } from "../lib/operational-flight-data.ts";

test("QRH.3B staged engine emergency batch satisfies the generic v2 contract", () => {
  assert.equal(learjet35aQrhEmergencyBatch2ReleaseStatus, "staged-source-review");
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(learjet35aQrhEmergencyBatch2), []);
  assert.equal(learjet35aQrhEmergencyBatch2.scenarios.length, 2);
  assert.deepEqual(
    learjet35aQrhEmergencyBatch2.scenarios.map((scenario) => scenario.effectivity),
    [
      { kind: "all-aircraft", sourceText: "ALL" },
      { kind: "all-aircraft", sourceText: "ALL" },
    ],
  );
});

test("QRH.3B Engine Fire preserves the exact boxed-memory boundary without styling the alternate branch as memory", () => {
  const engineFire = learjet35aQrhEmergencyBatch2.scenarios.find(
    (scenario) => scenario.id === "engine-fire-shutdown",
  );
  assert.ok(engineFire);

  const condition = engineFire.stages[0]?.steps[1];
  assert.equal(condition?.kind, "condition");
  if (!condition || condition.kind !== "condition") assert.fail("Engine Fire condition missing");

  const branches = condition.branches as readonly AircraftQrhConditionBranch[];
  const longFire = branches.find((branch) => branch.id === "engine-fire-more-than-15");
  const shortFire = branches.find((branch) => branch.id === "engine-fire-less-than-15");
  assert.ok(longFire);
  assert.ok(shortFire);
  assert.equal(longFire.memoryItem, true);
  assert.equal(shortFire.memoryItem, undefined);

  assert.deepEqual(
    (longFire.steps as readonly AircraftQrhStep[])
      .filter((step) => step.kind === "action" && step.memoryItem === true)
      .map((step) => step.id),
    ["engine-fire-2a", "engine-fire-2b", "engine-fire-2c"],
  );
  assert.equal(engineFire.stages[0]?.steps[0]?.kind, "action");
  const first = engineFire.stages[0]?.steps[0];
  assert.equal(first?.kind === "action" ? first.memoryItem : undefined, true);
});

test("QRH.3B branch-level memory semantics survive operational projection", () => {
  const operational = toOperationalEmergency(learjet35aQrhEmergencyBatch2);
  const engineFire = operational.scenarios.find((scenario) => scenario.id === "engine-fire-shutdown");
  const condition = engineFire?.stages[0]?.steps[1];
  assert.equal(condition?.kind, "condition");
  if (!condition || condition.kind !== "condition") assert.fail("Projected condition missing");
  assert.equal(condition.branches[0]?.memoryItem, true);
  assert.equal(condition.branches[1]?.memoryItem, undefined);
});

test("QRH.3B Oil Pressure keeps all three source decision branches", () => {
  const oil = learjet35aQrhEmergencyBatch2.scenarios.find(
    (scenario) => scenario.id === "oil-pressure-lights",
  );
  assert.ok(oil);
  const condition = oil.stages[0]?.steps[2];
  assert.equal(condition?.kind, "condition");
  if (!condition || condition.kind !== "condition") assert.fail("Oil-pressure condition missing");

  assert.deepEqual(
    condition.branches.map((branch) => branch.label),
    [
      "3. Oil pressure is less than 25 psi",
      "Oil pressure is between 25 & 38 psi or oil temperature is high",
      "Oil pressure & oil temperature are normal",
    ],
  );
});

test("QRH.3B fails closed on the graphical E-13 Airstart Envelope instead of flattening chart geometry", () => {
  assert.deepEqual(learjet35aQrhEmergencyBatch2Deferred, [
    {
      id: "airstart-envelope",
      title: "AIRSTART ENVELOPE",
      pageLabel: "E-13",
      reason:
        "The source contains a graphical operating envelope whose geometry cannot be represented by the current textual QRH step contract without loss. Keep fail-closed until generic source-figure support is defined.",
    },
  ]);
  assert.equal(
    (learjet35aQrhEmergencyBatch2.scenarios as readonly { readonly id: string }[]).some(
      (scenario) => scenario.id === "airstart-envelope",
    ),
    false,
  );
});

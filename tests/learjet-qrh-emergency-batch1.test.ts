import assert from "node:assert/strict";
import test from "node:test";

import {
  learjet35aQrhEmergencyBatch1,
  learjet35aQrhEmergencyBatch1ReleaseStatus,
} from "../aircraft-data/learjet-35a/qrh/emergency-batch-1.ts";
import { learjet35aChecklistSourceManifest } from "../aircraft-data/learjet-35a/checklists/source-manifest.ts";
import { validateUniversalAbnormalEmergencyPayload } from "../lib/universal-abnormal-emergency.ts";

test("QRH.3A staged Learjet Emergency batch satisfies the generic v2 contract", () => {
  assert.equal(learjet35aQrhEmergencyBatch1ReleaseStatus, "staged-source-review");
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(learjet35aQrhEmergencyBatch1), []);
  assert.equal(learjet35aQrhEmergencyBatch1.schemaVersion, 2);
  assert.equal(learjet35aQrhEmergencyBatch1.sourcePolicy, "available-sources");
  assert.equal(learjet35aQrhEmergencyBatch1.scenarios.length, 4);
  assert.equal("training" in learjet35aQrhEmergencyBatch1.scenarios[0], false);
  for (const scenario of learjet35aQrhEmergencyBatch1.scenarios) assert.equal("training" in scenario, false);
});

test("QRH.3A source identity remains the reviewed CL-102B Change 2 family", () => {
  const serialized = JSON.stringify(learjet35aQrhEmergencyBatch1);
  assert.match(serialized, new RegExp(learjet35aChecklistSourceManifest.manualId));
  assert.match(serialized, /"pageLabel":"E-i"/);
  assert.match(serialized, /"pageLabel":"E-4"/);
  assert.match(serialized, /"pageLabel":"E-5"/);
  assert.match(serialized, /"pageLabel":"E-9–E-10"/);
  assert.match(serialized, /"pageLabel":"E-10"/);
  assert.match(serialized, /"pageLabel":"E-11"/);
  assert.match(
    learjet35aQrhEmergencyBatch1.disclaimer ?? "",
    /AFM takes precedence/i,
  );
});

test("QRH.3A Door Light preserves both source branches without inferred aircraft applicability", () => {
  const door = learjet35aQrhEmergencyBatch1.scenarios.find(
    (scenario) => scenario.id === "door-light",
  );
  assert.ok(door);
  assert.equal(door.procedureClass, "emergency");
  assert.equal(door.category, "Doors");
  assert.deepEqual(door.effectivity, { kind: "all-aircraft", sourceText: "ALL" });
  assert.equal(door.applicability, undefined);

  const step = door.stages[0]?.steps[0];
  assert.equal(step?.kind, "condition");
  if (!step || step.kind !== "condition") assert.fail("Door Light branch step missing");

  assert.deepEqual(
    step.branches.map((branch) => branch.label),
    [
      "If light was accompanied by evidence of door failure",
      "If light was not accompanied by evidence of door failure",
    ],
  );
  assert.equal(step.branches[0]?.steps[0]?.kind, "action");
  assert.equal(step.branches[0]?.steps[0]?.id, "door-failure-do-not-approach");
  assert.equal(step.branches[1]?.steps.at(-1)?.id, "door-no-failure-continue");
});

test("QRH.3A Engine Failure memory flags match the boxed source presentation", () => {
  const engine = learjet35aQrhEmergencyBatch1.scenarios.find(
    (scenario) => scenario.id === "engine-failure",
  );
  assert.ok(engine);
  assert.deepEqual(engine.effectivity, { kind: "all-aircraft", sourceText: "ALL" });

  const byId = new Map(engine.stages.map((stage) => [stage.id, stage] as const));
  const memoryIds = (stageId: string) =>
    (byId.get(stageId)?.steps ?? [])
      .filter((step) => step.kind === "action" && step.memoryItem)
      .map((step) => step.id);

  assert.deepEqual(memoryIds("engine-failure-takeoff-below-v1"), [
    "engine-failure-below-v1-1",
    "engine-failure-below-v1-2",
    "engine-failure-below-v1-3",
  ]);
  assert.deepEqual(memoryIds("engine-failure-takeoff-above-v1"), [
    "engine-failure-above-v1-1",
    "engine-failure-above-v1-2",
    "engine-failure-above-v1-3",
    "engine-failure-above-v1-4",
    "engine-failure-above-v1-5",
  ]);
  assert.deepEqual(memoryIds("engine-failure-in-flight"), []);
  assert.deepEqual(memoryIds("engine-failure-during-approach"), [
    "engine-failure-approach-1",
    "engine-failure-approach-2",
    "engine-failure-approach-3",
    "engine-failure-approach-4",
  ]);

  const below = byId.get("engine-failure-takeoff-below-v1")?.steps;
  const above = byId.get("engine-failure-takeoff-above-v1")?.steps;
  assert.equal(below?.[3]?.kind === "action" ? below[3].memoryItem : undefined, undefined);
  assert.equal(above?.[5]?.kind === "action" ? above[5].memoryItem : undefined, undefined);
  assert.equal(above?.[6]?.kind === "action" ? above[6].memoryItem : undefined, undefined);
});

test("QRH.3A section guidance is source-backed and the partial batch is not mislabeled complete", () => {
  const intro = learjet35aQrhEmergencyBatch1.sectionIntroductions?.[0];
  assert.ok(intro);
  assert.equal(intro.procedureClass, "emergency");
  assert.equal(intro.sources[0]?.pageLabel, "E-i");
  assert.match(intro.paragraphs.join(" "), /Maintain Airplane Control/);
  assert.match(intro.paragraphs.join(" "), /Analyze the Situation/);
  assert.match(intro.paragraphs.join(" "), /Take Proper Action/);
  assert.match(learjet35aQrhEmergencyBatch1.sourceNote ?? "", /Partial QRH\.3/);
  assert.match(learjet35aQrhEmergencyBatch1.sourceNote ?? "", /Not a complete publishable/);
});

test("QRH.3A Electrical procedures preserve informational source text without recasting it as crew actions", () => {
  const inverter = learjet35aQrhEmergencyBatch1.scenarios.find(
    (scenario) => scenario.id === "ac-inverter-failure-total",
  );
  const generator = learjet35aQrhEmergencyBatch1.scenarios.find(
    (scenario) => scenario.id === "generator-failure-dual",
  );
  assert.ok(inverter);
  assert.ok(generator);

  const inverterSerialized = JSON.stringify(inverter);
  assert.match(inverterSerialized, /"kind":"information","label":"8"/);
  assert.match(inverterSerialized, /Vertical & Directional Gyros/);

  const generatorSerialized = JSON.stringify(generator);
  assert.match(generatorSerialized, /"kind":"information","label":"a","text":"Engine response will be much slower\."/);
  assert.match(generatorSerialized, /Fully charged batteries should power minimum equipment/);
  assert.match(generatorSerialized, /Aircraft without Fuselage Valve Switch/);
  assert.match(generatorSerialized, /Aircraft with Fuselage Valve Switch/);
});

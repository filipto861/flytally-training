import assert from "node:assert/strict";
import test from "node:test";

import {
  learjet35aQrhAbnormalBatch2,
  learjet35aQrhAbnormalBatch2ReleaseStatus,
} from "../aircraft-data/learjet-35a/qrh/abnormal-batch-2.ts";
import {
  filterAbnormalEmergencyForConfiguration,
  type AircraftConfiguration,
} from "../lib/aircraft-applicability.ts";
import {
  type AircraftQrhStep,
  validateUniversalAbnormalEmergencyPayload,
} from "../lib/universal-abnormal-emergency.ts";

function configuration(serialNumber?: string): AircraftConfiguration {
  return {
    variant: "source-review",
    serialNumber,
    equipment: new Set<string>(),
  };
}

function flatten(steps: readonly AircraftQrhStep[]): AircraftQrhStep[] {
  return steps.flatMap((step) =>
    step.kind === "condition"
      ? [step, ...step.branches.flatMap((branch) => flatten(branch.steps))]
      : [step],
  );
}

test("QRH.3I Electrical Abnormal batch satisfies the generic v2 contract", () => {
  assert.equal(learjet35aQrhAbnormalBatch2ReleaseStatus, "staged-source-review");
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(learjet35aQrhAbnormalBatch2), []);
  assert.deepEqual(
    learjet35aQrhAbnormalBatch2.scenarios.map((scenario) => scenario.title),
    [
      "GENERATOR FAILURE (SINGLE)",
      "INVERTER FAILURE — PARTIAL AC POWER LOSS",
    ],
  );
  assert.ok(
    learjet35aQrhAbnormalBatch2.scenarios.every(
      (scenario) => scenario.procedureClass === "abnormal" && scenario.category === "Electrical",
    ),
  );
});

test("QRH.3I generator page provenance follows the exact early/late serial family", () => {
  const select = (serialNumber: string) =>
    filterAbnormalEmergencyForConfiguration(
      learjet35aQrhAbnormalBatch2,
      configuration(serialNumber),
    ).scenarios.find((scenario) => scenario.id === "generator-failure-single")?.stages.map((stage) => stage.id) ?? [];

  assert.deepEqual(select("35-106"), ["generator-single-a9"]);
  assert.deepEqual(select("35-107"), ["generator-single-a9-1"]);
  assert.deepEqual(select("35-108"), ["generator-single-a9"]);
  assert.deepEqual(select("35-113"), ["generator-single-a9-1"]);
  assert.deepEqual(select("36-031"), ["generator-single-a9"]);
  assert.deepEqual(select("36-032"), ["generator-single-a9-1"]);

  const noSerial = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhAbnormalBatch2,
    configuration(),
  );
  assert.equal(
    noSerial.scenarios.some((scenario) => scenario.id === "generator-failure-single"),
    false,
  );
});

test("QRH.3I A-10 inverter procedure remains ALL-aircraft without serial inference", () => {
  const filtered = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhAbnormalBatch2,
    configuration(),
  );
  assert.deepEqual(
    filtered.scenarios.map((scenario) => scenario.id),
    ["inverter-failure-partial-ac-power-loss"],
  );
});

test("QRH.3I preserves nested generator and inverter failure branches", () => {
  for (const scenario of learjet35aQrhAbnormalBatch2.scenarios) {
    const conditions = scenario.stages.flatMap((stage) =>
      flatten(stage.steps as readonly AircraftQrhStep[]),
    ).filter((step) => step.kind === "condition");
    assert.ok(conditions.length >= 1);
  }

  const generator = learjet35aQrhAbnormalBatch2.scenarios.find(
    (scenario) => scenario.id === "generator-failure-single",
  );
  assert.ok(generator);
  assert.ok(
    flatten(generator.stages[0].steps as readonly AircraftQrhStep[])
      .filter((step) => step.kind === "condition").length >= 2,
  );
});

test("QRH.3I preserves source-significant electrical text", () => {
  const serialized = JSON.stringify(learjet35aQrhAbnormalBatch2);
  assert.match(serialized, /Turbine Speed \(N2\) — 80% or ABOVE/);
  assert.match(serialized, /Start-Gen Switch — OFF then GEN/);
  assert.match(serialized, /Aux Inverter \(if installed\) — FAILED BUS \(L or R\)/);
  assert.match(serialized, /If CB opens after resetting, leave it open/);
  assert.match(serialized, /FAILURE OF AUXILIARY INVERTER SYSTEM \(IF INSTALLED\)/);
});

test("QRH.3I visual review found no boxed memory items on A-9/A-9.1 or A-10", () => {
  assert.equal(
    JSON.stringify(learjet35aQrhAbnormalBatch2).includes('"memoryItem":true'),
    false,
  );
});

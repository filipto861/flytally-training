import assert from "node:assert/strict";
import test from "node:test";

import {
  learjet35aQrhAbnormalBatch3,
  learjet35aQrhAbnormalBatch3ReleaseStatus,
} from "../aircraft-data/learjet-35a/qrh/abnormal-batch-3.ts";
import {
  filterAbnormalEmergencyForConfiguration,
  type AircraftConfiguration,
} from "../lib/aircraft-applicability.ts";
import {
  type AircraftQrhStep,
  validateUniversalAbnormalEmergencyPayload,
} from "../lib/universal-abnormal-emergency.ts";

function configuration(): AircraftConfiguration {
  return {
    variant: "source-review",
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

test("QRH.3J Engine Abnormal batch satisfies the generic v2 contract", () => {
  assert.equal(learjet35aQrhAbnormalBatch3ReleaseStatus, "staged-source-review");
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(learjet35aQrhAbnormalBatch3), []);
  assert.deepEqual(
    learjet35aQrhAbnormalBatch3.scenarios.map((scenario) => scenario.title),
    [
      "ABNORMAL ENGINE OPERATION",
      "FUEL CMPTR LIGHT",
      "ENG CHIP LIGHT",
      "ENGINE OVERSPEED",
      "ENGINE SHUTDOWN IN FLIGHT",
      "STARTER ENGAGED LIGHT REMAINS ILLUMINATED",
    ],
  );
  assert.ok(
    learjet35aQrhAbnormalBatch3.scenarios.every(
      (scenario) => scenario.procedureClass === "abnormal" && scenario.category === "Engine",
    ),
  );
});

test("QRH.3J all six A-11 through A-13 Engine procedures are ALL-aircraft", () => {
  const filtered = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhAbnormalBatch3,
    configuration(),
  );
  assert.equal(filtered.scenarios.length, 6);
  assert.ok(
    learjet35aQrhAbnormalBatch3.scenarios.every(
      (scenario) => scenario.effectivity.kind === "all-aircraft",
    ),
  );
});

test("QRH.3J preserves page-level provenance across A-11, A-12 and A-13", () => {
  const pages = new Map(
    learjet35aQrhAbnormalBatch3.scenarios.map((scenario) => [
      scenario.id,
      scenario.sources?.map((item) => item.pageLabel),
    ]),
  );
  assert.deepEqual(pages.get("abnormal-engine-operation"), ["A-11"]);
  assert.deepEqual(pages.get("fuel-comptr-light"), ["A-11"]);
  assert.deepEqual(pages.get("eng-chip-light"), ["A-12"]);
  assert.deepEqual(pages.get("engine-overspeed"), ["A-12"]);
  assert.deepEqual(pages.get("engine-shutdown-in-flight"), ["A-12"]);
  assert.deepEqual(pages.get("starter-engaged-light-remains-illuminated"), ["A-13"]);
});

test("QRH.3J preserves source decision branches without flattening them", () => {
  const ids = [
    "abnormal-engine-operation",
    "fuel-comptr-light",
    "engine-overspeed",
    "starter-engaged-light-remains-illuminated",
  ];

  for (const id of ids) {
    const scenario = learjet35aQrhAbnormalBatch3.scenarios.find(
      (candidate) => candidate.id === id,
    );
    assert.ok(scenario);
    const conditions = scenario.stages.flatMap((stage) =>
      flatten(stage.steps as readonly AircraftQrhStep[]),
    ).filter((step) => step.kind === "condition");
    assert.ok(conditions.length >= 1);
  }

  const starter = learjet35aQrhAbnormalBatch3.scenarios.find(
    (scenario) => scenario.id === "starter-engaged-light-remains-illuminated",
  );
  assert.ok(starter);
  const starterConditions = starter.stages.flatMap((stage) =>
    flatten(stage.steps as readonly AircraftQrhStep[]),
  ).filter((step) => step.kind === "condition");
  assert.ok(starterConditions.length >= 2);
});

test("QRH.3J preserves source-significant Engine wording", () => {
  const serialized = JSON.stringify(learjet35aQrhAbnormalBatch3);
  assert.match(serialized, /Fuel Computer — OFF then ON \(50% to 60% N1\)/);
  assert.match(serialized, /Jet Pump — ON \(Steady N1 ≥ 80%\)/);
  assert.match(serialized, /Do not set affected engine Fuel Computer Switch OFF/);
  assert.match(serialized, /Crossflow Valve — OPEN, CROSSFLOW AS REQ’D/);
  assert.match(serialized, /GENERATOR FAILURE \(SINGLE\) procedure, Tab 3, this section/);
});

test("QRH.3J visual review does not mistake A-11 Change 1 bars for memory boxes", () => {
  assert.equal(
    JSON.stringify(learjet35aQrhAbnormalBatch3).includes('"memoryItem":true'),
    false,
  );
  assert.match(
    learjet35aQrhAbnormalBatch3.sourceNote ?? "",
    /vertical change bars are revision marks, not memory-item boxes/,
  );
});

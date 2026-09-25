import assert from "node:assert/strict";
import test from "node:test";

import {
  learjet35aQrhAbnormalBatch6,
  learjet35aQrhAbnormalBatch6ReleaseStatus,
  learjet35aQrhFuelConfigurationKeys,
} from "../aircraft-data/learjet-35a/qrh/abnormal-batch-6.ts";
import {
  filterAbnormalEmergencyForConfiguration,
  type AircraftConfiguration,
} from "../lib/aircraft-applicability.ts";
import {
  type AircraftQrhStep,
  validateUniversalAbnormalEmergencyPayload,
} from "../lib/universal-abnormal-emergency.ts";

function configuration(
  fuselageValveSwitch?: "installed" | "not-installed" | "unknown",
): AircraftConfiguration {
  return {
    variant: "source-review",
    equipment: new Set<string>(),
    ...(fuselageValveSwitch
      ? {
          configurationEquipment: new Map([
            [
              learjet35aQrhFuelConfigurationKeys.fuselageValveSwitch,
              fuselageValveSwitch,
            ],
          ]),
        }
      : {}),
  };
}

function flatten(steps: readonly AircraftQrhStep[]): AircraftQrhStep[] {
  return steps.flatMap((step) =>
    step.kind === "condition"
      ? [step, ...step.branches.flatMap((branch) => flatten(branch.steps))]
      : [step],
  );
}

test("QRH.3M Fuel Abnormal batch satisfies the generic v2 contract", () => {
  assert.equal(learjet35aQrhAbnormalBatch6ReleaseStatus, "staged-source-review");
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(learjet35aQrhAbnormalBatch6), []);
  assert.deepEqual(
    learjet35aQrhAbnormalBatch6.scenarios.map((scenario) => scenario.title),
    [
      "CROSSFLOW VALVE FAILS TO OPEN",
      "FUEL FILTER LIGHT",
      "FUEL IMBALANCE DURING FUEL TRANSFER",
      "FUEL JETTISON",
      "FUEL TRANSFER VALVE FAILS TO CLOSE",
      "FUEL VALVE LIGHT(S)",
      "LOW FUEL LIGHT",
      "NORMAL FUEL TRANSFER SYSTEM FAILURE",
      "STANDBY PUMP FAILS TO SHUT OFF",
      "TIP TANK FAILS TO TRANSFER FUEL",
    ],
  );
  assert.ok(
    learjet35aQrhAbnormalBatch6.scenarios.every(
      (scenario) =>
        scenario.procedureClass === "abnormal" &&
        scenario.category === "Fuel" &&
        scenario.effectivity.kind === "all-aircraft",
    ),
  );
});

test("QRH.3M Fuel family preserves exact A-19 through A-23 page provenance", () => {
  const pages = new Map(
    learjet35aQrhAbnormalBatch6.scenarios.map((scenario) => [
      scenario.id,
      scenario.sources?.map((item) => item.pageLabel),
    ]),
  );

  assert.deepEqual(pages.get("crossflow-valve-fails-to-open"), ["A-19"]);
  assert.deepEqual(pages.get("fuel-filter-light"), ["A-20"]);
  assert.deepEqual(pages.get("fuel-imbalance-during-fuel-transfer"), ["A-20"]);
  assert.deepEqual(pages.get("fuel-jettison"), ["A-21"]);
  assert.deepEqual(pages.get("fuel-transfer-valve-fails-to-close"), ["A-21"]);
  assert.deepEqual(pages.get("fuel-valve-lights"), ["A-21"]);
  assert.deepEqual(pages.get("low-fuel-light"), ["A-21"]);
  assert.deepEqual(pages.get("normal-fuel-transfer-system-failure"), ["A-22"]);
  assert.deepEqual(pages.get("standby-pump-fails-to-shut-off"), ["A-22"]);
  assert.deepEqual(pages.get("tip-tank-fails-to-transfer-fuel"), ["A-23"]);
});

test("QRH.3M FUS VALVE source paths require explicit installed/not-installed configuration", () => {
  const selectedStages = (
    scenarioId: string,
    state?: "installed" | "not-installed" | "unknown",
  ) =>
    filterAbnormalEmergencyForConfiguration(
      learjet35aQrhAbnormalBatch6,
      configuration(state),
    ).scenarios.find((scenario) => scenario.id === scenarioId)?.stages.map(
      (stage) => stage.id,
    ) ?? [];

  assert.deepEqual(
    selectedStages("crossflow-valve-fails-to-open", "installed"),
    ["crossflow-with-fus-valve-a19"],
  );
  assert.deepEqual(
    selectedStages("crossflow-valve-fails-to-open", "not-installed"),
    ["crossflow-no-fus-valve-a19"],
  );
  assert.deepEqual(
    selectedStages("crossflow-valve-fails-to-open", "unknown"),
    [],
  );
  assert.deepEqual(
    selectedStages("crossflow-valve-fails-to-open"),
    [],
  );

  assert.deepEqual(
    selectedStages("normal-fuel-transfer-system-failure", "installed"),
    ["normal-fuel-transfer-with-fus-a22"],
  );
  assert.deepEqual(
    selectedStages("normal-fuel-transfer-system-failure", "not-installed"),
    ["normal-fuel-transfer-without-fus-a22"],
  );
  assert.deepEqual(
    selectedStages("normal-fuel-transfer-system-failure", "unknown"),
    [],
  );
  assert.deepEqual(
    selectedStages("normal-fuel-transfer-system-failure"),
    [],
  );
});

test("QRH.3M ALL-aircraft Fuel procedures without configuration splits remain available", () => {
  const filtered = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhAbnormalBatch6,
    configuration(),
  );

  assert.deepEqual(
    filtered.scenarios.map((scenario) => scenario.id),
    [
      "fuel-filter-light",
      "fuel-imbalance-during-fuel-transfer",
      "fuel-jettison",
      "fuel-transfer-valve-fails-to-close",
      "fuel-valve-lights",
      "low-fuel-light",
      "standby-pump-fails-to-shut-off",
      "tip-tank-fails-to-transfer-fuel",
    ],
  );
});

test("QRH.3M preserves nested fuel-balance, jettison, low-fuel and standby-pump source branches", () => {
  for (const id of [
    "fuel-imbalance-during-fuel-transfer",
    "fuel-jettison",
    "low-fuel-light",
    "standby-pump-fails-to-shut-off",
    "tip-tank-fails-to-transfer-fuel",
  ]) {
    const scenario = learjet35aQrhAbnormalBatch6.scenarios.find(
      (candidate) => candidate.id === id,
    );
    assert.ok(scenario);
    const conditions = scenario.stages.flatMap((stage) =>
      flatten(stage.steps as readonly AircraftQrhStep[]),
    ).filter((step) => step.kind === "condition");
    assert.ok(conditions.length >= 1);
  }

  const imbalance = learjet35aQrhAbnormalBatch6.scenarios.find(
    (scenario) => scenario.id === "fuel-imbalance-during-fuel-transfer",
  );
  assert.ok(imbalance);
  assert.ok(
    imbalance.stages
      .flatMap((stage) => flatten(stage.steps as readonly AircraftQrhStep[]))
      .filter((step) => step.kind === "condition").length >= 2,
  );
});

test("QRH.3M preserves source-significant Fuel limits and landing consequences", () => {
  const serialized = JSON.stringify(learjet35aQrhAbnormalBatch6);
  assert.match(serialized, /2250 pounds, do not exceed 325 KIAS/);
  assert.match(serialized, /approximately 600 pounds/);
  assert.match(serialized, /Final Approach Speed — VREF \+ 10/);
  assert.match(serialized, /Landing Distance — MULTIPLY BY 1\.1/);
  assert.match(serialized, /FUEL JTSN Lights — BOTH ON/);
  assert.match(serialized, /Refer to AFM for conditions that will exist/);
});

test("QRH.3M visual review found no boxed memory items on A-19 through A-23", () => {
  assert.equal(
    JSON.stringify(learjet35aQrhAbnormalBatch6).includes('"memoryItem":true'),
    false,
  );
});

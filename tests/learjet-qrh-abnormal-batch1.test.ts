import assert from "node:assert/strict";
import test from "node:test";

import {
  learjet35aQrhAbnormalBatch1,
  learjet35aQrhAbnormalBatch1ReleaseStatus,
  learjet35aQrhAbnormalConfigurationKeys,
} from "../aircraft-data/learjet-35a/qrh/abnormal-batch-1.ts";
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
  windshieldDefog: "installed" | "not-installed" | "unknown" = "unknown",
): AircraftConfiguration {
  return {
    variant: "source-review",
    serialNumber,
    equipment: new Set<string>(),
    configurationEquipment: new Map([
      [learjet35aQrhAbnormalConfigurationKeys.windshieldDefog, windshieldDefog],
    ]),
  };
}

function scenarioStageIds(
  serialNumber: string | undefined,
  scenarioId: string,
  windshieldDefog: "installed" | "not-installed" | "unknown" = "unknown",
): readonly string[] {
  return filterAbnormalEmergencyForConfiguration(
    learjet35aQrhAbnormalBatch1,
    configuration(serialNumber, windshieldDefog),
  ).scenarios.find((scenario) => scenario.id === scenarioId)?.stages.map((stage) => stage.id) ?? [];
}

function flatten(steps: readonly AircraftQrhStep[]): AircraftQrhStep[] {
  return steps.flatMap((step) =>
    step.kind === "condition"
      ? [step, ...step.branches.flatMap((branch) => flatten(branch.steps))]
      : [step],
  );
}

test("QRH.3H Anti-Icing Abnormal batch satisfies the generic v2 contract", () => {
  assert.equal(learjet35aQrhAbnormalBatch1ReleaseStatus, "staged-source-review");
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(learjet35aQrhAbnormalBatch1), []);
  assert.deepEqual(
    learjet35aQrhAbnormalBatch1.scenarios.map((scenario) => scenario.title),
    [
      "ALC AI LIGHT",
      "ENGINE ICE INGESTION",
      "ENG ICE LIGHT",
      "INADVERTENT ICING ENCOUNTER",
      "PITOT HT LIGHT",
      "STABILIZER HEAT FAILURE",
      "STAB OV HT LIGHT",
      "WING HEAT FAILURE",
      "WING OV HT LIGHT",
      "WINDSHIELD HEAT FAILURE",
      "WSHLD DEFOG LIGHT (IF INSTALLED)",
      "WSHLD OV HT LIGHT",
    ],
  );
  assert.ok(
    learjet35aQrhAbnormalBatch1.scenarios.every(
      (scenario) => scenario.procedureClass === "abnormal" && scenario.category === "Anti-Icing",
    ),
  );
});

test("QRH.3H preserves the A-i Abnormal section operating principles", () => {
  const intro = learjet35aQrhAbnormalBatch1.sectionIntroductions?.[0];
  assert.ok(intro);
  assert.equal(intro.procedureClass, "abnormal");
  assert.deepEqual(
    intro.paragraphs.slice(-3),
    ["Maintain Airplane Control", "Analyze the Situation", "Take Proper Action"],
  );
  assert.equal(intro.sources[0]?.pageLabel, "A-i");
});

test("QRH.3H ALL-aircraft A-4/A-5 procedures do not require serial identity", () => {
  const filtered = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhAbnormalBatch1,
    configuration(undefined),
  );
  assert.deepEqual(
    filtered.scenarios.map((scenario) => scenario.id),
    [
      "alc-ai-light",
      "engine-ice-ingestion",
      "eng-ice-light",
      "inadvertent-icing-encounter",
      "pitot-ht-light",
    ],
  );
});

test("QRH.3H serial families select the exact A-6 through A-9 source variants", () => {
  for (const scenarioId of [
    "stabilizer-heat-failure",
    "stab-ov-ht-light",
    "wing-heat-failure",
    "wing-ov-ht-light",
    "windshield-heat-failure",
    "wshld-ov-ht-light",
  ]) {
    assert.equal(scenarioStageIds("35-106", scenarioId)[0]?.endsWith("-1"), false);
    assert.equal(scenarioStageIds("35-107", scenarioId)[0]?.endsWith("-1"), true);
    assert.equal(scenarioStageIds("35-108", scenarioId)[0]?.endsWith("-1"), false);
    assert.equal(scenarioStageIds("35-113", scenarioId)[0]?.endsWith("-1"), true);
    assert.equal(scenarioStageIds("36-031", scenarioId)[0]?.endsWith("-1"), false);
    assert.equal(scenarioStageIds("36-032", scenarioId)[0]?.endsWith("-1"), true);
  }
});

test("QRH.3H WSHLD DEFOG LIGHT requires both late serial effectivity and explicit installed equipment", () => {
  assert.deepEqual(scenarioStageIds("35-113", "wshld-defog-light", "installed"), ["wshld-defog-a8-1"]);
  assert.deepEqual(scenarioStageIds("35-113", "wshld-defog-light", "not-installed"), []);
  assert.deepEqual(scenarioStageIds("35-113", "wshld-defog-light", "unknown"), []);
  assert.deepEqual(scenarioStageIds("35-108", "wshld-defog-light", "installed"), []);
  assert.deepEqual(scenarioStageIds(undefined, "wshld-defog-light", "installed"), []);
});

test("QRH.3H preserves source-significant early/late procedure differences", () => {
  const serialized = JSON.stringify(learjet35aQrhAbnormalBatch1);
  assert.match(serialized, /CABIN AIR Switch — MAX/);
  assert.match(serialized, /Windshield Heat — AUTO/);
  assert.match(serialized, /Windshield Heat — ON/);
  assert.match(serialized, /Windshield Heat — MAN/);
  assert.match(serialized, /WSHLD HEAT ON-OFF Switch — OFF, until airflow stops/);
  assert.match(serialized, /Windshield Heat — OFF/);
  assert.match(serialized, /35-001 thru 35-106, 35-108 thru 35-112/);
  assert.match(serialized, /35-107, 35-113 & on/);
});

test("QRH.3H preserves nested source conditions without flattening them into linear actions", () => {
  const inadvertent = learjet35aQrhAbnormalBatch1.scenarios.find(
    (scenario) => scenario.id === "inadvertent-icing-encounter",
  );
  assert.ok(inadvertent);
  const conditions = flatten(inadvertent.stages[0].steps as readonly AircraftQrhStep[])
    .filter((step) => step.kind === "condition");
  assert.ok(conditions.length >= 3);

  const engIce = learjet35aQrhAbnormalBatch1.scenarios.find(
    (scenario) => scenario.id === "eng-ice-light",
  );
  assert.ok(engIce);
  assert.ok(
    flatten(engIce.stages[0].steps as readonly AircraftQrhStep[])
      .filter((step) => step.kind === "condition").length >= 2,
  );
});

test("QRH.3H visual review found no boxed memory items on A-4 through A-9.1", () => {
  assert.equal(
    JSON.stringify(learjet35aQrhAbnormalBatch1).includes('"memoryItem":true'),
    false,
  );
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  learjet35aQrhAbnormalBatch4,
  learjet35aQrhAbnormalBatch4ReleaseStatus,
  learjet35aQrhEnvironmentalConfigurationKeys,
} from "../aircraft-data/learjet-35a/qrh/abnormal-batch-4.ts";
import {
  filterAbnormalEmergencyForConfiguration,
  type AircraftConfiguration,
} from "../lib/aircraft-applicability.ts";
import {
  type AircraftQrhStep,
  validateUniversalAbnormalEmergencyPayload,
} from "../lib/universal-abnormal-emergency.ts";

function configuration(options: {
  serialNumber?: string;
  emergencyAirflow?: "installed" | "not-installed" | "unknown";
  amk903?: "installed" | "not-installed" | "unknown";
} = {}): AircraftConfiguration {
  return {
    variant: "source-review",
    ...(options.serialNumber ? { serialNumber: options.serialNumber } : {}),
    equipment: new Set<string>(),
    ...(options.emergencyAirflow
      ? {
          configurationEquipment: new Map([
            [
              learjet35aQrhEnvironmentalConfigurationKeys.emergencyAirflow,
              options.emergencyAirflow,
            ],
          ]),
        }
      : {}),
    ...(options.amk903
      ? {
          modifications: new Map([
            [
              learjet35aQrhEnvironmentalConfigurationKeys.amk903,
              options.amk903,
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

test("QRH.3K Environmental Abnormal batch satisfies the generic v2 contract", () => {
  assert.equal(learjet35aQrhAbnormalBatch4ReleaseStatus, "staged-source-review");
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(learjet35aQrhAbnormalBatch4), []);
  assert.deepEqual(
    learjet35aQrhAbnormalBatch4.scenarios.map((scenario) => scenario.title),
    [
      "FAILURE TO DEPRESSURIZE",
      "INADVERTENT ACTIVATION OF EMERGENCY AIRFLOW (IF INSTALLED)",
      "OVERPRESSURIZATION",
      "CAB ALT LIGHT OR CABIN ALTITUDE EXCEEDS 8500 FEET",
      "RETURN TO NORMAL PRESSURIZATION",
    ],
  );
  assert.ok(
    learjet35aQrhAbnormalBatch4.scenarios.every(
      (scenario) => scenario.procedureClass === "abnormal" && scenario.category === "Environmental",
    ),
  );
});

test("QRH.3K A-14 ALL-aircraft procedures remain available without serial identity", () => {
  const filtered = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhAbnormalBatch4,
    configuration(),
  );
  assert.deepEqual(
    filtered.scenarios.map((scenario) => scenario.id),
    ["failure-to-depressurize", "overpressurization"],
  );
});

test("QRH.3K emergency-airflow controls resolve exact serial/AMK source variants fail-closed", () => {
  const stageIds = (options: Parameters<typeof configuration>[0]) =>
    filterAbnormalEmergencyForConfiguration(
      learjet35aQrhAbnormalBatch4,
      configuration(options),
    ).scenarios.find(
      (scenario) => scenario.id === "inadvertent-activation-emergency-airflow",
    )?.stages.map((stage) => stage.id) ?? [];

  assert.deepEqual(
    stageIds({
      serialNumber: "35-658",
      emergencyAirflow: "installed",
      amk903: "not-installed",
    }),
    ["emergency-airflow-mod-valves-a14"],
  );
  assert.deepEqual(
    stageIds({
      serialNumber: "35-658",
      emergencyAirflow: "installed",
      amk903: "installed",
    }),
    ["emergency-airflow-emergency-pressurization-a14"],
  );
  assert.deepEqual(
    stageIds({
      serialNumber: "35-659",
      emergencyAirflow: "installed",
    }),
    ["emergency-airflow-emergency-pressurization-a14"],
  );
  assert.deepEqual(
    stageIds({
      serialNumber: "35-658",
      emergencyAirflow: "installed",
    }),
    [],
  );
  assert.deepEqual(
    stageIds({
      serialNumber: "35-658",
      emergencyAirflow: "unknown",
      amk903: "not-installed",
    }),
    [],
  );
  assert.deepEqual(
    stageIds({
      serialNumber: "35-658",
      emergencyAirflow: "not-installed",
      amk903: "not-installed",
    }),
    [],
  );
});

test("QRH.3K A-15/A-15.1 cabin-altitude variants select by exact serial family", () => {
  const select = (serialNumber?: string) =>
    filterAbnormalEmergencyForConfiguration(
      learjet35aQrhAbnormalBatch4,
      configuration({ serialNumber }),
    ).scenarios.find(
      (scenario) => scenario.id === "cab-alt-light-or-cabin-altitude-exceeds-8500-feet",
    )?.stages.map((stage) => stage.id) ?? [];

  assert.deepEqual(select("35-106"), ["cabin-altitude-a15"]);
  assert.deepEqual(select("35-107"), ["cabin-altitude-a15-1"]);
  assert.deepEqual(select("35-108"), ["cabin-altitude-a15"]);
  assert.deepEqual(select("35-113"), ["cabin-altitude-a15-1"]);
  assert.deepEqual(select("36-031"), ["cabin-altitude-a15"]);
  assert.deepEqual(select("36-032"), ["cabin-altitude-a15-1"]);
  assert.deepEqual(select(), []);
});

test("QRH.3K A-16/A-16.1 return-to-pressurization variants remain source-distinct", () => {
  const select = (serialNumber: string) =>
    filterAbnormalEmergencyForConfiguration(
      learjet35aQrhAbnormalBatch4,
      configuration({ serialNumber }),
    ).scenarios.find(
      (scenario) => scenario.id === "return-to-normal-pressurization",
    )?.stages.map((stage) => stage.id) ?? [];

  assert.deepEqual(select("35-106"), ["return-pressurization-a16"]);
  assert.deepEqual(select("35-107"), ["return-pressurization-a16-1"]);

  const serialized = JSON.stringify(learjet35aQrhAbnormalBatch4);
  assert.match(serialized, /RETURN TO AUTOMATIC PRESSURIZATION MODE/);
  assert.match(serialized, /Cabin Controller — ≤7500 FEET \(cabin\)/);
  assert.match(serialized, /UP-DN Manual Control — <7200 FEET \(cabin\)/);
  assert.match(serialized, /Cabin Controller — ≤7200 FEET \(cabin\)/);
  assert.match(serialized, /comparison glyph/);
});

test("QRH.3K preserves nested Environmental source branches without inferred memory items", () => {
  const nestedIds = [
    "inadvertent-activation-emergency-airflow",
    "overpressurization",
    "cab-alt-light-or-cabin-altitude-exceeds-8500-feet",
  ];

  for (const id of nestedIds) {
    const scenario = learjet35aQrhAbnormalBatch4.scenarios.find(
      (candidate) => candidate.id === id,
    );
    assert.ok(scenario);
    const conditions = scenario.stages.flatMap((stage) =>
      flatten(stage.steps as readonly AircraftQrhStep[]),
    ).filter((step) => step.kind === "condition");
    assert.ok(conditions.length >= 1);
  }

  assert.equal(
    JSON.stringify(learjet35aQrhAbnormalBatch4).includes('"memoryItem":true'),
    false,
  );
});

test("QRH.3K preserves source-significant early/late pressurization differences", () => {
  const serialized = JSON.stringify(learjet35aQrhAbnormalBatch4);
  assert.match(serialized, /Cabin Air — NORM/);
  assert.match(serialized, /IN NORMAL\/OUT DEFOG Knob — PUSH IN/);
  assert.match(serialized, /BLEED AIR Switches — EMER/);
  assert.match(serialized, /If cabin temperature becomes hot from the use of EMER BLEED AIR/);
  assert.match(serialized, /L EMER PRESS CB \(pilot’s main bus\) — IN/);
  assert.match(serialized, /LH MOD VAL CB \(pilot’s main bus\) — IN/);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  learjet35aQrhAbnormalBatch8,
  learjet35aQrhAbnormalBatch8ReleaseStatus,
  learjet35aQrhInstrumentsConfigurationKeys,
} from "../aircraft-data/learjet-35a/qrh/abnormal-batch-8.ts";
import {
  filterAbnormalEmergencyForConfiguration,
  type AircraftConfiguration,
} from "../lib/aircraft-applicability.ts";
import {
  type AircraftQrhStep,
  validateUniversalAbnormalEmergencyPayload,
} from "../lib/universal-abnormal-emergency.ts";

function configuration(
  rosemount?: "installed" | "not-installed" | "unknown",
): AircraftConfiguration {
  return {
    variant: "source-review",
    equipment: new Set<string>(),
    ...(rosemount
      ? {
          configurationEquipment: new Map([
            [
              learjet35aQrhInstrumentsConfigurationKeys.rosemountPitotStaticSystem,
              rosemount,
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

test("QRH.3O Instruments Abnormal batch satisfies the generic v2 contract", () => {
  assert.equal(learjet35aQrhAbnormalBatch8ReleaseStatus, "staged-source-review");
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(learjet35aQrhAbnormalBatch8), []);
  assert.deepEqual(
    learjet35aQrhAbnormalBatch8.scenarios.map((scenario) => scenario.title),
    ["PITOT-STATIC SYSTEM MALFUNCTION", "V.G. MON LIGHT"],
  );
  assert.ok(
    learjet35aQrhAbnormalBatch8.scenarios.every(
      (scenario) =>
        scenario.procedureClass === "abnormal" &&
        scenario.category === "Instruments",
    ),
  );
});

test("QRH.3O Rosemount pitot-static variants select exact source pages and fail closed when unknown", () => {
  const selectedStages = (
    state?: "installed" | "not-installed" | "unknown",
  ) =>
    filterAbnormalEmergencyForConfiguration(
      learjet35aQrhAbnormalBatch8,
      configuration(state),
    ).scenarios.find(
      (scenario) => scenario.id === "pitot-static-system-malfunction",
    )?.stages.map((stage) => stage.id) ?? [];

  assert.deepEqual(selectedStages("not-installed"), [
    "pitot-static-without-rosemount-a25",
  ]);
  assert.deepEqual(selectedStages("installed"), [
    "pitot-static-with-rosemount-a25-1",
  ]);
  assert.deepEqual(selectedStages("unknown"), []);
  assert.deepEqual(selectedStages(), []);

  const pitot = learjet35aQrhAbnormalBatch8.scenarios.find(
    (scenario) => scenario.id === "pitot-static-system-malfunction",
  );
  assert.ok(pitot);
  assert.deepEqual(
    pitot.stages.map((stage) => [
      stage.id,
      stage.sources?.map((item) => item.pageLabel),
    ]),
    [
      ["pitot-static-without-rosemount-a25", ["A-25"]],
      ["pitot-static-with-rosemount-a25-1", ["A-25.1"]],
    ],
  );
});

test("QRH.3O V.G. MON LIGHT remains ALL-aircraft regardless of pitot-static configuration", () => {
  for (const state of [undefined, "installed", "not-installed", "unknown"] as const) {
    const filtered = filterAbnormalEmergencyForConfiguration(
      learjet35aQrhAbnormalBatch8,
      configuration(state),
    );
    assert.ok(
      filtered.scenarios.some((scenario) => scenario.id === "vg-mon-light"),
    );
  }
});

test("QRH.3O preserves the distinct Rosemount and non-Rosemount source behavior", () => {
  const pitot = learjet35aQrhAbnormalBatch8.scenarios.find(
    (scenario) => scenario.id === "pitot-static-system-malfunction",
  );
  assert.ok(pitot);

  const without = pitot.stages.find(
    (stage) => stage.id === "pitot-static-without-rosemount-a25",
  );
  const withRosemount = pitot.stages.find(
    (stage) => stage.id === "pitot-static-with-rosemount-a25-1",
  );
  assert.ok(without);
  assert.ok(withRosemount);

  const withoutText = JSON.stringify(without);
  const withText = JSON.stringify(withRosemount);

  assert.match(
    withoutText,
    /copilot’s pitot system and shoulder static ports/,
  );
  assert.match(withoutText, /Alternate Static Source — OPEN/);
  assert.match(withoutText, /Pilot’s Altimeter — STBY/);
  assert.match(
    withoutText,
    /Refer to AFM for Airspeed and Altitude Position Correction Charts/,
  );

  assert.match(
    withText,
    /either pilot’s or copilot’s airspeed indicator needle is above the VMO\/MMO/,
  );
  assert.match(withText, /Autopilot — DISENGAGE/);
  assert.match(withText, /STATIC SOURCE Switch — L or R/);
  assert.match(withText, /Autopilot — AS DESIRED/);
  assert.doesNotMatch(withText, /shoulder static ports/);
});

test("QRH.3O preserves the source static-pressure branch structure", () => {
  const pitot = learjet35aQrhAbnormalBatch8.scenarios.find(
    (scenario) => scenario.id === "pitot-static-system-malfunction",
  );
  assert.ok(pitot);
  const without = pitot.stages.find(
    (stage) => stage.id === "pitot-static-without-rosemount-a25",
  );
  assert.ok(without);

  const steps = flatten(without.steps as readonly AircraftQrhStep[]);
  const condition = steps.find(
    (step) =>
      step.kind === "condition" &&
      step.id === "pitot-static-without-rosemount-side",
  );
  assert.ok(condition && condition.kind === "condition");
  assert.deepEqual(
    condition.branches.map((branch) => branch.label),
    ["5. Malfunction on copilot’s side", "Malfunction on pilot’s side"],
  );
});

test("QRH.3O preserves source-significant Instruments information", () => {
  const serialized = JSON.stringify(learjet35aQrhAbnormalBatch8);
  assert.match(serialized, /Maintain aircraft control with safe attitude & thrust/);
  assert.match(serialized, /FMS and SAT\/TAS system \(if installed\)/);
  assert.match(serialized, /DME systems and ground based radar/);
  assert.match(
    serialized,
    /One gyro wheel has failed\. Remaining wheel is operative & gyro is reliable\./,
  );
  assert.match(serialized, /Replace gyro as soon as practical\./);
});

test("QRH.3O visual review found no boxed memory items on A-25 through A-26", () => {
  assert.equal(
    JSON.stringify(learjet35aQrhAbnormalBatch8).includes('"memoryItem":true'),
    false,
  );
});

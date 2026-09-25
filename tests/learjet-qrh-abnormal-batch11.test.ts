import assert from "node:assert/strict";
import test from "node:test";

import {
  learjet35aQrhAbnormalBatch11,
  learjet35aQrhAbnormalBatch11ReleaseStatus,
} from "../aircraft-data/learjet-35a/qrh/abnormal-batch-11.ts";
import { learjet35aQrhThrustReverserConfigurationKeys } from "../aircraft-data/learjet-35a/qrh/emergency-batch-6.ts";
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

test("QRH.3R Turbulence Abnormal batch satisfies the generic v2 contract", () => {
  assert.equal(learjet35aQrhAbnormalBatch11ReleaseStatus, "staged-source-review");
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(learjet35aQrhAbnormalBatch11), []);
  assert.deepEqual(
    learjet35aQrhAbnormalBatch11.scenarios.map((scenario) => scenario.id),
    ["turbulent-air-penetration"],
  );
});

test("QRH.3R selects the exact A-33 source family from explicit thrust-reverser configuration", () => {
  const cases = [
    [configuration("not-installed", "not-installed"), "turbulence-no-reversers", "A-33"],
    [configuration("installed", "not-installed"), "turbulence-aeronca", "A-33.1"],
    [configuration("not-installed", "installed"), "turbulence-tr4000", "A-33.2"],
  ] as const;

  for (const [config, stageId, pageLabel] of cases) {
    const filtered = filterAbnormalEmergencyForConfiguration(
      learjet35aQrhAbnormalBatch11,
      config,
    );
    assert.equal(filtered.scenarios.length, 1);
    assert.equal(filtered.scenarios[0]?.stages.length, 1);
    assert.equal(filtered.scenarios[0]?.stages[0]?.id, stageId);
    assert.equal(filtered.scenarios[0]?.stages[0]?.sources?.[0]?.pageLabel, pageLabel);
  }
});

test("QRH.3R unknown absent or contradictory thrust-reverser identity fails closed", () => {
  for (const candidate of [
    configuration("unknown", "unknown"),
    configuration("installed", "installed"),
    configuration("unknown", "not-installed"),
    configuration("not-installed", "unknown"),
  ]) {
    assert.equal(
      filterAbnormalEmergencyForConfiguration(
        learjet35aQrhAbnormalBatch11,
        candidate,
      ).scenarios.length,
      0,
    );
  }

  const absent: AircraftConfiguration = {
    variant: "source-review",
    equipment: new Set<string>(),
  };
  assert.equal(
    filterAbnormalEmergencyForConfiguration(
      learjet35aQrhAbnormalBatch11,
      absent,
    ).scenarios.length,
    0,
  );
});

test("QRH.3R preserves identical source procedure text across all three effectivity pages", () => {
  const stages = learjet35aQrhAbnormalBatch11.scenarios[0]?.stages ?? [];
  assert.equal(stages.length, 3);

  const normalized = stages.map((stage) =>
    stage.steps.map((step) => {
      if (step.kind === "action") {
        return { kind: step.kind, label: step.label, text: step.text };
      }
      if (step.kind === "information") {
        return { kind: step.kind, label: step.label, text: step.text };
      }
      return { kind: step.kind };
    }),
  );

  assert.deepEqual(normalized[1], normalized[0]);
  assert.deepEqual(normalized[2], normalized[0]);

  const serialized = JSON.stringify(normalized[0]);
  assert.match(serialized, /250 KIAS or \.73 MI whichever is less/);
  assert.match(serialized, /Thrust — Set & Ignition — ON/);
  assert.match(serialized, /Use attitude indicator as primary instrument/);
  assert.match(serialized, /Do not change stabilizer trim after set for penetration/);
  assert.match(serialized, /Altitude — Allow altitude to vary/);
  assert.match(serialized, /Yaw Damper — ENGAGED/);
  assert.match(serialized, /Autopilot Attitude Hold and Soft Modes — ENGAGED/);
});

test("QRH.3R visual review found no boxed memory items on A-33 through A-33.2", () => {
  const steps = learjet35aQrhAbnormalBatch11.scenarios.flatMap((scenario) =>
    scenario.stages.flatMap((stage) => flatten(stage.steps as readonly AircraftQrhStep[])),
  );
  assert.equal(
    steps.some(
      (step) => step.kind === "action" && step.memoryItem === true,
    ),
    false,
  );
});

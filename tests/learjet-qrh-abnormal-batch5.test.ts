import assert from "node:assert/strict";
import test from "node:test";

import {
  learjet35aQrhAbnormalBatch5,
  learjet35aQrhAbnormalBatch5ReleaseStatus,
  learjet35aQrhFlightControlsConfigurationKeys,
} from "../aircraft-data/learjet-35a/qrh/abnormal-batch-5.ts";
import {
  filterAbnormalEmergencyForConfiguration,
  type AircraftConfiguration,
} from "../lib/aircraft-applicability.ts";
import {
  type AircraftQrhStep,
  validateUniversalAbnormalEmergencyPayload,
} from "../lib/universal-abnormal-emergency.ts";

function configuration(options: {
  machTrim?: "installed" | "not-installed" | "unknown";
  pitchTrimLight?: "installed" | "not-installed" | "unknown";
} = {}): AircraftConfiguration {
  const configured = new Map<string, "installed" | "not-installed" | "unknown">();
  if (options.machTrim) {
    configured.set(
      learjet35aQrhFlightControlsConfigurationKeys.machTrim,
      options.machTrim,
    );
  }
  if (options.pitchTrimLight) {
    configured.set(
      learjet35aQrhFlightControlsConfigurationKeys.pitchTrimLight,
      options.pitchTrimLight,
    );
  }

  return {
    variant: "source-review",
    equipment: new Set<string>(),
    ...(configured.size ? { configurationEquipment: configured } : {}),
  };
}

function flatten(steps: readonly AircraftQrhStep[]): AircraftQrhStep[] {
  return steps.flatMap((step) =>
    step.kind === "condition"
      ? [step, ...step.branches.flatMap((branch) => flatten(branch.steps))]
      : [step],
  );
}

test("QRH.3L Flight Controls Abnormal batch satisfies the generic v2 contract", () => {
  assert.equal(learjet35aQrhAbnormalBatch5ReleaseStatus, "staged-source-review");
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(learjet35aQrhAbnormalBatch5), []);
  assert.deepEqual(
    learjet35aQrhAbnormalBatch5.scenarios.map((scenario) => scenario.title),
    [
      "AUG AIL LIGHT",
      "MACH TRIM MALFUNCTION",
      "PITCH TRIM LIGHT IN FLIGHT",
      "STALL WARNING SYSTEM FAILURE",
      "YAW DAMPER FAILURE",
    ],
  );
  assert.ok(
    learjet35aQrhAbnormalBatch5.scenarios.every(
      (scenario) =>
        scenario.procedureClass === "abnormal" &&
        scenario.category === "Flight Controls",
    ),
  );
});

test("QRH.3L ALL-aircraft Flight Controls procedures remain available without optional equipment facts", () => {
  const filtered = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhAbnormalBatch5,
    configuration(),
  );
  assert.deepEqual(
    filtered.scenarios.map((scenario) => scenario.id),
    [
      "aug-ail-light",
      "stall-warning-system-failure",
      "yaw-damper-failure",
    ],
  );
});

test("QRH.3L IF APPLICABLE procedures fail closed until matching equipment is explicitly installed", () => {
  const ids = (options: Parameters<typeof configuration>[0]) =>
    filterAbnormalEmergencyForConfiguration(
      learjet35aQrhAbnormalBatch5,
      configuration(options),
    ).scenarios.map((scenario) => scenario.id);

  assert.equal(ids({}).includes("mach-trim-malfunction"), false);
  assert.equal(
    ids({ machTrim: "unknown" }).includes("mach-trim-malfunction"),
    false,
  );
  assert.equal(
    ids({ machTrim: "not-installed" }).includes("mach-trim-malfunction"),
    false,
  );
  assert.equal(
    ids({ machTrim: "installed" }).includes("mach-trim-malfunction"),
    true,
  );

  assert.equal(ids({}).includes("pitch-trim-light-in-flight"), false);
  assert.equal(
    ids({ pitchTrimLight: "unknown" }).includes("pitch-trim-light-in-flight"),
    false,
  );
  assert.equal(
    ids({ pitchTrimLight: "not-installed" }).includes(
      "pitch-trim-light-in-flight",
    ),
    false,
  );
  assert.equal(
    ids({ pitchTrimLight: "installed" }).includes(
      "pitch-trim-light-in-flight",
    ),
    true,
  );
});

test("QRH.3L preserves A-17/A-18 conditional source branches", () => {
  const nestedIds = [
    "aug-ail-light",
    "mach-trim-malfunction",
    "stall-warning-system-failure",
  ];

  for (const id of nestedIds) {
    const scenario = learjet35aQrhAbnormalBatch5.scenarios.find(
      (candidate) => candidate.id === id,
    );
    assert.ok(scenario);
    const conditions = scenario.stages.flatMap((stage) =>
      flatten(stage.steps as readonly AircraftQrhStep[]),
    ).filter((step) => step.kind === "condition");
    assert.ok(conditions.length >= 1);
  }

  const mach = learjet35aQrhAbnormalBatch5.scenarios.find(
    (scenario) => scenario.id === "mach-trim-malfunction",
  );
  assert.ok(mach);
  assert.ok(
    mach.stages
      .flatMap((stage) => flatten(stage.steps as readonly AircraftQrhStep[]))
      .filter((step) => step.kind === "condition").length >= 3,
  );
});

test("QRH.3L preserves source-significant flight-control operating text", () => {
  const serialized = JSON.stringify(learjet35aQrhAbnormalBatch5);
  assert.match(serialized, /Airspeed — BELOW 0\.74MI/);
  assert.match(serialized, /VREF may be maintained on final/);
  assert.match(serialized, /Bank angles — 30° MAX/);
  assert.match(serialized, /Maintaining higher airspeed \(250 KIAS or higher where applicable\)/);
  assert.match(serialized, /plan flight to land with both tip tanks empty/);
  assert.match(serialized, /Spoilers will be inoperative in flight/);
});

test("QRH.3L keeps single and dual yaw-damper procedures source-distinct", () => {
  const yaw = learjet35aQrhAbnormalBatch5.scenarios.find(
    (scenario) => scenario.id === "yaw-damper-failure",
  );
  assert.ok(yaw);
  assert.deepEqual(
    yaw.stages.map((stage) => stage.label),
    ["SINGLE YAW DAMPER FAILURE", "DUAL YAW DAMPER FAILURE"],
  );
});

test("QRH.3L visual review found no boxed memory items on A-17 through A-19", () => {
  assert.equal(
    JSON.stringify(learjet35aQrhAbnormalBatch5).includes('"memoryItem":true'),
    false,
  );
});

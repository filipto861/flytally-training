import assert from "node:assert/strict";
import test from "node:test";

import {
  learjet35aQrhAbnormalBatch7,
  learjet35aQrhAbnormalBatch7ReleaseStatus,
  learjet35aQrhHydraulicConfigurationKeys,
} from "../aircraft-data/learjet-35a/qrh/abnormal-batch-7.ts";
import {
  filterAbnormalEmergencyForConfiguration,
  type AircraftConfiguration,
} from "../lib/aircraft-applicability.ts";
import {
  type AircraftQrhStep,
  validateUniversalAbnormalEmergencyPayload,
} from "../lib/universal-abnormal-emergency.ts";

function configuration(
  loHydLight?: "installed" | "not-installed" | "unknown",
): AircraftConfiguration {
  return {
    variant: "source-review",
    equipment: new Set<string>(),
    ...(loHydLight
      ? {
          configurationEquipment: new Map([
            [learjet35aQrhHydraulicConfigurationKeys.loHydLight, loHydLight],
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

test("QRH.3N Hydraulic Abnormal batch satisfies the generic v2 contract", () => {
  assert.equal(learjet35aQrhAbnormalBatch7ReleaseStatus, "staged-source-review");
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(learjet35aQrhAbnormalBatch7), []);
  assert.deepEqual(
    learjet35aQrhAbnormalBatch7.scenarios.map((scenario) => scenario.title),
    [
      "LO HYD LIGHT (LOW HYDRAULIC PRESSURE)",
      "HYDRAULIC SYSTEM FAILURE/ALTERNATE GEAR EXTENSION",
    ],
  );
  assert.ok(
    learjet35aQrhAbnormalBatch7.scenarios.every(
      (scenario) =>
        scenario.procedureClass === "abnormal" &&
        scenario.category === "Hydraulic",
    ),
  );
});

test("QRH.3N LO HYD LIGHT is fail-closed until the source-qualified equipment is explicit", () => {
  const selected = (state?: "installed" | "not-installed" | "unknown") =>
    filterAbnormalEmergencyForConfiguration(
      learjet35aQrhAbnormalBatch7,
      configuration(state),
    ).scenarios.map((scenario) => scenario.id);

  assert.deepEqual(selected("installed"), [
    "lo-hyd-light",
    "hydraulic-system-failure-alternate-gear-extension",
  ]);
  assert.deepEqual(selected("not-installed"), [
    "hydraulic-system-failure-alternate-gear-extension",
  ]);
  assert.deepEqual(selected("unknown"), [
    "hydraulic-system-failure-alternate-gear-extension",
  ]);
  assert.deepEqual(selected(), [
    "hydraulic-system-failure-alternate-gear-extension",
  ]);
});

test("QRH.3N preserves exact A-23/A-24 page provenance", () => {
  const loHyd = learjet35aQrhAbnormalBatch7.scenarios.find(
    (scenario) => scenario.id === "lo-hyd-light",
  );
  const failure = learjet35aQrhAbnormalBatch7.scenarios.find(
    (scenario) =>
      scenario.id === "hydraulic-system-failure-alternate-gear-extension",
  );
  assert.ok(loHyd);
  assert.ok(failure);
  assert.deepEqual(loHyd.sources?.map((item) => item.pageLabel), ["A-23"]);
  assert.deepEqual(failure.sources?.map((item) => item.pageLabel), ["A-24"]);
});

test("QRH.3N preserves the LO HYD pressure decision and landing references", () => {
  const loHyd = learjet35aQrhAbnormalBatch7.scenarios.find(
    (scenario) => scenario.id === "lo-hyd-light",
  );
  assert.ok(loHyd);
  const steps = loHyd.stages.flatMap((stage) =>
    flatten(stage.steps as readonly AircraftQrhStep[]),
  );
  const condition = steps.find(
    (step) => step.kind === "condition" && step.id === "lo-hyd-pressure-result",
  );
  assert.ok(condition && condition.kind === "condition");
  assert.deepEqual(
    condition.branches.map((branch) => branch.label),
    ["2. If pressure is normal", "If pressure is low"],
  );

  const serialized = JSON.stringify(loHyd);
  assert.match(serialized, /HYDRAULIC SYSTEM FAILURE LANDING procedure, Tab 13/);
  assert.match(serialized, /HYDRAULIC SYSTEM FAILURE\/ALTERNATE GEAR EXTENSION/);
});

test("QRH.3N preserves the A-24 alternate-gear extension sequence and terminal branch", () => {
  const failure = learjet35aQrhAbnormalBatch7.scenarios.find(
    (scenario) =>
      scenario.id === "hydraulic-system-failure-alternate-gear-extension",
  );
  assert.ok(failure);
  const steps = failure.stages.flatMap((stage) =>
    flatten(stage.steps as readonly AircraftQrhStep[]),
  );

  assert.ok(
    steps.some(
      (step) =>
        step.kind === "action" &&
        step.id === "hydraulic-failure-2" &&
        step.text === "Airspeed VLO or less (VREF + 30 recommended)",
    ),
  );
  assert.ok(
    steps.some(
      (step) =>
        step.kind === "action" &&
        step.id === "hydraulic-failure-7a" &&
        step.text.includes("FULL DOWN"),
    ),
  );
  assert.ok(
    steps.some(
      (step) =>
        step.kind === "action" &&
        step.id === "hydraulic-failure-7c" &&
        step.text.includes("FULL UP"),
    ),
  );

  const terminal = steps.find(
    (step) =>
      step.kind === "condition" &&
      step.id === "hydraulic-failure-gear-result",
  );
  assert.ok(terminal && terminal.kind === "condition");
  assert.deepEqual(
    terminal.branches.map((branch) => branch.label),
    [
      "d. If all of the three green LOCKED DN lights are illuminated",
      "If any gear is not down and locked",
    ],
  );
});

test("QRH.3N preserves source-significant Hydraulic operating text", () => {
  const serialized = JSON.stringify(learjet35aQrhAbnormalBatch7);
  assert.match(serialized, /landing gear, flaps, spoilers, brakes, and thrust reversers/);
  assert.match(serialized, /CHECK 3 GREEN, 2 RED/);
  assert.match(serialized, /SPOILERON CB \(copilot’s AC bus\) — PULL/);
  assert.match(serialized, /GEAR UP LANDING procedure, Tab 12/);
});

test("QRH.3N visual review found no boxed memory items on A-23/A-24", () => {
  assert.equal(
    JSON.stringify(learjet35aQrhAbnormalBatch7).includes('"memoryItem":true'),
    false,
  );
});

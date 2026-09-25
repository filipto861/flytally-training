import assert from "node:assert/strict";
import test from "node:test";

import {
  learjet35aQrhAbnormalBatch10,
  learjet35aQrhAbnormalBatch10ReleaseStatus,
} from "../aircraft-data/learjet-35a/qrh/abnormal-batch-10.ts";
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

test("QRH.3Q Landings Abnormal batch satisfies the generic v2 contract", () => {
  assert.equal(learjet35aQrhAbnormalBatch10ReleaseStatus, "staged-source-review");
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(learjet35aQrhAbnormalBatch10), []);
  assert.equal(learjet35aQrhAbnormalBatch10.scenarios.length, 10);
  assert.ok(
    learjet35aQrhAbnormalBatch10.scenarios.every(
      (scenario) =>
        scenario.procedureClass === "abnormal" &&
        scenario.category === "Landings",
    ),
  );
});

test("QRH.3Q first nine Landings procedures remain ALL-aircraft", () => {
  assert.ok(
    learjet35aQrhAbnormalBatch10.scenarios
      .slice(0, 9)
      .every((scenario) => scenario.effectivity.kind === "all-aircraft"),
  );
  assert.deepEqual(
    learjet35aQrhAbnormalBatch10.scenarios.slice(0, 9).map((scenario) => scenario.title),
    [
      "GEAR UP LANDING",
      "HYDRAULIC SYSTEM FAILURE LANDING",
      "JAMMED STABILIZER LANDING",
      "ONE OR BOTH SPOILERS UP LANDING",
      "PARTIAL FLAP LANDING",
      "SINGLE-ENGINE LANDING",
      "STABILIZER HEAT FAILURE LANDING",
      "WING HEAT FAILURE LANDING",
      "WING & STAB HEAT FAILURE LANDING",
    ],
  );
});

test("QRH.3Q GEAR UP LANDING preserves the A-27/A-28 continuation and three gear-result paths", () => {
  const scenario = learjet35aQrhAbnormalBatch10.scenarios.find(
    (candidate) => candidate.id === "gear-up-landing",
  );
  assert.ok(scenario);
  assert.deepEqual(scenario.sources?.map((item) => item.pageLabel), ["A-27", "A-28"]);
  const serialized = JSON.stringify(scenario);
  assert.match(serialized, /If no gear have extended/);
  assert.match(serialized, /If the nose gear fails to extend/);
  assert.match(serialized, /If a main gear fails to extend/);
  assert.match(serialized, /CUTOFF @ TOUCHDOWN/);
  assert.match(serialized, /Emergency Exit Window — OPEN & EXIT/);
});

test("QRH.3Q hydraulic and partial-flap procedures preserve source branching and landing factors", () => {
  const hydraulic = learjet35aQrhAbnormalBatch10.scenarios.find(
    (candidate) => candidate.id === "hydraulic-system-failure-landing",
  );
  const partial = learjet35aQrhAbnormalBatch10.scenarios.find(
    (candidate) => candidate.id === "partial-flap-landing",
  );
  assert.ok(hydraulic);
  assert.ok(partial);

  const hydraulicText = JSON.stringify(hydraulic);
  assert.match(hydraulicText, /If auxiliary hydraulic pressure is available/);
  assert.match(hydraulicText, /If auxiliary hydraulic pressure is not available/);
  assert.match(hydraulicText, /MULTIPLY by 2.0/);
  assert.match(hydraulicText, /Emergency Brake Handle — PUSH DOWNWARD/);

  const partialText = JSON.stringify(partial);
  assert.match(partialText, /If pressure is low/);
  assert.match(partialText, /If pressure is normal/);
  assert.match(partialText, /UP: Final Approach Speed VREF \+ 30, Multiply Landing Distance By 1.35/);
  assert.match(partialText, /8°: VREF \+ 20, 1.30/);
  assert.match(partialText, /20°: VREF \+ 10, 1.20/);
});

test("QRH.3Q jammed-stabilizer paths remain source-distinct", () => {
  const scenario = learjet35aQrhAbnormalBatch10.scenarios.find(
    (candidate) => candidate.id === "jammed-stabilizer-landing",
  );
  assert.ok(scenario);
  const condition = scenario.stages[0].steps.find(
    (step) => step.kind === "condition" && step.id === "jammed-stab-force",
  );
  assert.ok(condition && condition.kind === "condition");
  assert.deepEqual(
    condition.branches.map((branch) => branch.label),
    ["Elevator Pull Force", "Elevator Push Force"],
  );
  assert.match(JSON.stringify(condition.branches[0]), /Transfer fuel to fuselage/);
  assert.match(JSON.stringify(condition.branches[0]), /VREF \+ 20/);
  assert.match(JSON.stringify(condition.branches[1]), /Transfer fuel to wing/);
  assert.match(JSON.stringify(condition.branches[1]), /Final Approach Speed — VREF/);
});

test("QRH.3Q preserves the source-defined landing speed and distance adjustments", () => {
  const serialized = JSON.stringify(learjet35aQrhAbnormalBatch10);
  assert.match(serialized, /ONE OR BOTH SPOILERS UP LANDING/);
  assert.match(serialized, /VREF \+ 40/);
  assert.match(serialized, /MULTIPLY by 1.5/);
  assert.match(serialized, /SINGLE-ENGINE LANDING/);
  assert.match(serialized, /Landing Distance — MULTIPLY by 1.2/);
  assert.match(serialized, /STABILIZER HEAT FAILURE LANDING/);
  assert.match(serialized, /Landing Distance — MULTIPLY by 1.1/);
  assert.match(serialized, /WING HEAT FAILURE LANDING/);
  assert.match(serialized, /Touchdown Speed — 15 knots above normal/);
  assert.match(serialized, /WING & STAB HEAT FAILURE LANDING/);
  assert.match(serialized, /Touchdown Speed — 25 knots above normal/);
});

test("QRH.3Q TR-4000 landing is configuration-specific and fails closed otherwise", () => {
  const tr4000 = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhAbnormalBatch10,
    configuration("not-installed", "installed"),
  );
  assert.equal(
    tr4000.scenarios.some(
      (scenario) => scenario.id === "one-thrust-reverser-deployed-landing",
    ),
    true,
  );

  for (const candidate of [
    configuration("installed", "not-installed"),
    configuration("unknown", "unknown"),
    configuration("installed", "installed"),
  ]) {
    const filtered = filterAbnormalEmergencyForConfiguration(
      learjet35aQrhAbnormalBatch10,
      candidate,
    );
    assert.equal(
      filtered.scenarios.some(
        (scenario) => scenario.id === "one-thrust-reverser-deployed-landing",
      ),
      false,
    );
    assert.equal(filtered.scenarios.length, 9);
  }
});

test("QRH.3Q visual review found no boxed memory items; A-31 marks are change bars", () => {
  const steps = learjet35aQrhAbnormalBatch10.scenarios.flatMap((scenario) =>
    scenario.stages.flatMap((stage) => flatten(stage.steps as readonly AircraftQrhStep[])),
  );
  assert.equal(
    steps.some(
      (step) => step.kind === "action" && step.memoryItem === true,
    ),
    false,
  );
});

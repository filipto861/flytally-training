import assert from "node:assert/strict";
import test from "node:test";

import {
  learjet35aQrhAbnormalBatch9,
  learjet35aQrhAbnormalBatch9ReleaseStatus,
} from "../aircraft-data/learjet-35a/qrh/abnormal-batch-9.ts";
import {
  type AircraftQrhStep,
  validateUniversalAbnormalEmergencyPayload,
} from "../lib/universal-abnormal-emergency.ts";

function flatten(steps: readonly AircraftQrhStep[]): AircraftQrhStep[] {
  return steps.flatMap((step) =>
    step.kind === "condition"
      ? [step, ...step.branches.flatMap((branch) => flatten(branch.steps))]
      : [step],
  );
}

test("QRH.3P Landing Gear Abnormal batch satisfies the generic v2 contract", () => {
  assert.equal(learjet35aQrhAbnormalBatch9ReleaseStatus, "staged-source-review");
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(learjet35aQrhAbnormalBatch9), []);
  assert.deepEqual(
    learjet35aQrhAbnormalBatch9.scenarios.map((scenario) => scenario.title),
    [
      "ALTERNATE GEAR EXTENSION/ELECTRICAL MALFUNCTION",
      "ANTI-SKID GEN LIGHT — ANTI-SKID OFF OPERATION",
      "NOSE WHEEL STEERING MALFUNCTION",
    ],
  );
  assert.ok(
    learjet35aQrhAbnormalBatch9.scenarios.every(
      (scenario) =>
        scenario.procedureClass === "abnormal" &&
        scenario.category === "Landing Gear" &&
        scenario.effectivity.kind === "all-aircraft",
    ),
  );
});

test("QRH.3P preserves exact A-26/A-27 page provenance", () => {
  assert.deepEqual(
    learjet35aQrhAbnormalBatch9.scenarios.map((scenario) => [
      scenario.id,
      scenario.sources?.map((item) => item.pageLabel),
    ]),
    [
      ["alternate-gear-extension-electrical-malfunction", ["A-26"]],
      ["anti-skid-gen-light-anti-skid-off-operation", ["A-27"]],
      ["nose-wheel-steering-malfunction", ["A-27"]],
    ],
  );
});

test("QRH.3P preserves the alternate electrical gear-extension sequence and terminal reference", () => {
  const alternate = learjet35aQrhAbnormalBatch9.scenarios.find(
    (scenario) => scenario.id === "alternate-gear-extension-electrical-malfunction",
  );
  assert.ok(alternate);
  const serialized = JSON.stringify(alternate);
  assert.match(serialized, /Airspeed VLO or less/);
  assert.match(serialized, /Landing Gear Switch — DN/);
  assert.match(serialized, /GEAR CB \(copilot’s ess bus\) — PULL/);
  assert.match(serialized, /Emergency Gear Lever \(right side pedestal\) — FULL DOWN/);
  assert.match(serialized, /Gear Lights — CHECK 3 GREEN, 2 RED/);
  assert.match(serialized, /If any gear is not down and locked, refer to GEAR UP LANDING procedure, next page/);
});

test("QRH.3P preserves the anti-skid illuminated-light branch", () => {
  const antiSkid = learjet35aQrhAbnormalBatch9.scenarios.find(
    (scenario) => scenario.id === "anti-skid-gen-light-anti-skid-off-operation",
  );
  assert.ok(antiSkid);
  const steps = flatten(antiSkid.stages[0].steps as readonly AircraftQrhStep[]);
  const condition = steps.find(
    (step) => step.kind === "condition" && step.id === "anti-skid-gen-remains",
  );
  assert.ok(condition && condition.kind === "condition");
  assert.deepEqual(
    condition.branches.map((branch) => branch.label),
    ["If any ANTI-SKID GEN light(s) remain illuminated"],
  );
  const serialized = JSON.stringify(condition);
  assert.match(serialized, /Anti-Skid Switch — OFF/);
  assert.match(serialized, /AFM, Section V for increased stopping distances for takeoff and landing/);
  assert.match(serialized, /Brakes — CAUTIOUSLY APPLY, AS REQ’D/);
  assert.match(serialized, /EMERGENCY BRAKING procedure, Tab 14, Emergency Checklist/);
});

test("QRH.3P keeps taxi and takeoff nose-wheel-steering paths source-distinct", () => {
  const nws = learjet35aQrhAbnormalBatch9.scenarios.find(
    (scenario) => scenario.id === "nose-wheel-steering-malfunction",
  );
  assert.ok(nws);
  const condition = nws.stages[0].steps.find(
    (step) => step.kind === "condition" && step.id === "nose-wheel-steering-context",
  );
  assert.ok(condition && condition.kind === "condition");
  assert.deepEqual(
    condition.branches.map((branch) => branch.label),
    ["At Normal Taxi Speed", "During Takeoff"],
  );
  const taxi = JSON.stringify(condition.branches[0]);
  const takeoff = JSON.stringify(condition.branches[1]);
  assert.match(taxi, /Thrust Levers — IDLE/);
  assert.match(taxi, /Brake to a stop/);
  assert.match(taxi, /Taxi using differential braking and thrust/);
  assert.match(takeoff, /Continue takeoff using rudder and\/or brakes for directional control/);
  assert.doesNotMatch(takeoff, /Thrust Levers — IDLE/);
});

test("QRH.3P visual review found no boxed memory items on A-26/A-27", () => {
  assert.equal(
    JSON.stringify(learjet35aQrhAbnormalBatch9).includes('"memoryItem":true'),
    false,
  );
});

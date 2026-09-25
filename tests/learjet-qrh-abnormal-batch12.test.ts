import assert from "node:assert/strict";
import test from "node:test";

import {
  learjet35aQrhAbnormalBatch12,
  learjet35aQrhAbnormalBatch12ReleaseStatus,
} from "../aircraft-data/learjet-35a/qrh/abnormal-batch-12.ts";
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

test("QRH.3S Thrust Reversers Abnormal batch satisfies the generic v2 contract", () => {
  assert.equal(learjet35aQrhAbnormalBatch12ReleaseStatus, "staged-source-review");
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(learjet35aQrhAbnormalBatch12), []);
  assert.equal(learjet35aQrhAbnormalBatch12.scenarios.length, 6);
  assert.ok(
    learjet35aQrhAbnormalBatch12.scenarios.every(
      (scenario) =>
        scenario.procedureClass === "abnormal" &&
        scenario.category === "Thrust Reversers" &&
        scenario.effectivity.kind === "mapped",
    ),
  );
});

test("QRH.3T accounts for all seven indexed thrust-reverser abnormal entries including A-35.2", () => {
  assert.equal(
    learjet35aQrhAbnormalBatch12.scenarios.length +
      (learjet35aQrhAbnormalBatch12.figures?.length ?? 0),
    7,
  );
  const figure = learjet35aQrhAbnormalBatch12.figures?.[0];
  assert.ok(figure);
  assert.equal(figure.id, "thrust-reverser-restow-envelope");
  assert.equal(figure.geometryPolicy, "source-digitized-visual-reference");
  assert.deepEqual(figure.sources.map((item) => item.pageLabel), ["A-35.2"]);
  assert.deepEqual(figure.xAxis.ticks, [100, 125, 150, 175, 200]);
  assert.deepEqual(figure.yAxis.ticks, [0, 5, 10, 15, 20]);
  assert.deepEqual(
    figure.regions.map((region) => [region.id, region.fill]),
    [
      ["engine-shutdown-or-flight-idle", "shaded"],
      ["engine-shutdown", "hatched"],
    ],
  );
});

test("QRH.3S Aeronca configuration receives only the four Aeronca procedures", () => {
  const filtered = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhAbnormalBatch12,
    configuration("installed", "not-installed"),
  );
  assert.deepEqual(
    filtered.scenarios.map((scenario) => scenario.id),
    [
      "aeronca-inadvertent-thrust-reverser-deployment-during-flight",
      "aeronca-unlock-light-in-flight",
      "aeronca-unlock-light-after-normal-deploy",
      "aeronca-failure-thrust-reverser-to-stow-after-landing",
    ],
  );
});

test("QRH.3S TR-4000 configuration receives only the two textual TR-4000 procedures", () => {
  const filtered = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhAbnormalBatch12,
    configuration("not-installed", "installed"),
  );
  assert.deepEqual(
    filtered.scenarios.map((scenario) => scenario.id),
    [
      "tr4000-annunciated-thrust-reverser-malfunction",
      "tr4000-inadvertent-thrust-reverser-deployment-during-flight",
    ],
  );
});

test("QRH.3S unknown absent partial or contradictory thrust-reverser identity fails closed", () => {
  for (const candidate of [
    configuration("unknown", "unknown"),
    configuration("installed", "installed"),
    configuration("unknown", "not-installed"),
    configuration("not-installed", "unknown"),
  ]) {
    assert.deepEqual(
      filterAbnormalEmergencyForConfiguration(
        learjet35aQrhAbnormalBatch12,
        candidate,
      ).scenarios,
      [],
    );
  }

  const absent: AircraftConfiguration = {
    variant: "source-review",
    equipment: new Set<string>(),
  };
  assert.deepEqual(
    filterAbnormalEmergencyForConfiguration(
      learjet35aQrhAbnormalBatch12,
      absent,
    ).scenarios,
    [],
  );
});

test("QRH.3S preserves exact A-34.1/A-34.2/A-35.1 provenance", () => {
  const pages = new Map(
    learjet35aQrhAbnormalBatch12.scenarios.map((scenario) => [
      scenario.id,
      scenario.sources?.map((item) => item.pageLabel),
    ]),
  );
  assert.deepEqual(
    pages.get("aeronca-inadvertent-thrust-reverser-deployment-during-flight"),
    ["A-34.1"],
  );
  assert.deepEqual(pages.get("aeronca-unlock-light-in-flight"), ["A-34.1"]);
  assert.deepEqual(pages.get("aeronca-unlock-light-after-normal-deploy"), ["A-35.1"]);
  assert.deepEqual(
    pages.get("aeronca-failure-thrust-reverser-to-stow-after-landing"),
    ["A-35.1"],
  );
  assert.deepEqual(
    pages.get("tr4000-annunciated-thrust-reverser-malfunction"),
    ["A-34.2"],
  );
  assert.deepEqual(
    pages.get("tr4000-inadvertent-thrust-reverser-deployment-during-flight"),
    ["A-34.2"],
  );
});

test("QRH.3S preserves Aeronca flight and post-landing source branches", () => {
  const unlock = learjet35aQrhAbnormalBatch12.scenarios.find(
    (scenario) => scenario.id === "aeronca-unlock-light-in-flight",
  );
  const stow = learjet35aQrhAbnormalBatch12.scenarios.find(
    (scenario) =>
      scenario.id === "aeronca-failure-thrust-reverser-to-stow-after-landing",
  );
  assert.ok(unlock);
  assert.ok(stow);

  const unlockConditions = unlock.stages
    .flatMap((stage) => flatten(stage.steps as readonly AircraftQrhStep[]))
    .filter((step) => step.kind === "condition");
  assert.deepEqual(
    unlockConditions.flatMap((step) =>
      step.kind === "condition" ? step.branches.map((branch) => branch.label) : [],
    ),
    ["If UNLOCK Light Extinguishes", "If UNLOCK Light does not Extinguish"],
  );

  const stowCondition = stow.stages
    .flatMap((stage) => flatten(stage.steps as readonly AircraftQrhStep[]))
    .find(
      (step) =>
        step.kind === "condition" && step.id === "aeronca-failure-stow-state",
    );
  assert.ok(stowCondition && stowCondition.kind === "condition");
  assert.deepEqual(
    stowCondition.branches.map((branch) => branch.label),
    [
      "If DEPLOY & BLEED VALVE lights remain on",
      "If DEPLOY light remains on",
      "If UNLOCK light remains on",
    ],
  );
});

test("QRH.3T preserves TR-4000 malfunction/restow behavior and attaches the graphical envelope", () => {
  const annunciated = learjet35aQrhAbnormalBatch12.scenarios.find(
    (scenario) => scenario.id === "tr4000-annunciated-thrust-reverser-malfunction",
  );
  const inadvertent = learjet35aQrhAbnormalBatch12.scenarios.find(
    (scenario) =>
      scenario.id === "tr4000-inadvertent-thrust-reverser-deployment-during-flight",
  );
  assert.ok(annunciated);
  assert.ok(inadvertent);

  const annunciatedText = JSON.stringify(annunciated);
  assert.match(annunciatedText, /T\/R CONTROL & T\/R POWER CBs \(main bus\) — PULL/);
  assert.match(annunciatedText, /Do not use affected reverser on landing/);

  const inadvertentText = JSON.stringify(inadvertent);
  assert.match(inadvertentText, /Assure Restow Envelope/);
  assert.match(inadvertentText, /Above 160 KIAS/);
  assert.match(inadvertentText, /DEPLOY light stops flashing, ARM light goes out, and restow has occurred/);
  assert.deepEqual(inadvertent.figureIds, ["thrust-reverser-restow-envelope"]);
  assert.equal("boundaryNote" in inadvertent, false);
});

test("QRH.3S visual review found no boxed memory items on the textual thrust-reverser pages", () => {
  const steps = learjet35aQrhAbnormalBatch12.scenarios.flatMap((scenario) =>
    scenario.stages.flatMap((stage) =>
      flatten(stage.steps as readonly AircraftQrhStep[]),
    ),
  );
  assert.equal(
    steps.some(
      (step) => step.kind === "action" && step.memoryItem === true,
    ),
    false,
  );
});

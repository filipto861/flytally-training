import assert from "node:assert/strict";
import test from "node:test";

import {
  assertLearjet35aQrhPackageComplete,
  learjet35aQrhPackage,
  learjet35aQrhSourceBatches,
} from "../aircraft-data/learjet-35a/qrh/package.ts";
import { learjet35aQrhSourceInventory } from "../aircraft-data/learjet-35a/qrh/source-inventory.ts";
import {
  collectEmbeddedConfigurationEquipmentKeys,
  collectEmbeddedModificationKeys,
} from "../lib/content-applicability-binding.ts";
import { collectEmbeddedManualIds } from "../lib/content-source-binding.ts";
import { validateUniversalAbnormalEmergencyPayload } from "../lib/universal-abnormal-emergency.ts";

test("QRH.3U aggregate is one valid publishable v2 package", () => {
  assert.doesNotThrow(() => assertLearjet35aQrhPackageComplete());
  assert.equal(learjet35aQrhSourceBatches.length, 19);
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(learjet35aQrhPackage), []);
  assert.equal(learjet35aQrhPackage.aircraftId, "learjet-35a");
  assert.equal(learjet35aQrhPackage.sourcePolicy, "available-sources");
  assert.deepEqual(collectEmbeddedManualIds(learjet35aQrhPackage), ["CL-102B"]);
  assert.doesNotMatch(learjet35aQrhPackage.title, /staged|partial/i);
  assert.doesNotMatch(learjet35aQrhPackage.sourceNote ?? "", /not a complete publishable/i);
});

test("QRH.3U reconciles the complete CL-102B Emergency and Abnormal indexes", () => {
  const emergencyInventory = learjet35aQrhSourceInventory.sections.find(
    (section) => section.kind === "emergency",
  );
  const abnormalInventory = learjet35aQrhSourceInventory.sections.find(
    (section) => section.kind === "abnormal",
  );
  assert.ok(emergencyInventory);
  assert.ok(abnormalInventory);

  const emergencyScenarioCount = learjet35aQrhPackage.scenarios.filter(
    (scenario) => scenario.procedureClass === "emergency",
  ).length;
  const abnormalScenarioCount = learjet35aQrhPackage.scenarios.filter(
    (scenario) => scenario.procedureClass === "abnormal",
  ).length;

  assert.equal(emergencyScenarioCount, 29);
  assert.equal(abnormalScenarioCount, 64);
  assert.equal(learjet35aQrhPackage.scenarios.length, 93);

  const emergencyIndexCount = emergencyInventory.categories.reduce(
    (count, category) => count + category.procedures.length,
    0,
  );
  const abnormalIndexCount = abnormalInventory.categories.reduce(
    (count, category) => count + category.procedures.length,
    0,
  );

  assert.equal(emergencyScenarioCount + 1, emergencyIndexCount);
  assert.equal(abnormalScenarioCount + 1, abnormalIndexCount);
  assert.deepEqual(
    learjet35aQrhPackage.figures?.map((figure) => figure.id),
    ["airstart-envelope", "thrust-reverser-restow-envelope"],
  );
});

test("QRH.3U package has no duplicate scenario, figure or section-introduction identities", () => {
  const scenarioIds = learjet35aQrhPackage.scenarios.map((scenario) => scenario.id);
  const figureIds = (learjet35aQrhPackage.figures ?? []).map((figure) => figure.id);
  const introClasses = (learjet35aQrhPackage.sectionIntroductions ?? []).map(
    (intro) => intro.procedureClass,
  );

  assert.equal(new Set(scenarioIds).size, scenarioIds.length);
  assert.equal(new Set(figureIds).size, figureIds.length);
  assert.deepEqual(introClasses, ["emergency", "abnormal"]);
});

test("QRH.3U package closes the three Electrical emergency inventory omissions", () => {
  const electrical = learjet35aQrhPackage.scenarios.filter(
    (scenario) =>
      scenario.procedureClass === "emergency"
      && scenario.category === "Electrical",
  );
  assert.deepEqual(
    electrical.map((scenario) => scenario.title),
    [
      "AC INVERTER FAILURE — TOTAL",
      "GENERATOR FAILURE (DUAL)",
      "BATTERY OVERHEAT LIGHT(S) (NICAD ONLY)",
      "CURRENT LIMITER FAILURE",
      "ESSENTIAL BUS FAILURE — DC POWER LOSS",
    ],
  );
});

test("QRH.3U both graphical index entries remain visual-reference-only", () => {
  const figures = learjet35aQrhPackage.figures ?? [];
  assert.equal(figures.length, 2);
  assert.ok(
    figures.every(
      (figure) => figure.geometryPolicy === "source-digitized-visual-reference",
    ),
  );
  assert.deepEqual(
    figures.flatMap((figure) => figure.sources.map((source) => source.pageLabel)),
    ["E-13", "A-35.2"],
  );
  assert.doesNotMatch(JSON.stringify(figures), /interpolation|lookupTable/);
});


test("QRH.3U exposes the exact configuration facts governance must register", () => {
  assert.deepEqual(
    [...collectEmbeddedModificationKeys(learjet35aQrhPackage)].sort(),
    ["amk-76-7", "amk-78-13", "amk-85-1", "amk-90-3"],
  );
  assert.deepEqual(
    [...collectEmbeddedConfigurationEquipmentKeys(learjet35aQrhPackage)].sort(),
    [
      "emergency-airflow",
      "fuselage-valve-switch",
      "lo-hyd-light",
      "mach-trim",
      "pitch-trim-light",
      "rosemount-pitot-static-system",
      "thrust-reverser-aeronca",
      "thrust-reverser-tr4000",
      "windshield-defog",
    ],
  );
});

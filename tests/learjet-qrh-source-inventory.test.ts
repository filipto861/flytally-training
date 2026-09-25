import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { learjet35aChecklistSourceManifest } from "../aircraft-data/learjet-35a/checklists/source-manifest.ts";
import {
  learjet35aQrhContractAudit,
  learjet35aQrhSourceInventory,
} from "../aircraft-data/learjet-35a/qrh/source-inventory.ts";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("QRH.1 inventory reuses the reviewed CL-102B source identity", () => {
  assert.equal(
    learjet35aQrhSourceInventory.source.manualId,
    learjet35aChecklistSourceManifest.manualId,
  );
  assert.equal(
    learjet35aQrhSourceInventory.source.revisionId,
    learjet35aChecklistSourceManifest.revisionId,
  );
  assert.equal(
    learjet35aQrhSourceInventory.source.authorityRole,
    "OPERATING_REFERENCE",
  );
  assert.match(
    learjet35aQrhSourceInventory.source.operationalPrecedence,
    /AFM takes precedence/i,
  );
});

test("QRH.1 inventory captures both CL-102B operational sections without publishing procedure content", () => {
  const [emergency, abnormal] = learjet35aQrhSourceInventory.sections;

  assert.equal(emergency?.kind, "emergency");
  assert.deepEqual(emergency?.introPageLabels, ["E-i", "E-ii"]);
  assert.deepEqual(emergency?.indexPageLabels, ["E-1", "E-2"]);
  assert.equal(emergency?.firstProcedurePageLabel, "E-4");
  assert.equal(emergency?.categories.length, 11);
  assert.equal(
    emergency?.categories.reduce(
      (count, category) => count + category.procedures.length,
      0,
    ),
    30,
  );

  assert.equal(abnormal?.kind, "abnormal");
  assert.deepEqual(abnormal?.introPageLabels, ["A-i", "A-ii"]);
  assert.deepEqual(abnormal?.indexPageLabels, ["A-1", "A-1.1", "A-2", "A-3"]);
  assert.equal(abnormal?.firstProcedurePageLabel, "A-4");
  assert.equal(abnormal?.categories.length, 13);
  assert.equal(
    abnormal?.categories.reduce(
      (count, category) => count + category.procedures.length,
      0,
    ),
    65,
  );

  const inventorySource = read("aircraft-data/learjet-35a/qrh/source-inventory.ts");
  assert.doesNotMatch(inventorySource, /AircraftAbnormalEmergencyContent/);
  assert.doesNotMatch(inventorySource, /scenarios\s*:/);
});

test("QRH.1 preserves source memory and page-effectivity semantics explicitly", () => {
  assert.match(
    learjet35aQrhSourceInventory.source.memoryItemSemantics,
    /boxed presentation/i,
  );
  assert.match(
    learjet35aQrhSourceInventory.source.memoryItemSemantics,
    /must not be inferred/i,
  );
  assert.match(
    learjet35aQrhSourceInventory.source.effectivitySemantics,
    /page-level effectivity/i,
  );

  const effectivity = learjet35aQrhSourceInventory.sections
    .flatMap((section) => section.effectivityFamilies)
    .map((family) => `${family.pageLabels.join(" ")} ${family.sourceEffectivity}`)
    .join("\n");

  assert.match(effectivity, /AMK 85-1/);
  assert.match(effectivity, /AMK 78-13/);
  assert.match(effectivity, /AMK 76-7/);
  assert.match(effectivity, /Rosemount/);
  assert.match(effectivity, /Aeronca/);
  assert.match(effectivity, /TR-4000/);
  assert.match(effectivity, /no-reverser/i);
});

test("QRH.1 contract audit names the current source-fidelity gaps", () => {
  assert.deepEqual(
    learjet35aQrhContractAudit.gaps.map((gap) => gap.id),
    [
      "procedure-class",
      "memory-items",
      "training-required-fields",
      "conditional-structure",
      "serial-effectivity",
      "section-intro",
    ],
  );

  const universal = read("lib/universal-abnormal-emergency.ts");
  const operational = read("components/operational-emergency.tsx");
  const applicability = read("lib/universal-aircraft-content.ts");

  assert.match(universal, /difficulty:/);
  assert.match(universal, /minutes:/);
  assert.match(universal, /setup:/);
  assert.match(universal, /objectives:/);
  assert.match(universal, /debrief:/);
  assert.match(universal, /prompt:/);
  assert.match(universal, /explanation:/);

  assert.match(operational, /<span>EMERGENCY<\/span>/);
  assert.match(operational, /\/immediate\|memory\/i/);

  const applicabilityStart = applicability.indexOf("export type AircraftApplicability");
  assert.ok(applicabilityStart >= 0);
  const applicabilityBlock = applicability.slice(
    applicabilityStart,
    applicability.indexOf("};", applicabilityStart) + 2,
  );
  assert.doesNotMatch(applicabilityBlock, /serial/i);
});

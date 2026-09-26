import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { learjet35aReferencePerformanceSourceInventory } from "../aircraft-data/learjet-35a/reference-performance/source-inventory.ts";

const inventory = learjet35aReferencePerformanceSourceInventory;

function family(id: string) {
  const match = inventory.families.find((candidate) => candidate.id === id);
  assert.ok(match, `missing source family: ${id}`);
  return match;
}

test("15.2 source inventory is CL-102B-bound and explicitly non-operational", () => {
  assert.equal(inventory.status, "source-inventory-only");
  assert.equal(inventory.aircraftId, "learjet-35a");
  assert.equal(inventory.source.manualId, "CL-102B");
  assert.equal(inventory.source.currentChange, "Change 2 · May 2008");
  assert.equal(
    inventory.guardrails.some((note) => /not an operational performance dataset/i.test(note)),
    true,
  );
});

test("15.2 climb inventory preserves ALL effectivity and the published climb schedule", () => {
  const climb = family("climb-two-engine");
  assert.equal(climb.status, "available");
  assert.equal(climb.applicability, "all");
  assert.deepEqual(climb.sourcePages.all, [
    "P-19", "P-20", "P-21", "P-22", "P-23",
    "P-24", "P-25", "P-26", "P-27", "P-28",
  ]);
  assert.equal(
    climb.sourceNotes.some((note) => /250 KIAS up to 32,000 ft; 0\.70 MI above 32,000 ft/.test(note)),
    true,
  );
  assert.equal(
    climb.sourceNotes.some((note) => /do not create an FC-200\/FC-530 split/i.test(note)),
    true,
  );
});

test("15.2 cruise inventory keeps Rosemount source families separate", () => {
  for (const id of [
    "long-range-cruise-two-engine",
    "normal-cruise-two-engine",
    "long-range-cruise-one-engine",
  ]) {
    const cruise = family(id);
    assert.equal(cruise.status, "available");
    assert.equal(cruise.applicability, "rosemount-split");
    assert.ok(cruise.sourcePages.withoutRosemount?.length);
    assert.ok(cruise.sourcePages.withRosemount?.length);
  }

  const normal = family("normal-cruise-two-engine");
  assert.equal(
    normal.sourceNotes.some((note) => /Mach 0\.77/.test(note)),
    true,
  );
  assert.equal(
    normal.sourceNotes.some((note) => /Mach 0\.75/.test(note)),
    true,
  );
});

test("15.2 inventory records only direct source outputs before runtime design", () => {
  assert.deepEqual(
    family("climb-two-engine").directOutputs,
    [
      "time · min",
      "distance · NM",
      "fuel · lb",
    ],
  );
  assert.deepEqual(
    family("long-range-cruise-two-engine").directOutputs,
    ["Mach indicated", "KTAS", "specific range · NM/lb"],
  );
  assert.deepEqual(
    family("normal-cruise-two-engine").directOutputs,
    ["KTAS", "fuel flow · lb/hr"],
  );
  assert.deepEqual(
    family("long-range-cruise-one-engine").directOutputs,
    [
      "Mach indicated or KIAS as printed for the altitude row",
      "KTAS",
      "fuel flow · lb/hr",
    ],
  );
});

test("15.2 High-Speed Cruise remains source-gated instead of invented from training narrative", () => {
  const highSpeed = family("high-speed-cruise-two-engine");
  assert.equal(highSpeed.status, "not-in-reviewed-source");
  assert.deepEqual(highSpeed.sourcePages, {});
  assert.deepEqual(highSpeed.directOutputs, []);
  assert.equal(
    highSpeed.sourceNotes.some((note) => /not sufficient for operational digitization/i.test(note)),
    true,
  );
});

test("15.2 inventory is not registered in the Takeoff/Landing bundled Performance package", () => {
  const performancePackage = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/performance/package.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(performancePackage, /reference-performance/);
  assert.doesNotMatch(performancePackage, /long-range-cruise-two-engine/);
  assert.doesNotMatch(performancePackage, /normal-cruise-two-engine/);
});

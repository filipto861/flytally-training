import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { learjet35aNormalChecklist } from "../aircraft-data/learjet-35a/checklists/normal-checklist.ts";
import { learjet35aChecklistSourceManifest } from "../aircraft-data/learjet-35a/checklists/source-manifest.ts";
import {
  filterChecklistForConfiguration,
  type AircraftConfiguration,
} from "../lib/aircraft-applicability.ts";
import { collectEmbeddedManualIds } from "../lib/content-source-binding.ts";
import { validateUniversalTrainingContentPayload } from "../lib/universal-aircraft-content.ts";

const fc530Standard: AircraftConfiguration = {
  variant: "fc530-standard",
  baseVariant: "35a",
  equipment: new Set([
    "msfs-flysimware",
    "fc-530",
    "rosemount-pitot-static",
    "tfe731-2-2b",
    "standard-flaps",
  ]),
  capabilityTags: new Set([
    "simulator-training",
    "fc530-autopilot",
    "standard-flaps",
  ]),
  modifications: new Map([
    ["zr-lite", "not-installed"],
  ]),
  configurationEquipment: new Map([
    ["autopilot", "installed"],
    ["pitot-static", "installed"],
    ["engine", "installed"],
    ["thrust-reverser", "unknown"],
    ["drag-chute", "unknown"],
  ]),
};

function itemIds(content = learjet35aNormalChecklist): readonly string[] {
  return content.phases.flatMap((phase) => phase.items.map((item) => item.id));
}

test("15.3b CL-102B checklist satisfies the universal checklist contract", () => {
  assert.deepEqual(
    validateUniversalTrainingContentPayload("checklists", learjet35aNormalChecklist),
    [],
  );
  assert.equal(learjet35aNormalChecklist.aircraftId, "learjet-35a");
  assert.equal(learjet35aNormalChecklist.sourcePolicy, "available-sources");
  assert.deepEqual(collectEmbeddedManualIds(learjet35aNormalChecklist), ["CL-102B"]);
});

test("15.3b normal checklist phase order covers CL-102B N-2 through N-18 without owning landing performance", () => {
  assert.deepEqual(
    learjet35aNormalChecklist.phases.map((phase) => phase.id),
    [
      "exterior-preflight",
      "cabin-preflight",
      "before-starting-engines",
      "starting-engines",
      "before-taxi-two-engine",
      "taxi-before-takeoff-two-engine",
      "before-taxi-one-engine",
      "taxi-before-takeoff-one-engine",
      "runway-lineup",
      "after-takeoff",
      "climb",
      "cruise",
      "descent",
      "approach",
      "before-landing",
      "go-around",
      "after-landing",
      "shutdown",
      "quick-turnaround",
    ],
  );
  assert.ok(!learjet35aNormalChecklist.phases.some((phase) => /landing speeds/i.test(phase.title)));
  assert.ok(!itemIds().some((id) => id.includes("landing-distance")));
});

test("15.3b source item ids are globally unique for canonical checklist-session persistence", () => {
  const ids = itemIds();
  assert.equal(new Set(ids).size, ids.length);
});

test("15.3b fc530-standard selects Rosemount and FC-530 items while failing closed on unknown TR and drag chute", () => {
  const filtered = filterChecklistForConfiguration(
    learjet35aNormalChecklist,
    fc530Standard,
  );
  const ids = new Set(itemIds(filtered));

  assert.ok(ids.has("bse-static-source"));
  assert.ok(ids.has("bse-trim-speed-fc530"));
  assert.ok(ids.has("bse-trim-monitor-fc530"));

  assert.ok(!ids.has("bse-alt-static"));
  assert.ok(!ids.has("bse-pilot-altimeter"));

  assert.ok(!ids.has("tbto2-thrust-reversers"));
  assert.ok(!ids.has("tbto1-thrust-reversers"));
  assert.ok(!ids.has("exterior-drag-chute"));
  assert.ok(!ids.has("bse-drag-chute"));

  assert.ok(!ids.has("lineup-tr4000"));
  assert.ok(!ids.has("approach-aeronca-position"));
  assert.ok(!ids.has("afterto-fc200-appr"));
  assert.ok(!ids.has("beforeldg-yaw-fc200"));
});

test("15.3b source-qualified optional equipment remains explicit without inventing unregistered applicability tags", () => {
  const filtered = filterChecklistForConfiguration(
    learjet35aNormalChecklist,
    fc530Standard,
  );
  const byId = new Map(
    filtered.phases.flatMap((phase) => phase.items.map((item) => [item.id, item] as const)),
  );

  assert.match(byId.get("bse-emergency-lights")?.challenge ?? "", /if installed/i);
  assert.match(byId.get("start-aux-heat")?.challenge ?? "", /if installed/i);
  assert.match(byId.get("bt2-coffee")?.challenge ?? "", /if installed/i);
  assert.match(byId.get("tbto2-heated-windshield")?.challenge ?? "", /if installed/i);
  assert.match(byId.get("bse-fuselage-valve")?.challenge ?? "", /if installed/i);
  assert.match(byId.get("bse-in-normal-out-defog")?.challenge ?? "", /if installed/i);
});




test("15.3b every embedded applicability identifier is registered by the current Learjet profile", () => {
  const registeredEquipment = new Set([
    "msfs-flysimware",
    "fc-530",
    "rosemount-pitot-static",
    "tfe731-2-2b",
    "standard-flaps",
  ]);
  const registeredConfigurationEquipment = new Set([
    "autopilot",
    "pitot-static",
    "engine",
    "thrust-reverser",
    "drag-chute",
  ]);

  for (const phase of learjet35aNormalChecklist.phases) {
    for (const item of phase.items) {
      for (const key of item.applicability?.equipmentAllOf ?? []) {
        assert.ok(registeredEquipment.has(key), `unregistered equipment applicability: ${key}`);
      }
      for (const key of item.applicability?.equipmentAnyOf ?? []) {
        assert.ok(registeredEquipment.has(key), `unregistered equipment applicability: ${key}`);
      }
      for (const key of item.applicability?.equipmentNoneOf ?? []) {
        assert.ok(registeredEquipment.has(key), `unregistered equipment applicability: ${key}`);
      }
      for (const key of item.applicability?.configurationEquipmentAllOf ?? []) {
        assert.ok(
          registeredConfigurationEquipment.has(key),
          `unregistered configuration-equipment applicability: ${key}`,
        );
      }
      for (const key of item.applicability?.configurationEquipmentAnyOf ?? []) {
        assert.ok(
          registeredConfigurationEquipment.has(key),
          `unregistered configuration-equipment applicability: ${key}`,
        );
      }
      for (const key of item.applicability?.configurationEquipmentNoneOf ?? []) {
        assert.ok(
          registeredConfigurationEquipment.has(key),
          `unregistered configuration-equipment applicability: ${key}`,
        );
      }
    }
  }
});

test("15.3b governed CL-102B source manifest matches the reviewed file and operational authority boundary", () => {
  assert.equal(learjet35aChecklistSourceManifest.manualId, "CL-102B");
  assert.equal(learjet35aChecklistSourceManifest.revision, "Change 2");
  assert.equal(learjet35aChecklistSourceManifest.issueDate, "2008-05");
  assert.equal(
    learjet35aChecklistSourceManifest.checksumSha256,
    "6fbddb29b1166f4e2b3093f8fb14c924fd08d0e28cb113ed6de6dd27c98ac049",
  );
  assert.equal(
    learjet35aChecklistSourceManifest.authorityRole,
    "OPERATING_REFERENCE",
  );
  assert.match(
    learjet35aChecklistSourceManifest.authorityNote,
    /AFM takes precedence/i,
  );
});

test("15.3b publication tooling is guarded by explicit operator confirmation", () => {
  const tool = fs.readFileSync(
    new URL("../tooling/publish-learjet-checklist.ts", import.meta.url),
    "utf8",
  );

  assert.match(tool, /CONFIRM_LEARJET_CHECKLIST_PUBLISH !== "yes"/);
  assert.match(tool, /validateUniversalTrainingContentPayload/);
  assert.match(tool, /registerGovernedManualRevision/);
  assert.match(tool, /createGovernedDraftVersion/);
  assert.match(tool, /approveGovernedContentVersion/);
  assert.match(tool, /publishGovernedContentVersion/);
});

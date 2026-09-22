import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { configurationForVariant } from "../lib/aircraft-applicability.ts";
import {
  legacyOperationalChecklistStorageKey,
  restoreChecklistSessionWithLegacyMigration,
  type ChecklistCanonicalStorage,
  type LegacyOperationalChecklistStorage,
} from "../lib/checklist-session-migration.ts";
import { checklistSessionStorageKey } from "../lib/checklist-session.ts";
import type { RuntimeChecklist } from "../lib/checklist-runtime.ts";
import { fastPathTabForShortcut, fastPathTabs } from "../lib/fast-path/panel-state.ts";
import { resolveFastPathQrh } from "../lib/fast-path/qrh-adapter.ts";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("P5.1 freezes the W3 fast-path tabs and shortcut order", () => {
  assert.deepEqual([...fastPathTabs], ["checklist", "qrh", "perf", "ref"]);
  assert.equal(fastPathTabForShortcut({ ctrlKey: true, shiftKey: true, code: "Digit1" }), "checklist");
  assert.equal(fastPathTabForShortcut({ ctrlKey: true, shiftKey: true, code: "Digit2" }), "qrh");
  assert.equal(fastPathTabForShortcut({ ctrlKey: true, shiftKey: true, code: "Digit3" }), "perf");
  assert.equal(fastPathTabForShortcut({ ctrlKey: true, shiftKey: true, code: "Digit4" }), "ref");
});

test("P5.1 records M50/M54 as the QRH source of truth", () => {
  const fly = read("app/aircraft/[aircraftId]/fly/page.tsx");

  assert.match(fly, /isUniversalAbnormalEmergencyContent/);
  assert.match(fly, /filterAbnormalEmergencyForConfiguration/);
  assert.match(fly, /toOperationalEmergency/);
  assert.doesNotMatch(fly, /normalizeLegacyAbnormalTraining|normalizeUniversalAbnormalEmergency/);
});

test("P5.1 keeps operational QRH free of training-only fields", () => {
  const mapper = read("lib/operational-flight-data.ts");
  const emergency = read("components/operational-emergency.tsx");

  assert.match(mapper, /expectedResponse: \[\.\.\.stage\.expectedResponse\]/);
  assert.match(mapper, /sources: stage\.sources\.map/);
  assert.match(emergency, /stage\.expectedResponse\.map/);
  assert.match(emergency, /Source &amp; authority/);

  for (const pattern of [
    /scenario\.setup/,
    /scenario\.objectives/,
    /scenario\.debrief/,
    /stage\.prompt/,
    /stage\.explanation/,
    /scenario\.minutes/,
    /scenario\.difficulty/,
  ]) {
    assert.doesNotMatch(emergency, pattern);
  }
});

test("P5.1 preserves the canonical shared checklist-session key", () => {
  const session = read("lib/checklist-session.ts");
  const adapter = read("lib/fast-path/checklist-adapter.ts");

  assert.match(session, /flytally-training-checklist-session:/);
  assert.match(adapter, /checklistSessionStorageKey/);
  assert.doesNotMatch(adapter, /flytally:flight-checklist:v1:/);
});

test("P5.1 explicitly isolates the legacy operational checklist storage for P5.5", () => {
  const operationalChecklist = read("components/operational-checklist.tsx");

  assert.match(operationalChecklist, /flytally:flight-checklist:v1:/);
  assert.match(operationalChecklist, /window\.localStorage/);
  assert.match(operationalChecklist, /type StoredFlightChecklist/);
  assert.doesNotMatch(operationalChecklist, /checklistSessionStorageKey/);
});

test("P5.1 keeps REF owned by P7 and outside P5", () => {
  const roadmap = read("REDESIGN.md");
  const inventory = read("P5_OPERATIONAL_FAST_PATH.md");

  assert.match(roadmap, /P7 — Reference \/ REF fast-path closure/);
  assert.match(roadmap, /REF is no longer part of P5/);
  assert.match(inventory, /REF.*Not P5.*owned by P7/i);
});

test("P5 reusable operational paths remain aircraft-agnostic", () => {
  const source = [
    read("components/ft-fast-path/FtFastPathPanel.tsx"),
    read("components/ft-fast-path/FtFastPathChecklist.tsx"),
    read("components/operational-emergency.tsx"),
    read("lib/fast-path/checklist-adapter.ts"),
    read("lib/operational-flight-data.ts"),
  ].join("\n");

  assert.doesNotMatch(source, /learjet|35a|tfe731|bristell|cessna|boeing|rotax/i);
  assert.doesNotMatch(source, /aircraft\.model\s*===/i);
});


const qrhPayload = {
  aircraftId: "generic-aircraft",
  title: "Generic Emergency",
  scenarios: [
    {
      id: "applicable",
      title: "Applicable Emergency",
      category: "Generic",
      phase: "In flight",
      difficulty: "core",
      minutes: 1,
      summary: "Training summary that must not enter operational output.",
      setup: "Training setup that must not enter operational output.",
      objectives: ["Recognize the condition."],
      debrief: ["Review the response."],
      applicability: { equipmentAllOf: ["eq-a"] },
      stages: [
        {
          id: "memory",
          label: "Immediate action",
          prompt: "Training prompt.",
          expectedResponse: ["Action A"],
          explanation: "Training explanation.",
          sources: [{ manualId: "generic-source", pageLabel: "1" }],
        },
        {
          id: "filtered-stage",
          label: "Filtered stage",
          prompt: "Training prompt.",
          expectedResponse: ["Action B"],
          explanation: "Training explanation.",
          applicability: { equipmentAllOf: ["eq-b"] },
          sources: [{ manualId: "generic-source", pageLabel: "2" }],
        },
      ],
    },
    {
      id: "filtered-scenario",
      title: "Filtered Emergency",
      category: "Generic",
      phase: "In flight",
      difficulty: "core",
      minutes: 1,
      summary: "Filtered summary.",
      setup: "Filtered setup.",
      objectives: ["Filtered objective."],
      debrief: ["Filtered debrief."],
      applicability: { equipmentAllOf: ["eq-b"] },
      stages: [
        {
          id: "filtered-only-stage",
          label: "Filtered action",
          prompt: "Filtered prompt.",
          expectedResponse: ["Filtered action"],
          explanation: "Filtered explanation.",
          sources: [{ manualId: "generic-source", pageLabel: "3" }],
        },
      ],
    },
  ],
};

test("P5.2 QRH adapter fails closed for readiness and invalid payloads", () => {
  const configuration = configurationForVariant(undefined, ["eq-a"]);

  assert.equal(resolveFastPathQrh(qrhPayload, configuration, false), undefined);
  assert.equal(resolveFastPathQrh({ aircraftId: "generic-aircraft" }, configuration, true), undefined);
});

test("P5.2 QRH adapter applies existing configuration filtering before projection", () => {
  const qrh = resolveFastPathQrh(
    qrhPayload,
    configurationForVariant(undefined, ["eq-a"]),
    true,
  );

  assert.ok(qrh);
  assert.deepEqual(qrh.scenarios.map((scenario) => scenario.id), ["applicable"]);
  assert.deepEqual(qrh.scenarios[0]?.stages.map((stage) => stage.id), ["memory"]);
});

test("P5.2 QRH adapter reuses the operational DTO and strips training interaction", () => {
  const qrh = resolveFastPathQrh(
    qrhPayload,
    configurationForVariant(undefined, ["eq-a"]),
    true,
  );

  assert.ok(qrh);
  const serialized = JSON.stringify(qrh);
  assert.match(serialized, /Action A/);
  assert.match(serialized, /generic-source/);
  assert.doesNotMatch(serialized, /Training summary|Training setup|Recognize the condition|Review the response|Training prompt|Training explanation/);
});


test("P5.3 shell loads only source-authoritative QRH data through the P5 adapter", () => {
  const shell = read("components/ft-shell/FtShell.tsx");

  assert.match(shell, /getPublishedAircraftModule<unknown>[\s\S]*"abnormal"/);
  assert.match(shell, /getOperationalFlightReadiness\(aircraftId\)/);
  assert.match(shell, /resolveFastPathQrh\([\s\S]*operationalReadiness\.abnormal\.ready/);
  assert.match(shell, /emergency=\{emergency\}/);
  assert.doesNotMatch(shell, /normalizeLegacyAbnormalTraining|normalizeUniversalAbnormalEmergency/);
});

test("P5.3 fills the existing QRH slot without changing W3 or REF ownership", () => {
  const panel = read("components/ft-fast-path/FtFastPathPanel.tsx");
  const qrh = read("components/ft-fast-path/FtFastPathQrh.tsx");

  assert.match(panel, /activeTab === "qrh"/);
  assert.match(panel, /<FtFastPathQrh emergency=\{emergency\} \/>/);
  assert.match(panel, /activeTab === "perf"/);
  assert.match(panel, /<FtFastPathPlaceholder tab=\{activeTab\} \/>/);
  assert.match(qrh, /<OperationalEmergency emergency=\{emergency\} \/>/);
  assert.match(qrh, /QRH unavailable/);
});


test("P5.4 checklist training and fast path share one canonical session contract", () => {
  const runner = read("components/checklist-runner.tsx");
  const adapter = read("lib/fast-path/checklist-adapter.ts");
  const session = read("lib/checklist-session.ts");

  assert.match(runner, /checklistSessionStorageKey/);
  assert.match(runner, /window\.sessionStorage\.getItem/);
  assert.match(runner, /window\.sessionStorage\.setItem/);

  assert.match(adapter, /checklistSessionStorageKey/);
  assert.match(adapter, /normalizeChecklistSessionSnapshot/);

  const keyPrefix = /flytally-training-checklist-session:/g;
  assert.equal((session.match(keyPrefix) ?? []).length, 1);
  assert.doesNotMatch(runner, /flytally:flight-checklist:v1:/);
  assert.doesNotMatch(adapter, /flytally:flight-checklist:v1:/);
});


const migrationChecklist: RuntimeChecklist = {
  aircraftId: "generic-aircraft",
  title: "Generic Checklist",
  phases: [
    {
      id: "phase-a",
      title: "Phase A",
      items: [
        { id: "item-a", challenge: "Item A" },
        { id: "item-b", challenge: "Item B" },
      ],
    },
    {
      id: "phase-b",
      title: "Phase B",
      items: [{ id: "item-c", challenge: "Item C" }],
    },
  ],
};

function memoryCanonical(
  initial: Readonly<Record<string, string>> = {},
): ChecklistCanonicalStorage & { values: Map<string, string> } {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

function memoryLegacy(
  initial: Readonly<Record<string, string>> = {},
): LegacyOperationalChecklistStorage & { values: Map<string, string> } {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

test("P5.5 legacy checklist key matches the pre-existing OperationalChecklist identity", () => {
  assert.equal(
    legacyOperationalChecklistStorageKey(migrationChecklist, "variant-a"),
    "flytally:flight-checklist:v1:generic-aircraft:variant-a:Generic Checklist",
  );
});

test("P5.5 valid legacy progress migrates once into the canonical checklist session", () => {
  const legacyKey = legacyOperationalChecklistStorageKey(
    migrationChecklist,
    "variant-a",
  );
  const canonicalKey = checklistSessionStorageKey(
    migrationChecklist,
    "variant-a",
  );
  const canonical = memoryCanonical();
  const legacy = memoryLegacy({
    [legacyKey]: JSON.stringify({
      version: 1,
      phaseId: "phase-b",
      completedIds: ["item-a", "item-c"],
    }),
  });

  const migrated = restoreChecklistSessionWithLegacyMigration(
    migrationChecklist,
    canonical,
    legacy,
    "variant-a",
  );

  assert.equal(migrated.mode, "run");
  assert.equal(migrated.selectedPhaseId, "phase-b");
  assert.deepEqual(migrated.completedIds, ["item-a", "item-c"]);
  assert.deepEqual(migrated.revealedFlowPhaseIds, []);
  assert.deepEqual(migrated.revealedResponseIds, []);
  assert.equal(legacy.getItem(legacyKey), null);
  assert.equal(canonical.getItem(canonicalKey), JSON.stringify(migrated));
});

test("P5.5 stale legacy phase and item identities reconcile to current checklist content", () => {
  const legacyKey = legacyOperationalChecklistStorageKey(migrationChecklist);
  const canonical = memoryCanonical();
  const legacy = memoryLegacy({
    [legacyKey]: JSON.stringify({
      version: 1,
      phaseId: "removed-phase",
      completedIds: ["item-a", "removed-item", "item-a"],
    }),
  });

  const migrated = restoreChecklistSessionWithLegacyMigration(
    migrationChecklist,
    canonical,
    legacy,
  );

  assert.equal(migrated.selectedPhaseId, "phase-a");
  assert.deepEqual(migrated.completedIds, ["item-a"]);
  assert.equal(legacy.getItem(legacyKey), null);
});

test("P5.5 malformed or future legacy payload fails closed and is consumed", () => {
  for (const raw of [
    "{not-json",
    JSON.stringify({
      version: 99,
      phaseId: "phase-b",
      completedIds: ["item-a"],
    }),
    JSON.stringify({
      version: 1,
      phaseId: "phase-b",
      completedIds: "item-a",
    }),
  ]) {
    const legacyKey = legacyOperationalChecklistStorageKey(migrationChecklist);
    const canonicalKey = checklistSessionStorageKey(migrationChecklist);
    const canonical = memoryCanonical();
    const legacy = memoryLegacy({ [legacyKey]: raw });

    const restored = restoreChecklistSessionWithLegacyMigration(
      migrationChecklist,
      canonical,
      legacy,
    );

    assert.equal(restored.selectedPhaseId, "phase-a");
    assert.deepEqual(restored.completedIds, []);
    assert.equal(legacy.getItem(legacyKey), null);
    assert.equal(canonical.getItem(canonicalKey), JSON.stringify(restored));
  }
});

test("P5.5 existing canonical state is authoritative and legacy state cannot resurrect", () => {
  const canonicalKey = checklistSessionStorageKey(
    migrationChecklist,
    "variant-a",
  );
  const legacyKey = legacyOperationalChecklistStorageKey(
    migrationChecklist,
    "variant-a",
  );
  const canonicalSnapshot = {
    version: 1,
    mode: "run",
    selectedPhaseId: "phase-a",
    completedIds: ["item-b"],
    revealedFlowPhaseIds: [],
    revealedResponseIds: [],
  };
  const canonical = memoryCanonical({
    [canonicalKey]: JSON.stringify(canonicalSnapshot),
  });
  const legacy = memoryLegacy({
    [legacyKey]: JSON.stringify({
      version: 1,
      phaseId: "phase-b",
      completedIds: ["item-a", "item-c"],
    }),
  });

  const restored = restoreChecklistSessionWithLegacyMigration(
    migrationChecklist,
    canonical,
    legacy,
    "variant-a",
  );

  assert.deepEqual(restored.completedIds, ["item-b"]);
  assert.equal(restored.selectedPhaseId, "phase-a");
  assert.equal(legacy.getItem(legacyKey), null);

  // Even if an old shell later recreates the legacy key, canonical progress
  // remains authoritative and the recreated legacy state is consumed.
  legacy.values.set(
    legacyKey,
    JSON.stringify({
      version: 1,
      phaseId: "phase-b",
      completedIds: ["item-c"],
    }),
  );
  const again = restoreChecklistSessionWithLegacyMigration(
    migrationChecklist,
    canonical,
    legacy,
    "variant-a",
  );

  assert.deepEqual(again.completedIds, ["item-b"]);
  assert.equal(again.selectedPhaseId, "phase-a");
  assert.equal(legacy.getItem(legacyKey), null);
});

test("P5.5 fast path and checklist training both invoke the same legacy migration helper", () => {
  const adapter = read("lib/fast-path/checklist-adapter.ts");
  const provider = read("components/ft-fast-path/FtFastPathProvider.tsx");
  const runner = read("components/checklist-runner.tsx");

  assert.match(adapter, /restoreChecklistSessionWithLegacyMigration/);
  assert.match(provider, /window\.localStorage/);
  assert.match(runner, /restoreChecklistSessionWithLegacyMigration/);
  assert.match(runner, /window\.localStorage/);
});

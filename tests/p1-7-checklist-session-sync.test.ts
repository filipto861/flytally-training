import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  checklistSessionStorageKey,
  normalizeChecklistSessionSnapshot,
} from "../lib/checklist-session.ts";
import {
  restoreChecklistSessionWithLegacyMigration,
  type ChecklistCanonicalStorage,
  type LegacyOperationalChecklistStorage,
} from "../lib/checklist-session-migration.ts";
import type { RuntimeChecklist } from "../lib/checklist-runtime.ts";

const checklist: RuntimeChecklist = {
  aircraftId: "generic-aircraft",
  title: "Normal Checklist",
  phases: [
    {
      id: "before-start",
      title: "Before start",
      items: [
        { id: "battery", challenge: "Battery", response: "ON" },
        { id: "fuel", challenge: "Fuel", response: "CHECK" },
      ],
    },
    {
      id: "taxi",
      title: "Taxi",
      items: [{ id: "brakes", challenge: "Brakes", response: "CHECK" }],
    },
  ],
};

function memoryStorage(
  initial: Readonly<Record<string, string>> = {},
): ChecklistCanonicalStorage
  & LegacyOperationalChecklistStorage
  & { values: Map<string, string> } {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

const read = (path: string) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("15.3b.5 Active Flight IDs isolate canonical EFB checklist sessions", () => {
  const flightA = checklistSessionStorageKey(
    checklist,
    "standard",
    "flight:flight-a",
  );
  const flightB = checklistSessionStorageKey(
    checklist,
    "standard",
    "flight:flight-b",
  );
  const noFlight = checklistSessionStorageKey(
    checklist,
    "standard",
    "flight:no-active-flight",
  );

  assert.notEqual(flightA, flightB);
  assert.notEqual(flightA, noFlight);
  assert.match(flightA, /flight%3Aflight-a$/);
  assert.equal(
    checklistSessionStorageKey(checklist, "standard"),
    "flytally-training-checklist-session:generic-aircraft:standard:Normal%20Checklist",
  );
});

test("15.3b.5 pre-existing unscoped session progress migrates once into the Active Flight key", () => {
  const oldKey = checklistSessionStorageKey(checklist, "standard");
  const flightKey = checklistSessionStorageKey(
    checklist,
    "standard",
    "flight:flight-a",
  );
  const oldSession = memoryStorage({
    [oldKey]: JSON.stringify({
      version: 1,
      mode: "run",
      selectedPhaseId: "taxi",
      completedIds: ["battery"],
      revealedFlowPhaseIds: [],
      revealedResponseIds: [],
    }),
  });
  const activeFlightStorage = memoryStorage();
  const legacy = memoryStorage();

  const restored = restoreChecklistSessionWithLegacyMigration(
    checklist,
    activeFlightStorage,
    legacy,
    "standard",
    "flight:flight-a",
    oldSession,
  );

  assert.equal(restored.selectedPhaseId, "taxi");
  assert.deepEqual(restored.completedIds, ["battery"]);
  assert.equal(oldSession.getItem(oldKey), null);
  assert.equal(
    activeFlightStorage.getItem(flightKey),
    JSON.stringify(restored),
  );

  const cleanFlightB = restoreChecklistSessionWithLegacyMigration(
    checklist,
    activeFlightStorage,
    legacy,
    "standard",
    "flight:flight-b",
    oldSession,
  );
  assert.deepEqual(cleanFlightB.completedIds, []);
  assert.equal(cleanFlightB.selectedPhaseId, "before-start");
});

test("15.3b.5 main Flight Deck and fast path share provider-owned checklist state", () => {
  const provider = read("components/ft-fast-path/FtFastPathProvider.tsx");
  const operational = read("components/operational-checklist.tsx");
  const fastPath = read("components/ft-fast-path/FtFastPathChecklist.tsx");
  const shell = read("components/ft-shell/FtShell.tsx");

  assert.match(provider, /useActiveFlightState/);
  assert.match(provider, /window\.localStorage/);
  assert.match(provider, /checklistSessionScope/);
  assert.match(provider, /resetChecklistPhase/);
  assert.match(provider, /resetChecklistAll/);

  assert.match(operational, /useOptionalFtFastPath/);
  assert.match(operational, /sharedChecklist\.toggleChecklistItem/);
  assert.match(operational, /sharedChecklist\.selectChecklistPhase/);
  assert.match(operational, /sharedChecklist\.resetChecklistPhase/);
  assert.match(operational, /sharedChecklist\.resetChecklistAll/);

  assert.match(fastPath, /Reset phase/);
  assert.match(fastPath, /Reset all/);
  assert.match(fastPath, /Next phase/);
  assert.match(fastPath, /currentPhase\.items\.find/);
  assert.doesNotMatch(fastPath, /flatItems\.find/);

  assert.match(shell, /activeFlight=\{activeFlight\}/);
});

test("15.3b.5 reset normalization stays within current checklist identities", () => {
  const snapshot = normalizeChecklistSessionSnapshot(
    {
      version: 1,
      mode: "run",
      selectedPhaseId: "taxi",
      completedIds: ["battery", "brakes"],
      revealedFlowPhaseIds: [],
      revealedResponseIds: [],
    },
    checklist,
  );
  assert.deepEqual(snapshot.completedIds, ["battery", "brakes"]);
});

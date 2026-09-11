import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  checklistPhaseProgress,
  checklistProgressContentId,
  checklistSessionStorageKey,
  nextChecklistPhaseId,
  normalizeChecklistSessionSnapshot,
} from "../lib/checklist-session.ts";
import type { RuntimeChecklist } from "../lib/checklist-runtime.ts";

const checklist: RuntimeChecklist = {
  aircraftId: "test-aircraft",
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

const runnerSource = fs.readFileSync(new URL("../components/checklist-runner.tsx", import.meta.url), "utf8");

test("checklist session restore fails closed to current checklist identities", () => {
  const snapshot = normalizeChecklistSessionSnapshot({
    version: 99,
    mode: "learn",
    selectedPhaseId: "removed-phase",
    completedIds: ["battery", "removed-item", "battery"],
    revealedFlowPhaseIds: ["taxi", "removed-phase"],
    revealedResponseIds: ["fuel", "removed-item"],
  }, checklist);

  assert.equal(snapshot.version, 1);
  assert.equal(snapshot.mode, "learn");
  assert.equal(snapshot.selectedPhaseId, "before-start");
  assert.deepEqual(snapshot.completedIds, ["battery"]);
  assert.deepEqual(snapshot.revealedFlowPhaseIds, ["taxi"]);
  assert.deepEqual(snapshot.revealedResponseIds, ["fuel"]);
});

test("phase progress and next-phase navigation are derived from checklist content", () => {
  const progress = checklistPhaseProgress(checklist, new Set(["battery", "fuel"]));
  assert.deepEqual(progress, [
    { phaseId: "before-start", complete: true, completedItems: 2, totalItems: 2 },
    { phaseId: "taxi", complete: false, completedItems: 0, totalItems: 1 },
  ]);
  assert.equal(nextChecklistPhaseId(checklist, "before-start"), "taxi");
  assert.equal(nextChecklistPhaseId(checklist, "taxi"), undefined);
});

test("session and progress identities stay isolated by aircraft configuration", () => {
  assert.notEqual(checklistSessionStorageKey(checklist, "A"), checklistSessionStorageKey(checklist, "B"));
  assert.equal(
    checklistProgressContentId("phase", "taxi", "run", "A"),
    "phase:taxi:mode=run:variant=A",
  );
  assert.equal(
    checklistProgressContentId("complete", undefined, "learn"),
    "complete-checklist:mode=learn:variant=common",
  );
});

test("operational runner preserves progress across mode and phase changes", () => {
  assert.match(runnerSource, /window\.sessionStorage\.getItem\(storageKey\)/);
  assert.match(runnerSource, /window\.sessionStorage\.setItem\(storageKey/);
  assert.match(runnerSource, /onClick=\{\(\) => setMode\(candidate\.key\)\}/);
  assert.match(runnerSource, /onClick=\{\(\) => setSelectedPhaseId\(phase\.id\)\}/);
  assert.match(runnerSource, /function resetCurrentPhase\(\)/);
  assert.match(runnerSource, /Next phase · \{nextPhase\.title\}/);
  assert.doesNotMatch(runnerSource, /function changeMode[\s\S]{0,180}resetSession/);
  assert.doesNotMatch(runnerSource, /function changePhase[\s\S]{0,180}resetSession/);
});

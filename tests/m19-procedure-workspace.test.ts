import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  normalizeProcedureSessionSnapshot,
  procedureProgress,
  procedureSessionStorageKey,
  procedureStepKey,
} from "../lib/procedure-session.ts";
import type { AircraftProcedure } from "../lib/universal-aircraft-content.ts";

const procedures: readonly AircraftProcedure[] = [
  {
    id: "start",
    title: "Engine start",
    phase: "Before start",
    steps: [
      { id: "starter", action: "Starter — ENGAGE", expectedResult: "Engine rotates." },
      { id: "fuel", action: "Fuel — INTRODUCE", verification: "Temperature remains within limit." },
    ],
  },
  {
    id: "taxi",
    title: "Taxi",
    phase: "Taxi",
    steps: [{ id: "brakes", action: "Brakes — CHECK" }],
  },
];

const browserSource = fs.readFileSync(new URL("../components/procedure-browser.tsx", import.meta.url), "utf8");
const pageSource = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/procedures/page.tsx", import.meta.url), "utf8");

test("procedure session restore rejects stale procedure and step identities", () => {
  const snapshot = normalizeProcedureSessionSnapshot({
    version: 1,
    selectedProcedureId: "removed",
    completedStepKeys: ["start:starter", "start:removed", "start:starter", "removed:step"],
  }, procedures);
  assert.equal(snapshot.version, 1);
  assert.equal(snapshot.selectedProcedureId, "start");
  assert.deepEqual(snapshot.completedStepKeys, ["start:starter"]);
});

test("procedure session restore rejects an unknown version instead of interpreting it as v1", () => {
  const snapshot = normalizeProcedureSessionSnapshot({
    version: 99,
    selectedProcedureId: "start",
    completedStepKeys: ["start:starter"],
  }, procedures);

  assert.deepEqual(snapshot, {
    version: 1,
    selectedProcedureId: "start",
    completedStepKeys: [],
  });
});

test("procedure step identity is scoped to its procedure and configuration session", () => {
  assert.equal(procedureStepKey("start", "fuel"), "start:fuel");
  assert.notEqual(procedureStepKey("start", "common"), procedureStepKey("taxi", "common"));
  assert.notEqual(
    procedureSessionStorageKey("aircraft", "A"),
    procedureSessionStorageKey("aircraft", "B"),
  );
});

test("procedure completion is derived from current source-defined steps", () => {
  assert.deepEqual(procedureProgress(procedures, new Set(["start:starter", "start:fuel"])), [
    { procedureId: "start", completedSteps: 2, totalSteps: 2, complete: true },
    { procedureId: "taxi", completedSteps: 0, totalSteps: 1, complete: false },
  ]);
});

test("procedure workspace preserves deep links, v2 session state and split renderers without aircraft-specific branches", () => {
  assert.match(browserSource, /window\.location\.hash/);
  assert.match(browserSource, /readProcedureSessionV2/);
  assert.match(browserSource, /writeProcedureSessionV2/);
  assert.match(browserSource, /ProcedureLinearRunner/);
  assert.match(browserSource, /ProcedureGraphRunner/);
  assert.match(browserSource, /emittedCompletionRef/);
  assert.match(browserSource, /shouldEmitProcedureGraphCompletion/);
  assert.match(browserSource, /Reset procedure/);
  assert.doesNotMatch(browserSource, /learjet-35-36|Learjet/);
});

test("procedure route passes configuration snapshot and server-side graph fingerprints into the generic workspace", () => {
  assert.match(pageSource, /effectiveConfigurationSnapshotIdForAircraftVariant/);
  assert.match(pageSource, /fingerprintGraphProcedure/);
  assert.match(pageSource, /key=\{effectiveSnapshotId\}/);
  assert.match(pageSource, /graphFingerprints=\{graphFingerprints\}/);
  assert.doesNotMatch(pageSource, /aircraft\.id ===|aircraftId ===/);
});

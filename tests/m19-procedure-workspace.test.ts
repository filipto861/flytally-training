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
    version: 99,
    selectedProcedureId: "removed",
    completedStepKeys: ["start:starter", "start:removed", "start:starter", "removed:step"],
  }, procedures);
  assert.equal(snapshot.version, 1);
  assert.equal(snapshot.selectedProcedureId, "start");
  assert.deepEqual(snapshot.completedStepKeys, ["start:starter"]);
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

test("procedure workspace preserves deep links, step progress and source detail without aircraft-specific branches", () => {
  assert.match(browserSource, /window\.location\.hash/);
  assert.match(browserSource, /window\.sessionStorage\.setItem\(storageKey/);
  assert.match(browserSource, /kind: "procedure"/);
  assert.match(browserSource, /step\.expectedResult/);
  assert.match(browserSource, /step\.verification/);
  assert.match(browserSource, /step\.rationale/);
  assert.match(browserSource, /step\.notices/);
  assert.match(browserSource, /Source · \{sourceLabel\}/);
  assert.match(browserSource, /Reset procedure/);
  assert.doesNotMatch(browserSource, /learjet-35-36|Learjet/);
});

test("procedure route passes resolved aircraft configuration into the generic workspace", () => {
  assert.match(pageSource, /<ProcedureBrowser aircraftId=\{aircraft\.id\} procedures=\{procedures\} selectedVariant=\{selectedVariant\} \/>/);
  assert.doesNotMatch(pageSource, /aircraft\.id ===|aircraftId ===/);
});

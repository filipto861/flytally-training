import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { learjet3536 } from "../lib/aircraft-catalog.ts";
import { learjet3536CaeNormalChecklist, CAE_LEARJET_CRH_ID } from "../lib/learjet-cae-pilot-content.ts";
import { staticTrainingContentSeed } from "../lib/static-content-repository.ts";
import { validateUniversalTrainingContentPayload } from "../lib/universal-aircraft-content.ts";

function manualIds(value: unknown): string[] {
  const ids: string[] = [];
  const visit = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== "object") return;
    for (const [key, child] of Object.entries(node)) {
      if (key === "manualId" && typeof child === "string") ids.push(child);
      else visit(child);
    }
  };
  visit(value);
  return ids;
}

test("M25 registers CAE as the primary FLY reference while FlightSafety remains the LEARN source", () => {
  const cae = learjet3536.manuals.find((manual) => manual.id === CAE_LEARJET_CRH_ID);
  assert.ok(cae);
  assert.equal(cae.publisher, "CAE SimuFlite");
  assert.equal(cae.authorityRole, "TRAINING_REFERENCE");
  assert.equal(learjet3536.workspaceProfile?.flyManualId, CAE_LEARJET_CRH_ID);
  assert.equal(learjet3536.workspaceProfile?.learnManualId, "fsi-learjet-35-36-ptm-r1-1");
});

test("CAE normal checklist is a source-backed full-flight done-list", () => {
  assert.deepEqual(validateUniversalTrainingContentPayload("checklists", learjet3536CaeNormalChecklist), []);
  assert.ok(learjet3536CaeNormalChecklist.phases.length >= 18);
  const phaseIds = new Set(learjet3536CaeNormalChecklist.phases.map((phase) => phase.id));
  for (const required of [
    "preflight-exterior",
    "before-start",
    "starting-engines",
    "before-taxi",
    "taxi",
    "before-takeoff",
    "runway-lineup",
    "takeoff",
    "after-takeoff",
    "climb",
    "cruise",
    "descent",
    "approach",
    "before-landing",
    "landing",
    "go-around",
    "after-landing",
    "shutdown",
  ]) assert.ok(phaseIds.has(required), `missing CAE flight phase ${required}`);
  assert.ok(manualIds(learjet3536CaeNormalChecklist).every((id) => id === CAE_LEARJET_CRH_ID));
  assert.match(learjet3536CaeNormalChecklist.sourceNote ?? "", /done list/i);
});

test("static seed publishes CAE checklist instead of the previous abbreviated checklist", () => {
  const checklist = staticTrainingContentSeed.nativeModules?.find((module) => module.aircraftId === "learjet-35-36" && module.domain === "checklists");
  assert.equal(checklist?.payload, learjet3536CaeNormalChecklist);
});

test("pilot landing page prioritizes an action and quick access instead of exposing content taxonomy", () => {
  const page = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/page.tsx", import.meta.url), "utf8");
  assert.match(page, /pilot-primary-card/);
  assert.match(page, /Quick access/);
  assert.match(page, /Normal checklist/);
  assert.match(page, /Abnormal \/ Emergency/);
  assert.doesNotMatch(page, />FLY<|>LEARN<|Cockpit tools|Study & practice|Training references/);
  assert.doesNotMatch(page, /learjet-35-36/);
});

test("workspace navigation uses pilot task areas rather than FLY and LEARN product buckets", () => {
  const nav = fs.readFileSync(new URL("../components/aircraft-workspace-nav.tsx", import.meta.url), "utf8");
  assert.match(nav, /label: "Training"/);
  assert.match(nav, /label: "Checklists"/);
  assert.match(nav, /label: "Reference"/);
  assert.match(nav, /listPublishedModuleDomains/);
  assert.doesNotMatch(nav, /"FLY"|"LEARN"|learner-sidebar/);
  assert.doesNotMatch(nav, /learjet-35-36/);
});

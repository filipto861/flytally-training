import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createStructuredStarterPayload,
  isStructuredAuthoringDomain,
  structuredAuthoringDomains,
} from "../lib/content-authoring-templates.ts";
import { validateContentPayload } from "../lib/content-contracts.ts";

const aircraftId = "m33-test-aircraft";

const primaryCollections: Record<(typeof structuredAuthoringDomains)[number], string> = {
  checklists: "phases",
  procedures: "procedures",
  performance: "datasets",
  limitations: "groups",
  systems: "systems",
  flows: "flows",
  avionics: "topics",
  knowledge: "questions",
  abnormal: "scenarios",
};

test("M33 exposes only modern universal structured domains", () => {
  assert.deepEqual(structuredAuthoringDomains, [
    "checklists",
    "procedures",
    "performance",
    "limitations",
    "systems",
    "flows",
    "avionics",
    "knowledge",
    "abnormal",
  ]);
  for (const legacy of ["learning", "normal-flight", "orientation", "reference-knowledge"]) {
    assert.equal(isStructuredAuthoringDomain(legacy), false);
  }
});

test("every structured domain gets an aircraft-scoped starter shape without aircraft content", () => {
  for (const domain of structuredAuthoringDomains) {
    const payload = createStructuredStarterPayload(aircraftId, domain);
    assert.equal(payload.aircraftId, aircraftId);
    assert.equal(payload.title, "");
    const collection = payload[primaryCollections[domain]];
    assert.ok(Array.isArray(collection));
    assert.ok(collection.length > 0);
    assert.doesNotMatch(JSON.stringify(payload), /learjet|cessna|rotax|vmo|vne|takeoff distance/i);
    const errors = validateContentPayload(domain, payload, aircraftId);
    assert.ok(errors.length > 0, `${domain} starter must remain an intentionally incomplete draft`);
    assert.equal(errors.some(error => error.includes("aircraftId must equal")), false);
  }
});

test("blank abnormal starter is validated as the universal abnormal contract", () => {
  const payload = createStructuredStarterPayload(aircraftId, "abnormal");
  const errors = validateContentPayload("abnormal", payload, aircraftId);
  assert.ok(errors.some(error => error.includes("universal abnormal scenario contract")));
  assert.equal(errors.some(error => error.includes("sourceNote and disclaimer")), false);
  assert.equal(errors.some(error => error.includes("Recognize → Fly")), false);
});

test("new-module route uses the structured builder and governed human-draft action", async () => {
  const page = await readFile("app/admin/aircraft/[aircraftId]/content/new/page.tsx", "utf8");
  const actions = await readFile("app/admin/actions.ts", "utf8");
  const studio = await readFile("app/admin/aircraft/[aircraftId]/page.tsx", "utf8");

  assert.match(page, /StructuredContentBuilder/);
  assert.match(page, /createStructuredStarterPayload/);
  assert.match(page, /createStructuredDraftAction/);
  assert.match(page, /At least one governed source reference is required/);
  assert.match(actions, /origin:"human"/);
  assert.match(actions, /isModernStructuredDomain/);
  assert.match(actions, /createGovernedDraftVersion/);
  assert.match(actions, /redirect\(`\/admin\/aircraft\/\$\{encodeURIComponent\(aircraftId\)\}\/content\/\$\{encodeURIComponent\(versionId\)\}`\)/);
  assert.match(studio, /structuredAuthoringDomains\.map/);
  assert.match(studio, /AI-assisted draft from a controlled excerpt/);
});

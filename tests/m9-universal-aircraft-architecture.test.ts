import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { trainingContentDomains } from "../lib/content-admin-types.ts";
import { validateContentPayload } from "../lib/content-contracts.ts";
import { universalTrainingContentDomains } from "../lib/universal-aircraft-content.ts";

const aircraftPage = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/page.tsx", import.meta.url), "utf8");
const trainingHub = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/training/page.tsx", import.meta.url), "utf8");
const referenceHub = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/reference/page.tsx", import.meta.url), "utf8");
const workspacePage = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/[section]/page.tsx", import.meta.url), "utf8");
const checklistRunner = fs.readFileSync(new URL("../components/checklist-runner.tsx", import.meta.url), "utf8");
const coldDarkPage = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/cold-dark/page.tsx", import.meta.url), "utf8");

const simpleAircraftId = "simple-single-engine";

test("M9 exposes independent first-class aircraft content domains", () => {
  assert.deepEqual(universalTrainingContentDomains, ["checklists", "procedures", "performance", "limitations", "systems", "flows", "avionics", "knowledge"]);
  for (const domain of universalTrainingContentDomains) assert.ok(trainingContentDomains.includes(domain));
});

test("a sparse single-engine aircraft needs no jet-only or cockpit-orientation modules", () => {
  const checklist = { aircraftId: simpleAircraftId, title: "Normal checklists", phases: [{ id: "before-takeoff", title: "Before Takeoff", sequence: 20, items: [{ id: "controls", challenge: "Flight controls", response: "FREE AND CORRECT" }, { id: "trim", challenge: "Trim", response: "SET" }] }] };
  const limitations = { aircraftId: simpleAircraftId, title: "Limitations", groups: [{ id: "speeds", title: "Airspeeds", items: [{ id: "vne", label: "VNE", value: 145, unit: "KIAS" }] }] };
  assert.deepEqual(validateContentPayload("checklists", checklist, simpleAircraftId), []);
  assert.deepEqual(validateContentPayload("limitations", limitations, simpleAircraftId), []);
});

test("generic learner UX contains no mandatory two-engine or cockpit-map path", () => {
  assert.doesNotMatch(aircraftPage, /start both engines/i);
  assert.doesNotMatch(aircraftPage, /cold\s*&\s*dark/i);
  assert.doesNotMatch(workspacePage, /Cockpit Orientation.*capability/s);
  assert.doesNotMatch(checklistRunner, /orientation|Show me/i);
  assert.match(coldDarkPage, /\/checklists/);
  assert.match(aircraftPage, /capabilities\.checklists/);
  assert.match(aircraftPage, /const hasTraining = capabilities\.systems/);
  assert.match(aircraftPage, /moduleHref\("training"\)/);
  assert.match(trainingHub, /capabilities\.systems/);
  assert.match(trainingHub, /capabilities\.procedures/);
  assert.match(referenceHub, /capabilities\.limitations/);
  assert.doesNotMatch(aircraftPage + trainingHub + referenceHub, /Not used for this aircraft/);
});

import assert from "node:assert/strict";
import test from "node:test";

import { checklistTrainingModes } from "../lib/checklist-training.ts";
import { getAircraftContentBundle } from "../lib/content-repository.ts";
import { StaticTrainingContentRepository } from "../lib/static-content-repository.ts";
import { evaluateV1AircraftContent } from "../lib/v1-content-gate.ts";

const aircraftId = "learjet-35-36";
const expectedSystems = [
  "electrical",
  "fuel",
  "powerplant",
  "hydraulics",
  "pneumatics",
  "pressurization",
  "flight-controls",
  "anti-ice",
  "landing-gear-brakes",
];
const expectedFlightPhases = [
  "cold-dark",
  "engine-start",
  "taxi",
  "before-takeoff",
  "takeoff",
  "climb-cruise",
  "descent-approach",
  "landing",
  "shutdown",
];

test("Learjet legacy reference content remains internally complete during the M9 migration", async () => {
  const bundle = await getAircraftContentBundle(new StaticTrainingContentRepository(), aircraftId);
  assert.ok(bundle);
  const report = evaluateV1AircraftContent(bundle);
  assert.equal(report.ready, true, report.checks.filter(check => !check.ok).map(check => `${check.id}: ${check.detail}`).join("\n"));
  assert.ok(report.focusedMinutes <= 240);
  assert.deepEqual(bundle.capabilities, {
    checklists: true,
    procedures: true,
    performance: false,
    limitations: false,
    systems: true,
    abnormalEmergency: true,
    flows: true,
    avionics: false,
    knowledge: true,
    manual: true,
    quickStart: true,
    normalFlight: true,
    cockpitOrientation: true,
    quickReference: true,
  });
});

test("Learjet legacy practical path remains available while native M9 checklists replace it", async () => {
  const bundle = await getAircraftContentBundle(new StaticTrainingContentRepository(), aircraftId);
  assert.ok(bundle?.normalFlight);
  assert.deepEqual(bundle.normalFlight.phases.map(phase => phase.id), expectedFlightPhases);
  for (const phase of bundle.normalFlight.phases) {
    for (const item of phase.items) {
      assert.ok(item.source.chapter > 0, `${phase.id}/${item.id} missing source chapter`);
      assert.ok(item.source.manualPage.length > 0, `${phase.id}/${item.id} missing source page`);
    }
  }
});

test("Learjet legacy content includes all nine baseline systems and all four checklist learning modes", async () => {
  const bundle = await getAircraftContentBundle(new StaticTrainingContentRepository(), aircraftId);
  assert.ok(bundle?.learningContent);
  assert.deepEqual(bundle.learningContent.systems.map(system => system.id), expectedSystems);
  assert.deepEqual(checklistTrainingModes.map(mode => mode.key), ["learn", "practice", "flow", "challenge"]);
});

test("Learjet legacy source boundaries remain explicit during migration", async () => {
  const bundle = await getAircraftContentBundle(new StaticTrainingContentRepository(), aircraftId);
  assert.ok(bundle?.normalFlight && bundle.abnormalTraining && bundle.referenceKnowledge);
  assert.ok(bundle.aircraft.manuals.some(manual => /take precedence/i.test(manual.authorityNote)));
  assert.match(bundle.normalFlight.sourceNote, /not an approved aircraft checklist/i);
  assert.match(bundle.abnormalTraining.disclaimer, /AFM\/QRH/i);
  assert.match(bundle.referenceKnowledge.referenceNote, /controlling/i);
});

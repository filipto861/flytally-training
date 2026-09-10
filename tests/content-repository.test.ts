import assert from "node:assert/strict";
import test from "node:test";

import { learjet3536AbnormalTraining } from "../lib/abnormal-scenarios.ts";
import { learjet3536 } from "../lib/aircraft-catalog.ts";
import { learjet3536CockpitOrientation } from "../lib/cockpit-orientation.ts";
import { getAircraftContentBundle } from "../lib/content-repository.ts";
import { learjet3536LearningContent } from "../lib/learning-content.ts";
import { learjet3536ReferenceKnowledge } from "../lib/reference-knowledge.ts";
import { learjet3536ColdDarkFlow } from "../lib/simulator-checklists.ts";
import { StaticTrainingContentRepository } from "../lib/static-content-repository.ts";

const secondAircraftId = "repository-test-aircraft";
const secondAircraft = {
  ...learjet3536,
  id: secondAircraftId,
  manufacturer: "Test Manufacturer",
  model: "Repository Test",
  variants: ["A"],
  displayName: "Repository Test Aircraft",
};

test("repository lookup is aircraft-agnostic and legacy data maps into universal capabilities during migration", async () => {
  const repository = new StaticTrainingContentRepository({
    aircraft: [learjet3536, secondAircraft],
    learningContent: [learjet3536LearningContent, { ...learjet3536LearningContent, aircraftId: secondAircraftId }],
    normalFlights: [learjet3536ColdDarkFlow, { ...learjet3536ColdDarkFlow, aircraftId: secondAircraftId }],
    cockpitOrientations: [learjet3536CockpitOrientation, { ...learjet3536CockpitOrientation, aircraftId: secondAircraftId }],
    abnormalTrainings: [learjet3536AbnormalTraining, { ...learjet3536AbnormalTraining, aircraftId: secondAircraftId }],
    referenceKnowledge: [learjet3536ReferenceKnowledge, { ...learjet3536ReferenceKnowledge, aircraftId: secondAircraftId }],
  });

  const bundle = await getAircraftContentBundle(repository, secondAircraftId);
  assert.ok(bundle);
  assert.equal(bundle.aircraft.displayName, "Repository Test Aircraft");
  assert.equal(bundle.learningContent?.aircraftId, secondAircraftId);
  assert.equal(bundle.normalFlight?.aircraftId, secondAircraftId);
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

test("repository capabilities describe a sparse aircraft without inventing modules", async () => {
  const repository = new StaticTrainingContentRepository({
    aircraft: [secondAircraft],
    learningContent: [],
    normalFlights: [],
    cockpitOrientations: [],
    abnormalTrainings: [],
    referenceKnowledge: [],
  });

  const bundle = await getAircraftContentBundle(repository, secondAircraftId);
  assert.ok(bundle);
  assert.equal(bundle.capabilities.checklists, false);
  assert.equal(bundle.capabilities.procedures, false);
  assert.equal(bundle.capabilities.performance, false);
  assert.equal(bundle.capabilities.limitations, false);
  assert.equal(bundle.capabilities.systems, false);
  assert.equal(bundle.capabilities.abnormalEmergency, false);
  assert.equal(bundle.capabilities.flows, false);
  assert.equal(bundle.capabilities.avionics, false);
  assert.equal(bundle.capabilities.knowledge, false);
  assert.equal(bundle.capabilities.manual, true);
  assert.equal(bundle.capabilities.cockpitOrientation, false);
});

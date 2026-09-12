import assert from "node:assert/strict";
import test from "node:test";

import type { TrainingAircraft } from "../lib/aircraft-catalog.ts";
import { getAircraftContentBundle } from "../lib/content-repository.ts";
import { StaticTrainingContentRepository } from "../lib/static-content-repository.ts";

const aircraftId = "repository-test-aircraft";
const aircraft: TrainingAircraft = {
  id: aircraftId,
  manufacturer: "Test Manufacturer",
  model: "Repository Test",
  variants: ["A"],
  displayName: "Repository Test Aircraft",
  manuals: [],
};

test("repository lookup is aircraft-agnostic for first-class published domains", async () => {
  const repository = new StaticTrainingContentRepository({
    aircraft: [aircraft],
    nativeModules: [
      { aircraftId, domain: "checklists", payload: { aircraftId } },
      { aircraftId, domain: "systems", payload: { aircraftId } },
      { aircraftId, domain: "performance", payload: { aircraftId } },
    ],
    learningContent: [],
    normalFlights: [],
    cockpitOrientations: [],
    abnormalTrainings: [],
    referenceKnowledge: [],
  });

  const bundle = await getAircraftContentBundle(repository, aircraftId);
  assert.ok(bundle);
  assert.equal(bundle.aircraft.displayName, "Repository Test Aircraft");
  assert.equal(bundle.capabilities.checklists, true);
  assert.equal(bundle.capabilities.systems, true);
  assert.equal(bundle.capabilities.performance, true);
  assert.equal(bundle.capabilities.procedures, false);
  assert.equal(bundle.capabilities.manual, false);
});

test("repository capabilities describe a sparse aircraft without inventing modules", async () => {
  const repository = new StaticTrainingContentRepository({
    aircraft: [aircraft],
    learningContent: [],
    normalFlights: [],
    cockpitOrientations: [],
    abnormalTrainings: [],
    referenceKnowledge: [],
  });

  const bundle = await getAircraftContentBundle(repository, aircraftId);
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
  assert.equal(bundle.capabilities.manual, false);
  assert.equal(bundle.capabilities.cockpitOrientation, false);
});

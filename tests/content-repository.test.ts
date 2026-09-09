import assert from "node:assert/strict";
import test from "node:test";

import { learjet3536AbnormalTraining } from "../lib/abnormal-scenarios.ts";
import { learjet3536 } from "../lib/aircraft-catalog.ts";
import { learjet3536CockpitOrientation } from "../lib/cockpit-orientation.ts";
import { getAircraftContentBundle } from "../lib/content-repository.ts";
import { learjet3536LearningContent } from "../lib/learning-content.ts";
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

test("repository lookup is aircraft-agnostic and does not require Learjet-specific branching", async () => {
  const repository = new StaticTrainingContentRepository({
    aircraft: [learjet3536, secondAircraft],
    learningContent: [
      learjet3536LearningContent,
      { ...learjet3536LearningContent, aircraftId: secondAircraftId },
    ],
    normalFlights: [
      learjet3536ColdDarkFlow,
      { ...learjet3536ColdDarkFlow, aircraftId: secondAircraftId },
    ],
    cockpitOrientations: [
      learjet3536CockpitOrientation,
      { ...learjet3536CockpitOrientation, aircraftId: secondAircraftId },
    ],
    abnormalTrainings: [
      learjet3536AbnormalTraining,
      { ...learjet3536AbnormalTraining, aircraftId: secondAircraftId },
    ],
  });

  const bundle = await getAircraftContentBundle(repository, secondAircraftId);
  assert.ok(bundle);
  assert.equal(bundle.aircraft.displayName, "Repository Test Aircraft");
  assert.equal(bundle.learningContent?.aircraftId, secondAircraftId);
  assert.equal(bundle.normalFlight?.aircraftId, secondAircraftId);
  assert.equal(bundle.cockpitOrientation?.aircraftId, secondAircraftId);
  assert.equal(bundle.abnormalTraining?.aircraftId, secondAircraftId);
  assert.deepEqual(bundle.capabilities, {
    quickStart: true,
    systems: true,
    normalFlight: true,
    cockpitOrientation: true,
    abnormalEmergency: true,
    manual: true,
  });
});

test("repository capabilities describe partial aircraft content without inventing availability", async () => {
  const repository = new StaticTrainingContentRepository({
    aircraft: [secondAircraft],
    learningContent: [],
    normalFlights: [],
    cockpitOrientations: [],
    abnormalTrainings: [],
  });

  const bundle = await getAircraftContentBundle(repository, secondAircraftId);
  assert.ok(bundle);
  assert.equal(bundle.capabilities.quickStart, false);
  assert.equal(bundle.capabilities.systems, false);
  assert.equal(bundle.capabilities.normalFlight, false);
  assert.equal(bundle.capabilities.cockpitOrientation, false);
  assert.equal(bundle.capabilities.abnormalEmergency, false);
  assert.equal(bundle.capabilities.manual, true);
});

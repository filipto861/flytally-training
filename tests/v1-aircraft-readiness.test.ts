import assert from "node:assert/strict";
import test from "node:test";

import type { AircraftContentCapabilities } from "../lib/content-repository.ts";
import {
  hasUsableAircraftTrainingContent,
  releaseEligibleTrainingCapabilities,
  v1RequiredAircraftCapabilities,
} from "../lib/v1-aircraft-readiness.ts";

const empty: AircraftContentCapabilities = {
  checklists: false,
  procedures: false,
  performance: false,
  weightBalance: false,
  limitations: false,
  systems: false,
  abnormalEmergency: false,
  flows: false,
  avionics: false,
  knowledge: false,
  manual: false,
  quickStart: false,
  normalFlight: false,
  cockpitOrientation: false,
  quickReference: false,
};

test("M9 has no globally required aircraft module", () => {
  assert.deepEqual(v1RequiredAircraftCapabilities, []);
});

test("any real published training module can make an aircraft usable", () => {
  for (const key of releaseEligibleTrainingCapabilities) {
    assert.equal(hasUsableAircraftTrainingContent({ ...empty, [key]: true }), true, key);
  }
});

test("manual metadata or cockpit orientation alone do not define usable training content", () => {
  assert.equal(hasUsableAircraftTrainingContent({ ...empty, manual: true }), false);
  assert.equal(hasUsableAircraftTrainingContent({ ...empty, cockpitOrientation: true }), false);
});

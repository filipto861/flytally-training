import assert from "node:assert/strict";
import test from "node:test";

import type { AircraftContentCapabilities } from "../lib/content-repository.ts";
import { hasCompleteV1AircraftCapabilities, v1RequiredAircraftCapabilities } from "../lib/v1-aircraft-readiness.ts";

const complete: AircraftContentCapabilities = {
  quickStart: true,
  systems: true,
  normalFlight: true,
  cockpitOrientation: true,
  abnormalEmergency: true,
  quickReference: true,
  knowledge: true,
  manual: true,
};

test("v1 readiness requires every canonical learner capability", () => {
  assert.deepEqual(v1RequiredAircraftCapabilities, [
    "quickStart",
    "systems",
    "normalFlight",
    "cockpitOrientation",
    "abnormalEmergency",
    "quickReference",
    "knowledge",
    "manual",
  ]);
  assert.equal(hasCompleteV1AircraftCapabilities(complete), true);
});

test("one partial content domain keeps an aircraft below v1 readiness", () => {
  for (const key of v1RequiredAircraftCapabilities) {
    assert.equal(hasCompleteV1AircraftCapabilities({ ...complete, [key]: false }), false, key);
  }
});

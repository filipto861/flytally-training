import assert from "node:assert/strict";
import test from "node:test";

import {
  getAircraftLearningContent,
  getEssentialSystemsMinutes,
  getQuickStartMinutes,
  learjet3536LearningContent,
} from "../lib/learning-content.ts";

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

test("Learjet Quick Start stays short enough for a first simulator session", () => {
  const content = getAircraftLearningContent("learjet-35-36");
  assert.ok(content);
  assert.ok(getQuickStartMinutes(content) <= 30);
  assert.ok(content.quickStart.length >= 5);
});

test("Learjet exposes all nine v1.0 essential systems", () => {
  assert.deepEqual(learjet3536LearningContent.systems.map((system) => system.id), expectedSystems);
  assert.ok(getEssentialSystemsMinutes(learjet3536LearningContent) <= 60);
});

test("every Quick Start and system lesson remains source-backed", () => {
  for (const topic of learjet3536LearningContent.quickStart) {
    assert.ok(topic.source.length > 0, `${topic.id} must have a source`);
    assert.ok(topic.source.every((item) => item.chapter > 0 && item.manualPage.length > 0));
  }

  for (const system of learjet3536LearningContent.systems) {
    assert.ok(system.source.length > 0, `${system.id} must have a source`);
    assert.ok(system.source.every((item) => item.chapter > 0 && item.manualPage.length > 0));
  }
});

test("essential systems use the same concise pilot-facing information contract", () => {
  for (const system of learjet3536LearningContent.systems) {
    assert.ok(system.mentalModel.length > 0);
    assert.ok(system.pilotControls.length > 0);
    assert.ok(system.pilotMonitors.length > 0);
    assert.ok(system.normalPicture.length > 0);
    assert.ok(system.remember.length > 0);
    assert.ok(system.minutes <= 6);
  }
});

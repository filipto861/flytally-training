import assert from "node:assert/strict";
import test from "node:test";

import {
  getAbnormalTrainingMinutes,
  getAircraftAbnormalTraining,
  learjet3536AbnormalTraining,
} from "../lib/abnormal-scenarios.ts";

const expectedScenarioIds = [
  "rejected-takeoff-before-v1",
  "engine-failure-at-or-above-v1",
  "engine-fire-in-flight",
  "single-generator-failure",
  "hydraulic-pressure-loss",
  "cabin-altitude-emergency-descent",
  "landing-gear-alternate-extension",
  "windshield-heat-overheat",
];

const expectedStages = ["recognition", "control", "immediate", "continue"];

test("Learjet M5 exposes the representative abnormal and emergency scenario set", () => {
  const training = getAircraftAbnormalTraining("learjet-35-36");
  assert.ok(training);
  assert.deepEqual(training.scenarios.map((scenario) => scenario.id), expectedScenarioIds);
  assert.equal(new Set(training.scenarios.map((scenario) => scenario.id)).size, training.scenarios.length);
});

test("every abnormal scenario follows the recognition-control-action-continuation contract", () => {
  for (const scenario of learjet3536AbnormalTraining.scenarios) {
    assert.deepEqual(scenario.stages.map((stage) => stage.id), expectedStages, scenario.id);
    assert.ok(scenario.objectives.length > 0, `${scenario.id} must have objectives`);
    assert.ok(scenario.debrief.length > 0, `${scenario.id} must have debrief prompts`);

    for (const stage of scenario.stages) {
      assert.ok(stage.prompt.length > 0, `${scenario.id}/${stage.id} must have a prompt`);
      assert.ok(stage.expectedResponse.length > 0, `${scenario.id}/${stage.id} must have a response`);
      assert.ok(stage.why.length > 0, `${scenario.id}/${stage.id} must explain why`);
      assert.ok(stage.source.length > 0, `${scenario.id}/${stage.id} must have a source`);
      assert.ok(stage.source.every((item) => item.chapter > 0 && item.manualPage.length > 0));
    }
  }
});

test("M5 stays focused enough for targeted practice", () => {
  assert.ok(getAbnormalTrainingMinutes(learjet3536AbnormalTraining) <= 50);
  assert.ok(learjet3536AbnormalTraining.scenarios.every((scenario) => scenario.minutes <= 6));
});

test("source-limited failures explicitly block invented procedures", () => {
  for (const id of ["single-generator-failure", "engine-fire-in-flight", "hydraulic-pressure-loss"]) {
    const scenario = learjet3536AbnormalTraining.scenarios.find((item) => item.id === id);
    assert.ok(scenario, id);
    assert.ok(scenario.trainingBoundary && scenario.trainingBoundary.length > 0, `${id} needs a training boundary`);
  }
});

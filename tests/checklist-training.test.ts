import assert from "node:assert/strict";
import test from "node:test";

import {
  checklistTrainingModes,
  isChecklistTrainingMode,
  splitChecklistChallenge,
} from "../lib/checklist-training.ts";

test("checklist trainer exposes all four v1.0 training modes", () => {
  assert.deepEqual(
    checklistTrainingModes.map((mode) => mode.key),
    ["learn", "practice", "flow", "challenge"],
  );
});

test("challenge and response parser preserves simulator checklist wording", () => {
  assert.deepEqual(splitChecklistChallenge("BAT 1 and BAT 2 — ON"), {
    challenge: "BAT 1 and BAT 2",
    response: "ON",
  });

  assert.deepEqual(splitChecklistChallenge("Monitor engine start"), {
    challenge: "Monitor engine start",
    response: null,
  });
});

test("unknown checklist modes are rejected", () => {
  assert.equal(isChecklistTrainingMode("flow"), true);
  assert.equal(isChecklistTrainingMode("challenge"), true);
  assert.equal(isChecklistTrainingMode("exam"), false);
});

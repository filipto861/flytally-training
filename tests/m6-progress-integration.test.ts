import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

const checklist = fs.readFileSync(new URL("../components/checklist-runner.tsx", import.meta.url), "utf8");
const scenarios = fs.readFileSync(new URL("../components/scenario-trainer.tsx", import.meta.url), "utf8");
const knowledge = fs.readFileSync(new URL("../components/knowledge-trainer.tsx", import.meta.url), "utf8");

test("interactive M6 training surfaces emit the shared progress contract", () => {
  assert.match(checklist, /appendBrowserProgress/);
  assert.match(scenarios, /appendBrowserProgress/);
  assert.match(knowledge, /appendBrowserProgress/);
});

test("learner-facing M6 components remain aircraft-agnostic", () => {
  for (const source of [checklist, scenarios, knowledge]) {
    assert.doesNotMatch(source, /learjet-35-36/i);
  }
});

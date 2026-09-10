import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

const checklist = fs.readFileSync(new URL("../components/checklist-runner.tsx", import.meta.url), "utf8");
const scenarios = fs.readFileSync(new URL("../components/scenario-trainer.tsx", import.meta.url), "utf8");
const knowledge = fs.readFileSync(new URL("../components/knowledge-trainer.tsx", import.meta.url), "utf8");
const learningCompletion = fs.readFileSync(new URL("../components/learning-completion-button.tsx", import.meta.url), "utf8");
const quickStart = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/quick-start/page.tsx", import.meta.url), "utf8");
const systems = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/systems/page.tsx", import.meta.url), "utf8");
const orientation = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/orientation/page.tsx", import.meta.url), "utf8");
const orientationExplorer = fs.readFileSync(new URL("../components/cockpit-orientation-explorer.tsx", import.meta.url), "utf8");
const progressPanel = fs.readFileSync(new URL("../components/progress-panel.tsx", import.meta.url), "utf8");

test("interactive v1 learning surfaces emit the shared progress contract", () => {
  assert.match(checklist, /appendBrowserProgress/);
  assert.match(scenarios, /appendBrowserProgress/);
  assert.match(knowledge, /appendBrowserProgress/);
  assert.match(learningCompletion, /appendBrowserProgress/);
  assert.match(quickStart, /kind="quick-start"/);
  assert.match(quickStart, /contentId="quick-start"/);
  assert.match(systems, /kind="systems"/);
  assert.match(systems, /contentId=\{system\.id\}/);
  assert.match(orientation, /kind="orientation"/);
  assert.match(orientation, /contentId="cockpit-orientation"/);
});

test("learning completion controls reuse one aircraft-level account progress load", () => {
  assert.match(learningCompletion, /const initialLoads = new Map/);
  assert.match(learningCompletion, /loadOnce\(aircraftId\)/);
});

test("progress page uses the POST-only Training sign-out contract", () => {
  assert.match(progressPanel, /action="\/api\/auth\/logout" method="post"/);
  assert.doesNotMatch(progressPanel, /href="\/api\/auth\/logout"/);
});

test("cockpit orientation rendering does not hard-code the Learjet source or region ids", () => {
  assert.doesNotMatch(orientationExplorer, /FlightSafety Learjet 35\/36/);
  assert.match(orientationExplorer, /orientation\.regions\[0\]\?\.id/);
  assert.match(orientationExplorer, /styles\[region\.id\] \?\? ""/);
});

test("learner-facing progress components remain aircraft-agnostic", () => {
  for (const source of [checklist, scenarios, knowledge, learningCompletion, orientation, orientationExplorer]) {
    assert.doesNotMatch(source, /learjet-35-36/i);
  }
});

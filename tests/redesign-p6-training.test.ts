import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { configurationForVariant } from "../lib/aircraft-applicability.ts";
import { resolveTrainingScenarioContent } from "../lib/training-scenario-presentation.ts";
import {
  initialScenarioSessionState,
  scenarioSessionReducer,
} from "../lib/scenario-session.ts";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("P6.1 Training remains under the existing TRAINING IA destination", () => {
  const ia = read("lib/aircraft-content-ia.ts");
  const route = read("app/aircraft/[aircraftId]/training/page.tsx");

  assert.match(ia, /key:\s*"training"/);
  assert.match(ia, /label:\s*"TRAINING"/);
  assert.match(route, /isNewShellEnabled/);
  assert.match(route, /FtTrainingPage/);
  assert.match(route, /AircraftWorkspaceNav/);
  assert.doesNotMatch(route, /FtShell/);
});

test("P6.1 new-shell Training presentation owns no Active Flight lifecycle", () => {
  const page = read("components/ft-training/FtTrainingPage.tsx");

  assert.match(page, /data-ft-training-page="true"/);
  assert.match(page, /ScenarioTrainer/);
  assert.doesNotMatch(page, /getActiveFlight|createActiveFlight|deactivate|archive/i);
  assert.doesNotMatch(page, /active-flight/);
});

const scenarioPayload = {
  aircraftId: "generic-aircraft",
  title: "Generic Training",
  scenarios: [
    {
      id: "scenario-a",
      title: "Scenario A",
      category: "Generic",
      phase: "In flight",
      difficulty: "core",
      minutes: 2,
      summary: "Summary A",
      setup: "Setup A",
      objectives: ["Objective A"],
      debrief: ["Debrief A"],
      applicability: { equipmentAllOf: ["eq-a"] },
      stages: [
        {
          id: "stage-a",
          label: "Stage A",
          prompt: "Prompt A",
          expectedResponse: ["Response A"],
          explanation: "Explanation A",
          sources: [{ manualId: "source-a", pageLabel: "1" }],
        },
      ],
    },
    {
      id: "scenario-b",
      title: "Scenario B",
      category: "Generic",
      phase: "Ground",
      difficulty: "core",
      minutes: 1,
      summary: "Summary B",
      setup: "Setup B",
      objectives: ["Objective B"],
      debrief: ["Debrief B"],
      applicability: { equipmentAllOf: ["eq-b"] },
      stages: [
        {
          id: "stage-b",
          label: "Stage B",
          prompt: "Prompt B",
          expectedResponse: ["Response B"],
          explanation: "Explanation B",
          sources: [{ manualId: "source-b", pageLabel: "2" }],
        },
      ],
    },
  ],
};

test("P6.2 scenario projection accepts governed universal abnormal content and filters configuration", () => {
  const training = resolveTrainingScenarioContent(
    scenarioPayload,
    configurationForVariant(undefined, ["eq-a"]),
  );

  assert.ok(training);
  assert.deepEqual(training.scenarios.map((scenario) => scenario.id), ["scenario-a"]);
  assert.equal(training.scenarios[0]?.setup, "Setup A");
  assert.deepEqual(training.scenarios[0]?.debrief, ["Debrief A"]);
});

test("P6.2 scenario projection fails closed for invalid or fully filtered content", () => {
  assert.equal(
    resolveTrainingScenarioContent(
      { aircraftId: "generic-aircraft" },
      configurationForVariant(undefined, ["eq-a"]),
    ),
    undefined,
  );

  assert.equal(
    resolveTrainingScenarioContent(
      scenarioPayload,
      configurationForVariant(undefined, ["eq-c"]),
    ),
    undefined,
  );
});

test("P6 implementation remains aircraft-agnostic", () => {
  const source = [
    read("components/ft-training/FtTrainingPage.tsx"),
    read("lib/training-scenario-presentation.ts"),
    read("app/aircraft/[aircraftId]/training/page.tsx"),
  ].join("\n");

  assert.doesNotMatch(source, /learjet|35a|tfe731|bristell|cessna|boeing|rotax/i);
  assert.doesNotMatch(source, /aircraft\.model\s*===/i);
  assert.doesNotMatch(source, /scenario\.id\s*===\s*["']/i);
});


test("P6.2 new-shell Training supports a scenario-only governed package", () => {
  const route = read("app/aircraft/[aircraftId]/training/page.tsx");
  const newShellStart = route.indexOf("if (isNewShellEnabled())");
  const legacyGate = route.indexOf(
    "if (!startHere.length && !modules.length) notFound();",
    newShellStart,
  );

  assert.ok(newShellStart >= 0);
  assert.ok(legacyGate > newShellStart);
  assert.match(
    route.slice(newShellStart, legacyGate),
    /!startHere\.length && !modules\.length && !scenarioTraining/,
  );
});

test("P6.3 scenario session reducer preserves reveal and stage semantics deterministically", () => {
  let state = initialScenarioSessionState("scenario-a");
  assert.equal(state.selectedId, "scenario-a");
  assert.equal(state.stageIndex, 0);
  assert.equal(state.revealed, false);
  assert.equal(state.finished, false);

  state = scenarioSessionReducer(state, { type: "reveal" });
  assert.equal(state.revealed, true);

  state = scenarioSessionReducer(state, {
    type: "advance",
    scenarioId: "scenario-a",
    stageCount: 2,
  });
  assert.equal(state.stageIndex, 1);
  assert.equal(state.revealed, false);
  assert.equal(state.finished, false);

  state = scenarioSessionReducer(state, {
    type: "advance",
    scenarioId: "scenario-a",
    stageCount: 2,
  });
  assert.equal(state.finished, true);
  assert.deepEqual(state.completedIds, ["scenario-a"]);
});

test("P6.3 selecting another scenario resets transient reveal state but preserves evidence", () => {
  let state = initialScenarioSessionState("scenario-a");
  state = scenarioSessionReducer(state, {
    type: "advance",
    scenarioId: "scenario-a",
    stageCount: 1,
  });
  state = scenarioSessionReducer(state, {
    type: "toggle-repeat",
    scenarioId: "scenario-a",
  });
  state = scenarioSessionReducer(state, {
    type: "select",
    scenarioId: "scenario-b",
  });

  assert.equal(state.selectedId, "scenario-b");
  assert.equal(state.stageIndex, 0);
  assert.equal(state.revealed, false);
  assert.equal(state.finished, false);
  assert.deepEqual(state.completedIds, ["scenario-a"]);
  assert.deepEqual(state.repeatIds, ["scenario-a"]);
});

test("P6.3 targeted repeat is explicit and does not clear completion evidence", () => {
  let state = initialScenarioSessionState("scenario-a");
  state = scenarioSessionReducer(state, {
    type: "advance",
    scenarioId: "scenario-a",
    stageCount: 1,
  });
  state = scenarioSessionReducer(state, {
    type: "toggle-repeat",
    scenarioId: "scenario-a",
  });
  state = scenarioSessionReducer(state, { type: "repeat-now" });

  assert.equal(state.finished, false);
  assert.equal(state.stageIndex, 0);
  assert.deepEqual(state.completedIds, ["scenario-a"]);
  assert.deepEqual(state.repeatIds, ["scenario-a"]);

  state = scenarioSessionReducer(state, {
    type: "toggle-repeat",
    scenarioId: "scenario-a",
  });
  assert.deepEqual(state.repeatIds, []);
});

test("P6.3 ScenarioTrainer delegates transient session state to the deterministic reducer", () => {
  const trainer = read("components/scenario-trainer.tsx");

  assert.match(trainer, /useReducer/);
  assert.match(trainer, /scenarioSessionReducer/);
  assert.doesNotMatch(trainer, /useState/);
  assert.doesNotMatch(trainer, /procedure-graph-runtime/);
});


test("P6.4 debrief remains source-defined and targeted repeat stays explicit", () => {
  const trainer = read("components/scenario-trainer.tsx");

  assert.match(trainer, /scenario\.debrief\.map/);
  assert.match(trainer, /Repeat now/);
  assert.match(trainer, /Mark for targeted repeat/);
  assert.match(trainer, /Remove from repeat queue/);
  assert.match(trainer, /Practice queue/);

  for (const pattern of [
    /scorePercent/,
    /weakAreas/,
    /generate/i,
    /OpenAI/i,
    /inference/i,
  ]) {
    assert.doesNotMatch(
      trainer,
      pattern,
      `Scenario debrief must stay source-defined and unscored; matched ${pattern}`,
    );
  }
});

test("P6.5 scenario completion writes only the existing shared scenario progress event", () => {
  const trainer = read("components/scenario-trainer.tsx");
  const progress = read("lib/progress-events.ts");

  assert.match(progress, /"scenario"/);
  assert.match(trainer, /appendBrowserProgress/);
  assert.match(trainer, /kind:\s*"scenario"/);
  assert.match(trainer, /contentId:\s*scenario\.id/);
  assert.match(trainer, /completed:\s*true/);
  assert.doesNotMatch(trainer, /scorePercent|weakAreas/);
});

test("P6.5 Training and scenario implementation cannot mutate the D0 Active Flight lifecycle", () => {
  const source = [
    read("components/scenario-trainer.tsx"),
    read("components/ft-training/FtTrainingPage.tsx"),
    read("lib/scenario-session.ts"),
    read("lib/training-scenario-presentation.ts"),
    read("app/aircraft/[aircraftId]/training/page.tsx"),
  ].join("\n");

  for (const pattern of [
    /getActiveFlight/,
    /createActiveFlight/,
    /updateActiveFlight/,
    /deactivateActiveFlight/,
    /archivePreviousFlight/,
    /\/api\/active-flight/,
    /active-flight\/store/,
  ]) {
    assert.doesNotMatch(
      source,
      pattern,
      `P6 Training must not own Active Flight lifecycle; matched ${pattern}`,
    );
  }
});

test("P6.5 procedure graph runtime remains separate from scenario training", () => {
  const source = [
    read("components/scenario-trainer.tsx"),
    read("lib/scenario-session.ts"),
    read("lib/training-scenario-presentation.ts"),
  ].join("\n");

  assert.doesNotMatch(source, /procedure-graph-runtime/);
  assert.doesNotMatch(source, /selectProcedureGraphDecision/);
  assert.doesNotMatch(source, /advanceProcedureGraph/);
});

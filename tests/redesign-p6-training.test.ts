import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { configurationForVariant } from "../lib/aircraft-applicability.ts";
import { resolveTrainingScenarioContent } from "../lib/training-scenario-presentation.ts";

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

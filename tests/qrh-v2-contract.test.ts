import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { configurationForVariant } from "../lib/aircraft-applicability.ts";
import { toOperationalEmergency } from "../lib/operational-flight-data.ts";
import { resolveTrainingScenarioContent } from "../lib/training-scenario-presentation.ts";
import {
  isUniversalAbnormalEmergencyContent,
  validateUniversalAbnormalEmergencyPayload,
} from "../lib/universal-abnormal-emergency.ts";
import { createStructuredStarterPayload } from "../lib/content-authoring-templates.ts";

const source = { manualId: "generic-qrh", section: "QRH", pageLabel: "A-1" };

const sourceOnlyV2 = {
  schemaVersion: 2,
  aircraftId: "generic-aircraft",
  title: "Generic QRH",
  sectionIntroductions: [{
    procedureClass: "abnormal",
    paragraphs: ["Use the applicable source procedure."],
    sources: [source],
  }],
  scenarios: [{
    id: "door-condition",
    title: "Door condition",
    procedureClass: "abnormal",
    category: "Doors",
    effectivity: { kind: "all-aircraft", sourceText: "ALL" },
    stages: [{
      id: "response",
      label: "Response",
      memoryItem: true,
      sources: [source],
      steps: [{
        id: "evidence-branch",
        kind: "condition",
        branches: [
          {
            id: "evidence-present",
            label: "If evidence is present",
            steps: [{
              id: "action-a",
              kind: "action",
              label: "1",
              text: "Action A",
              memoryItem: true,
            }],
          },
          {
            id: "evidence-absent",
            label: "If evidence is absent",
            steps: [{
              id: "action-b",
              kind: "action",
              label: "1",
              text: "Action B",
            }],
          },
        ],
      }],
    }],
  }],
} as const;

test("QRH.2 v2 accepts source-exact operational content without invented training metadata", () => {
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(sourceOnlyV2), []);
  assert.equal(isUniversalAbnormalEmergencyContent(sourceOnlyV2), true);

  const serialized = JSON.stringify(sourceOnlyV2);
  for (const trainingOnly of ["difficulty", "minutes", "summary", "setup", "objectives", "debrief", "prompt", "explanation"]) {
    assert.equal(serialized.includes(`"${trainingOnly}"`), false);
  }
});

test("QRH.2 operational projection preserves class, memory semantics, section guidance and conditional branches", () => {
  const operational = toOperationalEmergency(sourceOnlyV2);

  assert.equal(operational.scenarios[0]?.procedureClass, "abnormal");
  assert.equal(operational.scenarios[0]?.stages[0]?.memoryItem, true);
  assert.equal(operational.sectionIntroductions[0]?.procedureClass, "abnormal");

  const condition = operational.scenarios[0]?.stages[0]?.steps[0];
  assert.equal(condition?.kind, "condition");
  if (!condition || condition.kind !== "condition") assert.fail("condition step missing");
  assert.deepEqual(condition.branches.map((branch) => branch.label), [
    "If evidence is present",
    "If evidence is absent",
  ]);
  const firstAction = condition.branches[0]?.steps[0];
  assert.equal(firstAction?.kind, "action");
  if (!firstAction || firstAction.kind !== "action") assert.fail("action step missing");
  assert.equal(firstAction.memoryItem, true);
  assert.equal(firstAction.label, "1");
  assert.equal(firstAction.text, "Action A");
});

test("QRH.2 source-only v2 procedures do not silently become Training scenarios", () => {
  assert.equal(
    resolveTrainingScenarioContent(
      sourceOnlyV2,
      configurationForVariant(undefined),
    ),
    undefined,
  );
});

test("QRH.2 optional training overlay projects only a linear source procedure", () => {
  const payload = {
    schemaVersion: 2,
    aircraftId: "generic-aircraft",
    title: "Generic QRH",
    scenarios: [{
      id: "linear",
      title: "Linear procedure",
      procedureClass: "emergency",
      category: "Generic",
      phase: "In flight",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      stages: [{
        id: "memory",
        label: "Memory",
        memoryItem: true,
        sources: [source],
        steps: [
          { id: "a", kind: "action", text: "Action A", memoryItem: true },
          { id: "b", kind: "action", text: "Action B" },
        ],
      }],
      training: {
        difficulty: "core",
        minutes: 2,
        summary: "Training summary.",
        setup: "Training setup.",
        objectives: ["Apply the source procedure."],
        debrief: ["Review the response."],
        stages: [{
          stageId: "memory",
          prompt: "What is the response?",
          explanation: "Use the published sequence.",
        }],
      },
    }],
  } as const;

  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(payload), []);
  const training = resolveTrainingScenarioContent(payload, configurationForVariant(undefined));
  assert.ok(training);
  assert.deepEqual(training.scenarios[0]?.stages[0]?.expectedResponse, ["Action A", "Action B"]);
});

test("QRH.2 mapped source effectivity fails closed without an explicit applicability selector", () => {
  const invalid = structuredClone(sourceOnlyV2) as any;
  invalid.scenarios[0].effectivity = {
    kind: "mapped",
    sourceText: "Selected serial/modification family",
  };
  assert.match(
    validateUniversalAbnormalEmergencyPayload(invalid).join("\n"),
    /QRH v2 scenario contract/,
  );

  invalid.scenarios[0].applicability = { equipmentAllOf: ["configured-option"] };
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(invalid), []);
});

test("QRH.2 authoring starter is operational-first and does not require training prose", () => {
  const starter = createStructuredStarterPayload("generic-aircraft", "abnormal") as any;
  assert.equal(starter.schemaVersion, 2);
  assert.equal(starter.scenarios[0].procedureClass, "emergency");
  assert.equal(starter.scenarios[0].stages[0].memoryItem, false);
  assert.equal(starter.scenarios[0].stages[0].steps[0].kind, "action");
  assert.equal("difficulty" in starter.scenarios[0], false);
  assert.equal("setup" in starter.scenarios[0], false);
});

test("QRH.2 operational UI uses explicit semantics rather than label inference", () => {
  const ui = readFileSync(new URL("../components/operational-emergency.tsx", import.meta.url), "utf8");
  assert.match(ui, /scenario\.procedureClass\.toUpperCase\(\)/);
  assert.match(ui, /stage\.memoryItem/);
  assert.match(ui, /step\.memoryItem/);
  assert.match(ui, /step\.kind === "action"/);
  assert.doesNotMatch(ui, /\/immediate\|memory\/i/);
  assert.doesNotMatch(ui, /<span>EMERGENCY<\/span>/);
});

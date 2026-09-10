import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { normalizeUniversalAbnormalEmergency } from "../lib/abnormal-runtime.ts";
import { validateContentPayload } from "../lib/content-contracts.ts";
import { isUniversalAbnormalEmergencyContent } from "../lib/universal-abnormal-emergency.ts";

const abnormalPage = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/abnormal/page.tsx", import.meta.url), "utf8");
const trainer = fs.readFileSync(new URL("../components/scenario-trainer.tsx", import.meta.url), "utf8");

const universal = {
  aircraftId: "generic-aircraft",
  title: "Abnormal and emergency procedures",
  sourceNote: "Registered source.",
  disclaimer: "Approved aircraft documentation remains controlling.",
  scenarios: [{
    id: "electrical-event",
    title: "Electrical event",
    category: "Electrical",
    phase: "Cruise",
    difficulty: "core",
    minutes: 3,
    summary: "Recognize and manage the published event.",
    setup: "An electrical indication changes in cruise.",
    objectives: ["Recognize the condition", "Apply the sourced procedure"],
    applicability: { equipmentAllOf: ["electrical-option-a"] },
    stages: [
      {
        id: "identify",
        label: "Identify condition",
        prompt: "What indication defines the event?",
        expectedResponse: ["Identify the source-backed indication."],
        explanation: "Recognition comes before procedure execution.",
        sources: [{ manualId: "manual-r1", chapter: "3", section: "Electrical", pageLabel: "3-4" }],
      },
      {
        id: "procedure",
        label: "Apply procedure",
        prompt: "What published action follows?",
        expectedResponse: ["Apply the controlling procedure."],
        explanation: "No fixed training-stage vocabulary is imposed by the application.",
        sources: [{ manualId: "manual-r1", chapter: "3", section: "Electrical", pageLabel: "3-5" }],
      },
    ],
    debrief: ["Was the condition positively identified?"],
  }],
} as const;

test("universal abnormal content permits aircraft-defined stage sequences with explicit provenance", () => {
  assert.deepEqual(validateContentPayload("abnormal", universal, universal.aircraftId), []);
  assert.equal(isUniversalAbnormalEmergencyContent(universal), true);
  const runtime = normalizeUniversalAbnormalEmergency(universal);
  assert.deepEqual(runtime.scenarios[0].stages.map((stage) => stage.label), ["Identify condition", "Apply procedure"]);
  assert.equal(runtime.scenarios[0].stages[0].sources[0].manualId, "manual-r1");
});

test("universal abnormal publication fails closed without stage provenance or with malformed applicability", () => {
  const missingSource = structuredClone(universal) as unknown as { scenarios: Array<{ stages: Array<{ sources?: unknown }> }> };
  delete missingSource.scenarios[0].stages[0].sources;
  assert.match(validateContentPayload("abnormal", missingSource, universal.aircraftId).join("\n"), /universal abnormal stage contract/);

  const malformedApplicability = structuredClone(universal) as unknown as { scenarios: Array<{ applicability: { equipmentAllOf: string[] } }> };
  malformedApplicability.scenarios[0].applicability.equipmentAllOf = [];
  assert.match(validateContentPayload("abnormal", malformedApplicability, universal.aircraftId).join("\n"), /applicability\.equipmentAllOf/);
});

test("abnormal learner route prefers universal published content but retains legacy migration fallback", () => {
  assert.match(abnormalPage, /getPublishedAircraftModule<unknown>\(repository, aircraftId, "abnormal"\)/);
  assert.match(abnormalPage, /isUniversalAbnormalEmergencyContent\(published\)/);
  assert.match(abnormalPage, /filterAbnormalEmergencyForConfiguration/);
  assert.match(abnormalPage, /normalizeUniversalAbnormalEmergency/);
  assert.match(abnormalPage, /normalizeLegacyAbnormalTraining/);
  assert.match(abnormalPage, /configurationForAircraftVariant\(aircraft, selectedVariant\)/);
});

test("scenario trainer is data-driven rather than hard-coded to Learjet M5 stage ids", () => {
  assert.match(trainer, /item\.label/);
  assert.match(trainer, /stage\.label/);
  assert.doesNotMatch(trainer, /Record<ScenarioStageId/);
  assert.doesNotMatch(trainer, /Simulator setup/);
  assert.match(trainer, /Scenario setup/);
});

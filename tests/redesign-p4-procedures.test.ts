import assert from "node:assert/strict";
import test from "node:test";

import {
  procedureRelevance,
  type ProcedureRelevanceModel,
} from "../lib/procedure-presentation.ts";
import type {
  AircraftGraphProcedure,
  AircraftProcedure,
  TrainingSourceReference,
} from "../lib/universal-aircraft-content.ts";

const source: TrainingSourceReference = {
  manualId: "browser-ci-procedure-source",
  chapter: "1",
  section: "P4 deterministic fixture",
  pageLabel: "P4-1",
};

function assertNoInferenceLanguage(model: ProcedureRelevanceModel): void {
  const serialized = JSON.stringify(model).toLocaleLowerCase();
  for (const forbidden of [
    "because",
    "recommended",
    "you need",
    "frequently",
    "likely",
  ]) {
    assert.equal(
      serialized.includes(forbidden),
      false,
      `Relevance must not infer "${forbidden}"`,
    );
  }
}

test("P4 Relevance contains only permitted source-defined facts", () => {
  const graphProcedure: AircraftGraphProcedure = {
    id: "generic-graph",
    title: "Generic Graph Procedure",
    phase: "Test phase",
    prerequisites: ["Pre A", "Pre B"],
    completionCriteria: ["Complete A"],
    sources: [source],
    graph: {
      version: 1,
      entryNodeId: "action-a",
      nodes: [
        {
          id: "action-a",
          kind: "action",
          action: "Memory Action A",
          conditionText: "When A applies.",
          crewRole: "PF",
          memoryItem: true,
          nextNodeId: "reference-a",
        },
        {
          id: "reference-a",
          kind: "reference",
          instruction: "Memory Reference A",
          targets: [{ title: "Reference A" }],
          crewRole: "PF",
          memoryItem: true,
          nextNodeId: "end-a",
        },
        {
          id: "end-a",
          kind: "end",
          label: "Complete",
        },
      ],
    },
  };

  const graphModel = procedureRelevance(graphProcedure);

  assert.equal(graphModel.phase, "Test phase");
  assert.deepEqual(graphModel.prerequisites, ["Pre A", "Pre B"]);
  assert.deepEqual(graphModel.completionCriteria, ["Complete A"]);
  assert.deepEqual(graphModel.conditionTexts, ["When A applies."]);
  assert.deepEqual(graphModel.crewRoles, ["PF"]);
  assert.deepEqual(graphModel.memoryItems, ["Memory Action A", "Memory Reference A"]);
  assert.deepEqual(graphModel.sources, [source]);

  const linearProcedure: AircraftProcedure = {
    id: "generic-linear",
    title: "Generic Linear Procedure",
    phase: "Preparation",
    prerequisites: ["Linear Pre"],
    completionCriteria: ["Linear Complete"],
    sources: [source],
    steps: [
      {
        id: "step-a",
        action: "Action A",
      },
    ],
  };

  const linearModel = procedureRelevance(linearProcedure);

  assert.equal(linearModel.phase, "Preparation");
  assert.deepEqual(linearModel.prerequisites, ["Linear Pre"]);
  assert.deepEqual(linearModel.completionCriteria, ["Linear Complete"]);
  assert.deepEqual(linearModel.sources, [source]);
  assert.deepEqual(linearModel.conditionTexts, []);
  assert.deepEqual(linearModel.crewRoles, []);
  assert.deepEqual(linearModel.memoryItems, []);
});

test("P4 Relevance contains no flight, weather, performance or aircraft inference", () => {
  const procedure: AircraftProcedure = {
    id: "generic-no-inference",
    title: "Engine weather likely recommended because fuel",
    summary: "You need this frequently.",
    sources: [source],
    steps: [
      {
        id: "step-a",
        action: "Neutral action",
      },
    ],
  };

  const model = procedureRelevance(procedure);

  assert.deepEqual(model.prerequisites, []);
  assert.deepEqual(model.completionCriteria, []);
  assert.deepEqual(model.conditionTexts, []);
  assert.deepEqual(model.crewRoles, []);
  assert.deepEqual(model.memoryItems, []);
  assert.deepEqual(model.sources, [source]);
  assertNoInferenceLanguage(model);
});

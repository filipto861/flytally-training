import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  procedureLearnProjection,
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


test("P4 Learn projects linear procedure explanation without mutating execution state", () => {
  const procedure: AircraftProcedure = {
    id: "generic-linear-learn",
    title: "Generic Linear Learn Procedure",
    steps: [
      {
        id: "step-a",
        action: "Action A",
        expectedResult: "Expected A",
        verification: "Verify A",
        rationale: "Reason A",
        sources: [source],
      },
      {
        id: "step-b",
        action: "Action B",
      },
    ],
  };

  const before = JSON.stringify(procedure);
  const model = procedureLearnProjection(procedure);

  assert.equal(model.kind, "linear");
  if (model.kind !== "linear") assert.fail("Expected linear Learn projection");

  assert.equal(model.steps.length, 2);
  assert.deepEqual(model.steps.map((step) => step.id), ["step-a", "step-b"]);

  const first = model.steps[0];
  const second = model.steps[1];
  assert.ok(first);
  assert.ok(second);

  assert.equal(first.action, "Action A");
  assert.equal(first.expectedResult, "Expected A");
  assert.equal(first.verification, "Verify A");
  assert.equal(first.rationale, "Reason A");
  assert.deepEqual(first.sources, [source]);

  assert.equal(second.action, "Action B");
  assert.equal(second.expectedResult, undefined);
  assert.equal(JSON.stringify(procedure), before);
});

test("P4 Learn exposes graph branch content as read-only training material", () => {
  const procedure: AircraftGraphProcedure = {
    id: "generic-graph-learn",
    title: "Generic Graph Learn Procedure",
    graph: {
      version: 1,
      entryNodeId: "decision-a",
      nodes: [
        {
          id: "action-a",
          kind: "action",
          action: "Graph Action A",
          expectedResult: "Graph Expected A",
          nextNodeId: "end-d",
        },
        {
          id: "decision-a",
          kind: "decision",
          prompt: "Select condition",
          options: [
            {
              id: "condition-a",
              label: "Condition A",
              targetNodeId: "action-a",
            },
            {
              id: "condition-b",
              label: "Condition B",
              targetNodeId: "note-b",
            },
          ],
        },
        {
          id: "note-b",
          kind: "note",
          text: "Graph Note B",
          nextNodeId: "reference-c",
        },
        {
          id: "reference-c",
          kind: "reference",
          instruction: "Review Reference C",
          targets: [{ title: "Reference C" }],
          nextNodeId: "end-d",
        },
        {
          id: "end-d",
          kind: "end",
          label: "Complete",
        },
      ],
    },
  };

  const before = JSON.stringify(procedure);
  const model = procedureLearnProjection(procedure);

  assert.equal(model.kind, "graph");
  if (model.kind !== "graph") assert.fail("Expected graph Learn projection");

  assert.equal(model.nodes.length, 5);
  assert.deepEqual(
    model.nodes.map((node) => node.id),
    ["action-a", "decision-a", "note-b", "reference-c", "end-d"],
  );
  assert.deepEqual(
    model.nodes.map((node) => node.kind),
    ["ACTION", "DECISION", "NOTE", "REFERENCE", "END"],
  );

  const action = model.nodes[0];
  const decision = model.nodes[1];
  assert.ok(action);
  assert.ok(decision);
  assert.equal(action.kind, "ACTION");
  assert.equal(decision.kind, "DECISION");
  if (decision.kind === "DECISION") {
    assert.deepEqual(
      decision.options.map((option) => option.id),
      ["condition-a", "condition-b"],
    );
  }

  assert.notEqual(model.nodes[0]?.id, procedure.graph.entryNodeId);
  assert.equal(JSON.stringify(procedure), before);
});


const operateSource = readFileSync(
  new URL("../components/ft-procedures/FtProcedureOperate.tsx", import.meta.url),
  "utf8",
);

test("P4 Operate delegates linear ordering and completion to the existing procedure controller", () => {
  assert.match(operateSource, /ProcedureLinearRunner/);
  assert.match(operateSource, /ProcedureGraphRunner/);

  for (const pattern of [
    /\buseState\b/,
    /\buseEffect\b/,
    /\buseReducer\b/,
    /sessionStorage/,
    /localStorage/,
    /window\.location\.hash/,
    /hashchange/,
    /history\.replaceState/,
    /procedureStepKey/,
    /toggleLinearStep/,
  ]) {
    assert.doesNotMatch(
      operateSource,
      pattern,
      `FtProcedureOperate must delegate linear execution; matched ${pattern}`,
    );
  }
});

test("P4 Operate delegates graph decisions to the existing graph runtime without adding branch logic", () => {
  for (const pattern of [
    /evaluateDecision/,
    /selectBranch/,
    /option\.label\s*===/,
    /option\.targetNodeId\s*===/,
    /advanceProcedureGraph/,
    /selectProcedureGraphDecision/,
    /switch\s*\([^)]*(?:option|decision|branch)/i,
  ]) {
    assert.doesNotMatch(
      operateSource,
      pattern,
      `FtProcedureOperate must delegate graph execution; matched ${pattern}`,
    );
  }
});


const proceduresPageSource = readFileSync(
  new URL("../components/ft-procedures/FtProceduresPage.tsx", import.meta.url),
  "utf8",
);
const proceduresIndexSource = readFileSync(
  new URL("../components/ft-procedures/FtProcedureIndex.tsx", import.meta.url),
  "utf8",
);
const proceduresDetailSource = readFileSync(
  new URL("../components/ft-procedures/FtProcedureDetail.tsx", import.meta.url),
  "utf8",
);
const proceduresPresentationSources = [
  proceduresPageSource,
  proceduresIndexSource,
  proceduresDetailSource,
];

test("P4 new-shell Procedures page owns no session state and defines no second storage key", () => {
  assert.match(proceduresPageSource, /data-ft-procedures-page="true"/);
  assert.match(proceduresPageSource, /aria-label="Procedures workspace"/);

  for (const sourceText of proceduresPresentationSources) {
    for (const pattern of [
      /sessionStorage/,
      /localStorage/,
      /readProcedureSessionV2/,
      /writeProcedureSessionV2/,
      /procedureSessionReducer/,
      /\buseReducer\b/,
      /ProcedureSessionSnapshotV2/,
    ]) {
      assert.doesNotMatch(
        sourceText,
        pattern,
        `P4 presentation must not own procedure session state; matched ${pattern}`,
      );
    }
  }
});

test("P4 presentation defines no independent deep-link controller", () => {
  for (const sourceText of proceduresPresentationSources) {
    for (const pattern of [
      /window\.location\.hash/,
      /hashchange/,
      /history\.replaceState/,
    ]) {
      assert.doesNotMatch(
        sourceText,
        pattern,
        `P4 presentation must leave deep-link ownership in ProcedureBrowser; matched ${pattern}`,
      );
    }
  }
});


const proceduresRouteSource = readFileSync(
  new URL("../app/aircraft/[aircraftId]/procedures/page.tsx", import.meta.url),
  "utf8",
);

test("P4 new-shell Procedures route stays gated while legacy flag-off fallback survives", () => {
  assert.match(proceduresRouteSource, /isNewShellEnabled/);
  assert.match(proceduresRouteSource, /ProcedureBrowser/);
  assert.match(proceduresRouteSource, /presentation="new-shell"/);
  assert.match(proceduresRouteSource, /notFound/);

  for (const pattern of [
    /FtShell/,
    /CONTENT_IA/,
    /aircraftId\s*===\s*["']/,
    /aircraft\.model\s*===\s*["']/,
  ]) {
    assert.doesNotMatch(
      proceduresRouteSource,
      pattern,
      `P4 Procedures route must remain generic and shell-safe; matched ${pattern}`,
    );
  }

  assert.match(
    proceduresRouteSource,
    /configuredUniversal\?\.procedures\s*\?\?\s*legacy\?\.phases\.map\(/,
  );
});

test("P4 flag-on route requires governed universal procedures and does not promote legacy normal-flight content", () => {
  const newShellStart = proceduresRouteSource.indexOf("if (isNewShellEnabled())");
  const legacyResolutionStart = proceduresRouteSource.indexOf(
    "const procedures:",
    newShellStart,
  );

  assert.ok(newShellStart >= 0, "new-shell route branch must exist");
  assert.ok(
    legacyResolutionStart > newShellStart,
    "legacy procedure resolution must remain after the new-shell branch",
  );

  const newShellBlock = proceduresRouteSource.slice(
    newShellStart,
    legacyResolutionStart,
  );

  assert.match(newShellBlock, /if \(!configuredUniversal\) notFound\(\)/);
  assert.match(newShellBlock, /procedures=\{configuredUniversal\.procedures\}/);
  assert.match(newShellBlock, /presentation="new-shell"/);
  assert.doesNotMatch(newShellBlock, /\blegacy\b/);
});


test("P4 source authority presentation preserves source-policy distinction", () => {
  const detailFile = readFileSync(
    new URL("../components/ft-procedures/FtProcedureDetail.tsx", import.meta.url),
    "utf8",
  );

  assert.match(detailFile, /sourcePolicy\s*===\s*"available-sources"/);
  assert.match(
    detailFile,
    /Sources: available training material\. Not FAA-approved\./,
  );

  for (const pattern of [
    /sourcePolicy\s*!==\s*"available-sources"/,
    /sourcePolicy\s*===\s*"faa-approved"/,
    /sourcePolicy\s*===\s*undefined/,
  ]) {
    assert.doesNotMatch(
      detailFile,
      pattern,
      `Source-policy warning must remain exclusive to available-sources; matched ${pattern}`,
    );
  }
});

test("P4 implementation contains no aircraft-specific rendering or relevance branches", () => {
  const implementationPaths = [
    "components/ft-procedures/FtProceduresPage.tsx",
    "components/ft-procedures/FtProcedureIndex.tsx",
    "components/ft-procedures/FtProcedureDetail.tsx",
    "components/ft-procedures/FtProcedureLearn.tsx",
    "components/ft-procedures/FtProcedureOperate.tsx",
    "components/ft-procedures/FtProcedureRelevance.tsx",
    "lib/procedure-presentation.ts",
  ] as const;

  const prohibitedPatterns = [
    /learjet/i,
    /35a/i,
    /tfe731/i,
    /aircraft\.model\s*===/i,
    /switch\s*\(\s*aircraft\.model\s*\)/i,
    /procedure\.id\s*===\s*["']/i,
    /procedure\.title\.includes\(/i,
  ] as const;

  for (const path of implementationPaths) {
    const sourceText = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
    for (const pattern of prohibitedPatterns) {
      assert.doesNotMatch(
        sourceText,
        pattern,
        `${path} must remain aircraft-agnostic; matched ${pattern}`,
      );
    }
  }
});

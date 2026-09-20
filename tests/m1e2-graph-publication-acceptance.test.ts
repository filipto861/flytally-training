import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { fingerprintGraphProcedure } from "../lib/procedure-definition-fingerprint.ts";
import {
  advanceProcedureGraph,
  createProcedureGraphExecutionState,
  isProcedureGraphComplete,
  selectProcedureGraphDecision,
} from "../lib/procedure-graph-runtime.ts";
import { procedureSearchText } from "../lib/procedure-runtime.ts";
import {
  readProcedureSessionV2,
  writeProcedureSessionV2,
  type ProcedureSessionContextV2,
  type ProcedureSessionSnapshotV2,
  type ProcedureSessionStorage,
} from "../lib/procedure-session.ts";
import {
  validateUniversalTrainingContentPayload,
  type AircraftGraphProcedure,
  type AircraftProcedure,
} from "../lib/universal-aircraft-content.ts";

const source = [{
  manualId: "zr-lite-afms-204l-5780",
  section: "III",
  pageLabel: "3-1",
}] as const;

const procedure = {
  id: "engine-failure-during-takeoff",
  title: "Engine Failure — During Takeoff",
  phase: "Takeoff",
  applicability: {
    baseVariants: ["35", "35a", "36", "36a"],
    modificationsAllOf: ["zr-lite"],
  },
  graph: {
    version: 1,
    entryNodeId: "takeoff-speed-decision",
    nodes: [
      {
        id: "takeoff-speed-decision",
        kind: "decision",
        prompt: "Was the engine failure below or above V1 speed?",
        options: [
          { id: "below-v1", label: "Below V1 speed", targetNodeId: "below-thrust-idle" },
          { id: "above-v1", label: "Above V1 speed", targetNodeId: "above-directional-note" },
        ],
        sources: source,
      },
      {
        id: "below-thrust-idle",
        kind: "action",
        action: "Thrust Levers — IDLE.",
        memoryItem: true,
        nextNodeId: "below-wheel-brakes",
        sources: source,
      },
      {
        id: "below-wheel-brakes",
        kind: "action",
        action: "Wheel Brakes — APPLY.",
        memoryItem: true,
        nextNodeId: "below-spoilers",
        sources: source,
      },
      {
        id: "below-spoilers",
        kind: "action",
        action: "Spoilers — EXT.",
        memoryItem: true,
        nextNodeId: "below-drag-device",
        sources: source,
      },
      {
        id: "below-drag-device",
        kind: "action",
        action: "Drag Chute or Thrust Reversers — Deploy, if necessary.",
        conditionText: "If installed.",
        memoryItem: true,
        nextNodeId: "below-end",
        sources: source,
      },
      {
        id: "below-end",
        kind: "end",
        label: "Below V1 branch complete",
        sources: source,
      },
      {
        id: "above-directional-note",
        kind: "note",
        text: "Directional Control is improved if the nose wheel is kept on the runway until VR.",
        nextNodeId: "above-directional-control",
        sources: source,
      },
      {
        id: "above-directional-control",
        kind: "action",
        action: "Rudder and Ailerons — As required, for directional control.",
        memoryItem: true,
        nextNodeId: "above-accelerate-vr",
        sources: source,
      },
      {
        id: "above-accelerate-vr",
        kind: "action",
        action: "Accelerate to VR.",
        memoryItem: true,
        nextNodeId: "above-rotate-v2",
        sources: source,
      },
      {
        id: "above-rotate-v2",
        kind: "action",
        action: "Rotate at VR; Climb at V2.",
        memoryItem: true,
        nextNodeId: "above-gear-up",
        sources: source,
      },
      {
        id: "above-gear-up",
        kind: "action",
        action: "GEAR — UP, when positive rate of climb is established.",
        memoryItem: true,
        nextNodeId: "above-accelerate-flaps",
        sources: source,
      },
      {
        id: "above-accelerate-flaps",
        kind: "action",
        action: "When clear of obstacles, accelerate to V2 + 35 and then retract flaps.",
        memoryItem: true,
        nextNodeId: "above-fuel-jettison",
        sources: source,
      },
      {
        id: "above-fuel-jettison",
        kind: "action",
        action: "FUEL JTSN Switch — ON (lights on); Off prior to touchdown.",
        memoryItem: true,
        nextNodeId: "above-tip-tank-note",
        sources: source,
      },
      {
        id: "above-tip-tank-note",
        kind: "note",
        text: "Lateral control is improved with tip tanks empty. If time permits, it is recommended that tip tank fuel be jettisoned.",
        nextNodeId: "above-shutdown-reference",
        sources: source,
      },
      {
        id: "above-shutdown-reference",
        kind: "reference",
        instruction: "Refer to ENGINE SHUTDOWN IN FLIGHT procedure, Section IV of the basic AFM, or ENGINE FIRE — SHUTDOWN procedure, Section 3 of the basic AFM.",
        targets: [
          { title: "ENGINE SHUTDOWN IN FLIGHT", sourceLocationText: "Section IV of the basic AFM" },
          { title: "ENGINE FIRE — SHUTDOWN", sourceLocationText: "Section 3 of the basic AFM" },
        ],
        memoryItem: true,
        nextNodeId: "above-end",
        sources: source,
      },
      {
        id: "above-end",
        kind: "end",
        label: "Above V1 branch complete",
        sources: source,
      },
    ],
  },
  sources: source,
} as const satisfies AircraftGraphProcedure;

const fixture = {
  aircraftId: "graph-acceptance-aircraft",
  title: "Emergency procedures",
  procedures: [procedure],
} as const;

function memoryStorage(): ProcedureSessionStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

function walkBranch(optionId: "below-v1" | "above-v1") {
  const initial = createProcedureGraphExecutionState(procedure.graph);
  const selected = selectProcedureGraphDecision(
    procedure.graph,
    initial,
    optionId,
  );
  assert.equal(selected.ok, true);

  let state = selected.value;
  while (!isProcedureGraphComplete(procedure.graph, state)) {
    const next = advanceProcedureGraph(procedure.graph, state);
    assert.equal(next.ok, true);
    state = next.value;
  }
  return state;
}

test("M1-E2C valid graph procedure passes the universal content parser", () => {
  assert.deepEqual(
    validateUniversalTrainingContentPayload("procedures", fixture),
    [],
  );
});

test("M1-E2C real below-V1 branch reaches END without visiting the other branch", () => {
  const state = walkBranch("below-v1");
  assert.equal(isProcedureGraphComplete(procedure.graph, state), true);
  assert.equal(state.completedNodeIds.includes("below-drag-device"), true);
  assert.equal(state.completedNodeIds.includes("above-directional-control"), false);
});

test("M1-E2C real above-V1 branch reaches END through notes and reference", () => {
  const state = walkBranch("above-v1");
  assert.equal(isProcedureGraphComplete(procedure.graph, state), true);
  assert.equal(state.completedNodeIds.includes("above-directional-note"), true);
  assert.equal(state.completedNodeIds.includes("above-tip-tank-note"), true);
  assert.equal(state.completedNodeIds.includes("above-shutdown-reference"), true);
  assert.equal(state.completedNodeIds.includes("below-thrust-idle"), false);
});

test("M1-E2C decision still has no implicit fallback", () => {
  const unresolved = advanceProcedureGraph(
    procedure.graph,
    createProcedureGraphExecutionState(procedure.graph),
  );
  assert.equal(unresolved.ok, false);
});

test("M1-E2C graph session writes and restores with fingerprint and configuration snapshot", () => {
  const storage = memoryStorage();
  const fingerprint = fingerprintGraphProcedure(procedure);
  const completed = walkBranch("above-v1");
  const timestamp = "2026-09-20T12:00:00.000Z";
  const context: ProcedureSessionContextV2 = {
    procedures: [procedure],
    graphFingerprints: {
      [procedure.id]: fingerprint,
    },
  };
  const snapshot: ProcedureSessionSnapshotV2 = {
    version: 2,
    selectedProcedureId: procedure.id,
    configurationSnapshotId: "effective:v1:test",
    completedStepKeys: [],
    graphStates: {
      [procedure.id]: {
        definitionFingerprint: fingerprint,
        activeNodeId: completed.activeNodeId,
        completedNodeIds: completed.completedNodeIds,
        branchSelections: completed.branchSelections,
        completionEmittedAt: timestamp,
      },
    },
  };

  writeProcedureSessionV2(
    storage,
    "graph-acceptance-aircraft",
    undefined,
    "effective:v1:test",
    snapshot,
  );
  const restored = readProcedureSessionV2(
    storage,
    "graph-acceptance-aircraft",
    undefined,
    "effective:v1:test",
    context,
  );

  assert.deepEqual(restored, snapshot);
});

test("M1-E2C publication gate is removed only after graph learner runtime is present", () => {
  const governance = fs.readFileSync(
    new URL("../lib/content-governance.ts", import.meta.url),
    "utf8",
  );
  const pageSource = fs.readFileSync(
    new URL("../app/aircraft/[aircraftId]/procedures/page.tsx", import.meta.url),
    "utf8",
  );
  const browserSource = fs.readFileSync(
    new URL("../components/procedure-browser.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(
    governance,
    /requires the M1-E2 runtime before approval or publication/,
  );
  assert.doesNotMatch(
    governance,
    /containsProcedureGraphPayload\(version\.payload\)/,
  );
  assert.match(pageSource, /AircraftProcedureDefinitionContent/);
  assert.match(pageSource, /fingerprintGraphProcedure/);
  assert.match(pageSource, /key=\{effectiveSnapshotId\}/);
  assert.match(browserSource, /ProcedureGraphRunner/);
  assert.match(browserSource, /readProcedureSessionV2/);
  assert.match(browserSource, /writeProcedureSessionV2/);
});

test("M1-E2C legacy linear procedure remains supported without graph conversion", () => {
  const linear: AircraftProcedure = {
    id: "legacy-linear",
    title: "Legacy linear",
    steps: [{ id: "step", action: "Action" }],
  };
  assert.match(procedureSearchText(linear), /action/);
  assert.deepEqual(
    validateUniversalTrainingContentPayload("procedures", {
      aircraftId: "linear",
      title: "Linear procedures",
      procedures: [linear],
    }),
    [],
  );
});

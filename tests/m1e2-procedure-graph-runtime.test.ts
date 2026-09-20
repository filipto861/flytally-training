import assert from "node:assert/strict";
import test from "node:test";

import {
  effectiveConfigurationSnapshotIdForAircraftVariant,
} from "../lib/aircraft-applicability.ts";
import {
  fingerprintGraphProcedure,
} from "../lib/procedure-definition-fingerprint.ts";
import {
  advanceProcedureGraph,
  createProcedureGraphExecutionState,
  getActiveProcedureGraphNode,
  isProcedureGraphComplete,
  selectProcedureGraphDecision,
} from "../lib/procedure-graph-runtime.ts";
import {
  filterProcedures,
  procedureSearchText,
} from "../lib/procedure-runtime.ts";
import type {
  AircraftGraphProcedure,
} from "../lib/universal-aircraft-content.ts";

const procedure = {
  id: "engine-failure-during-takeoff",
  title: "Engine Failure — During Takeoff",
  phase: "Takeoff",
  graph: {
    version: 1,
    entryNodeId: "v1-decision",
    nodes: [
      {
        id: "v1-decision",
        kind: "decision",
        prompt: "Was the engine failure below or above V1 speed?",
        options: [
          { id: "below", label: "Below V1 speed", targetNodeId: "below-idle" },
          { id: "above", label: "Above V1 speed", targetNodeId: "above-note" },
        ],
      },
      {
        id: "below-idle",
        kind: "action",
        action: "Thrust Levers — IDLE.",
        memoryItem: true,
        nextNodeId: "below-end",
      },
      {
        id: "below-end",
        kind: "end",
      },
      {
        id: "above-note",
        kind: "note",
        text: "Directional Control is improved if the nose wheel is kept on the runway until VR.",
        nextNodeId: "above-action",
      },
      {
        id: "above-action",
        kind: "action",
        action: "Accelerate to VR.",
        memoryItem: true,
        nextNodeId: "above-reference",
      },
      {
        id: "above-reference",
        kind: "reference",
        instruction: "Refer to the applicable engine shutdown procedure.",
        targets: [
          {
            title: "ENGINE SHUTDOWN IN FLIGHT",
            sourceLocationText: "Section IV of the basic AFM",
          },
        ],
        memoryItem: true,
        nextNodeId: "above-end",
      },
      {
        id: "above-end",
        kind: "end",
      },
    ],
  },
} as const satisfies AircraftGraphProcedure;

test("M1-E2A graph runtime starts at the declared entry and cannot implicitly advance a decision", () => {
  const initial = createProcedureGraphExecutionState(procedure.graph);

  assert.equal(
    getActiveProcedureGraphNode(procedure.graph, initial)?.id,
    "v1-decision",
  );

  const attempted = advanceProcedureGraph(procedure.graph, initial);
  assert.equal(attempted.ok, false);
});

test("M1-E2A explicit below-V1 choice follows only the selected branch", () => {
  const initial = createProcedureGraphExecutionState(procedure.graph);
  const selected = selectProcedureGraphDecision(
    procedure.graph,
    initial,
    "below",
  );

  assert.equal(selected.ok, true);
  if (!selected.ok) return;

  assert.equal(selected.value.activeNodeId, "below-idle");
  assert.deepEqual(selected.value.branchSelections, {
    "v1-decision": "below",
  });

  const advanced = advanceProcedureGraph(procedure.graph, selected.value);
  assert.equal(advanced.ok, true);
  if (!advanced.ok) return;

  assert.equal(advanced.value.activeNodeId, "below-end");
  assert.equal(
    isProcedureGraphComplete(procedure.graph, advanced.value),
    true,
  );
  assert.equal(
    advanced.value.completedNodeIds.includes("above-action"),
    false,
  );
});

test("M1-E2A explicit above-V1 choice traverses note, action and reference before END", () => {
  let result = selectProcedureGraphDecision(
    procedure.graph,
    createProcedureGraphExecutionState(procedure.graph),
    "above",
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.value.activeNodeId, "above-note");

  for (const expected of [
    "above-action",
    "above-reference",
    "above-end",
  ]) {
    const next = advanceProcedureGraph(procedure.graph, result.value);
    assert.equal(next.ok, true);
    if (!next.ok) return;

    result = next;
    assert.equal(result.value.activeNodeId, expected);
  }

  assert.equal(
    isProcedureGraphComplete(procedure.graph, result.value),
    true,
  );
});

test("M1-E2A invalid decision option fails closed", () => {
  const result = selectProcedureGraphDecision(
    procedure.graph,
    createProcedureGraphExecutionState(procedure.graph),
    "non-existent-option",
  );

  assert.equal(result.ok, false);
});

test("M1-E2A graph definition fingerprint is deterministic and changes with execution-relevant content", () => {
  const first = fingerprintGraphProcedure(procedure);
  const second = fingerprintGraphProcedure(procedure);

  assert.equal(first, second);
  assert.match(first, /^procedure:v1:[a-f0-9]{64}$/);

  const changed: AircraftGraphProcedure = {
    ...procedure,
    graph: {
      ...procedure.graph,
      nodes: procedure.graph.nodes.map((node) =>
        node.id === "above-action" && node.kind === "action"
          ? { ...node, action: "Changed action text" }
          : node,
      ),
    },
  };

  assert.notEqual(
    fingerprintGraphProcedure(changed),
    first,
  );
});

test("M1-E2A graph definition fingerprint is independent of object key insertion order", () => {
  const reordered: AircraftGraphProcedure = {
    title: procedure.title,
    id: procedure.id,
    phase: procedure.phase,
    graph: {
      nodes: procedure.graph.nodes,
      entryNodeId: procedure.graph.entryNodeId,
      version: 1,
    },
  };

  assert.equal(
    fingerprintGraphProcedure(reordered),
    fingerprintGraphProcedure(procedure),
  );
});

test("M1-E2A graph search indexes every branch as discovery content", () => {
  const searchText = procedureSearchText(procedure);

  assert.match(searchText, /below v1/);
  assert.match(searchText, /directional control/);
  assert.match(searchText, /accelerate to vr/);
  assert.match(searchText, /engine shutdown in flight/);

  assert.deepEqual(
    filterProcedures([procedure], { query: "directional control" })
      .map((item) => item.id),
    ["engine-failure-during-takeoff"],
  );
});

test("M1-E2A common configuration snapshot is deterministic and changes with common aircraft equipment", () => {
  const base = {
    id: "aircraft",
    variants: [],
    variantProfiles: [],
    equipmentTags: ["standard-equipment"],
  };

  const first = effectiveConfigurationSnapshotIdForAircraftVariant(
    base,
    undefined,
  );
  const second = effectiveConfigurationSnapshotIdForAircraftVariant(
    base,
    undefined,
  );

  assert.equal(first, second);
  assert.match(first, /^effective:v1:/);

  const reordered = effectiveConfigurationSnapshotIdForAircraftVariant(
    {
      ...base,
      equipmentTags: ["standard-equipment"],
    },
    undefined,
  );
  assert.equal(reordered, first);

  const changed = effectiveConfigurationSnapshotIdForAircraftVariant(
    {
      ...base,
      equipmentTags: ["standard-equipment", "added-equipment"],
    },
    undefined,
  );

  assert.notEqual(changed, first);
});

test("M1-E2A explicit variant snapshot uses the existing effective configuration resolver and fails closed for unknown variants", () => {
  const aircraft = {
    id: "aircraft",
    variants: ["configured"],
    variantProfiles: [{
      key: "configured",
      displayName: "Configured",
      equipmentTags: ["variant-equipment"],
      configuration: {
        baseVariant: "base-model",
        modifications: [{ key: "mod-a", state: "installed" as const }],
      },
    }],
    equipmentTags: ["common-equipment"],
  };

  const snapshot = effectiveConfigurationSnapshotIdForAircraftVariant(
    aircraft,
    "configured",
  );
  assert.match(snapshot, /^effective:v1:/);

  assert.throws(
    () => effectiveConfigurationSnapshotIdForAircraftVariant(
      aircraft,
      "missing",
    ),
    /unknown variant "missing"/i,
  );
});

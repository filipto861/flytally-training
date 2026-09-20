import assert from "node:assert/strict";
import test from "node:test";

import {
  createFreshProcedureSessionSnapshotV2,
  migrateProcedureSessionV1ToV2,
  normalizeProcedureSessionSnapshotV2,
  procedureSessionStorageKey,
  procedureSessionStorageKeyV2,
  readProcedureSessionV2,
  writeProcedureSessionV2,
  type ProcedureSessionContextV2,
  type ProcedureSessionSnapshotV2,
  type ProcedureSessionStorage,
} from "../lib/procedure-session.ts";
import type {
  AircraftGraphProcedure,
  AircraftProcedure,
  AircraftProcedureDefinition,
} from "../lib/universal-aircraft-content.ts";

const linear: AircraftProcedure = {
  id: "linear",
  title: "Linear procedure",
  steps: [
    { id: "one", action: "Step one" },
    { id: "two", action: "Step two" },
  ],
};

const graphA: AircraftGraphProcedure = {
  id: "graph-a",
  title: "Graph A",
  graph: {
    version: 1,
    entryNodeId: "decision",
    nodes: [
      {
        id: "decision",
        kind: "decision",
        prompt: "Choose a branch",
        options: [
          { id: "left", label: "Left", targetNodeId: "left-action" },
          { id: "right", label: "Right", targetNodeId: "right-action" },
        ],
      },
      {
        id: "left-action",
        kind: "action",
        action: "Left action",
        nextNodeId: "end",
      },
      {
        id: "right-action",
        kind: "action",
        action: "Right action",
        nextNodeId: "end",
      },
      { id: "end", kind: "end" },
    ],
  },
};

const graphB: AircraftGraphProcedure = {
  id: "graph-b",
  title: "Graph B",
  graph: {
    version: 1,
    entryNodeId: "action",
    nodes: [
      {
        id: "action",
        kind: "action",
        action: "Action",
        nextNodeId: "end",
      },
      { id: "end", kind: "end" },
    ],
  },
};

const procedures: readonly AircraftProcedureDefinition[] = [
  linear,
  graphA,
  graphB,
];

const context: ProcedureSessionContextV2 = {
  procedures,
  graphFingerprints: {
    "graph-a": "procedure:v1:fingerprint-a",
    "graph-b": "procedure:v1:fingerprint-b",
  },
};

function memoryStorage(
  initial: Readonly<Record<string, string>> = {},
): ProcedureSessionStorage & {
  readonly values: Map<string, string>;
} {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

function validGraphStates(): ProcedureSessionSnapshotV2["graphStates"] {
  return {
    "graph-a": {
      definitionFingerprint: "procedure:v1:fingerprint-a",
      activeNodeId: "left-action",
      completedNodeIds: ["decision"],
      branchSelections: { decision: "left" },
    },
    "graph-b": {
      definitionFingerprint: "procedure:v1:fingerprint-b",
      activeNodeId: "end",
      completedNodeIds: ["action"],
      branchSelections: {},
    },
  };
}

function validSnapshot(
  configurationSnapshotId = "effective:v1:snapshot-a",
): ProcedureSessionSnapshotV2 {
  return {
    version: 2,
    selectedProcedureId: "graph-a",
    configurationSnapshotId,
    completedStepKeys: ["linear:one"],
    graphStates: validGraphStates(),
  };
}

test("M1-E2B v2 storage identity includes the effective configuration snapshot", () => {
  assert.notEqual(
    procedureSessionStorageKeyV2("aircraft", "variant", "snapshot-a"),
    procedureSessionStorageKeyV2("aircraft", "variant", "snapshot-b"),
  );
});

test("M1-E2B valid v2 state restores and reconciles current content identities", () => {
  const snapshot = normalizeProcedureSessionSnapshotV2(
    {
      ...validSnapshot(),
      completedStepKeys: ["linear:one", "linear:removed", "linear:one"],
    },
    "effective:v1:snapshot-a",
    context,
  );

  assert.equal(snapshot.selectedProcedureId, "graph-a");
  assert.deepEqual(snapshot.completedStepKeys, ["linear:one"]);
  assert.deepEqual(snapshot.graphStates, validGraphStates());
});

test("M1-E2B unknown version and configuration mismatch both fail closed to fresh state", () => {
  const unknownVersion = normalizeProcedureSessionSnapshotV2(
    {
      ...validSnapshot(),
      version: 99,
    },
    "effective:v1:snapshot-a",
    context,
  );

  const wrongConfiguration = normalizeProcedureSessionSnapshotV2(
    validSnapshot("effective:v1:old-snapshot"),
    "effective:v1:snapshot-a",
    context,
  );

  const fresh = createFreshProcedureSessionSnapshotV2(
    "effective:v1:snapshot-a",
    procedures,
  );

  assert.deepEqual(unknownVersion, fresh);
  assert.deepEqual(wrongConfiguration, fresh);
});

test("M1-E2B v1 migration preserves only valid linear progress and starts graph state empty", () => {
  const migrated = migrateProcedureSessionV1ToV2(
    {
      version: 1,
      selectedProcedureId: "linear",
      completedStepKeys: [
        "linear:one",
        "linear:removed",
        "linear:one",
        "graph-a:decision",
      ],
    },
    "effective:v1:snapshot-a",
    context,
  );

  assert.deepEqual(migrated, {
    version: 2,
    selectedProcedureId: "linear",
    configurationSnapshotId: "effective:v1:snapshot-a",
    completedStepKeys: ["linear:one"],
    graphStates: {},
  });
});

test("M1-E2B v1 migration rejects unknown versions", () => {
  assert.equal(
    migrateProcedureSessionV1ToV2(
      {
        version: 99,
        selectedProcedureId: "linear",
        completedStepKeys: ["linear:one"],
      },
      "effective:v1:snapshot-a",
      context,
    ),
    undefined,
  );
});

test("M1-E2B successful v1 fallback migration writes v2 and removes the single-use legacy key", () => {
  const legacyKey = procedureSessionStorageKey("aircraft", "variant");
  const storage = memoryStorage({
    [legacyKey]: JSON.stringify({
      version: 1,
      selectedProcedureId: "linear",
      completedStepKeys: ["linear:one", "linear:removed"],
    }),
  });

  const migrated = readProcedureSessionV2(
    storage,
    "aircraft",
    "variant",
    "effective:v1:snapshot-a",
    context,
  );

  const newKey = procedureSessionStorageKeyV2(
    "aircraft",
    "variant",
    "effective:v1:snapshot-a",
  );

  assert.deepEqual(migrated.completedStepKeys, ["linear:one"]);
  assert.equal(storage.getItem(legacyKey), null);
  assert.equal(storage.getItem(newKey), JSON.stringify(migrated));
});

test("M1-E2B invalid legacy JSON and legacy future version fail closed and consume the legacy key", () => {
  for (const legacyValue of [
    "{not-json",
    JSON.stringify({
      version: 99,
      selectedProcedureId: "linear",
      completedStepKeys: ["linear:one"],
    }),
  ]) {
    const legacyKey = procedureSessionStorageKey("aircraft", "variant");
    const storage = memoryStorage({ [legacyKey]: legacyValue });

    const restored = readProcedureSessionV2(
      storage,
      "aircraft",
      "variant",
      "effective:v1:snapshot-a",
      context,
    );

    assert.deepEqual(
      restored,
      createFreshProcedureSessionSnapshotV2(
        "effective:v1:snapshot-a",
        procedures,
      ),
    );
    assert.equal(storage.getItem(legacyKey), null);
  }
});

test("M1-E2B an existing invalid v2 key is authoritative and never resurrects legacy progress", () => {
  const newKey = procedureSessionStorageKeyV2(
    "aircraft",
    "variant",
    "effective:v1:snapshot-a",
  );
  const legacyKey = procedureSessionStorageKey("aircraft", "variant");
  const storage = memoryStorage({
    [newKey]: JSON.stringify({
      version: 99,
      selectedProcedureId: "linear",
      completedStepKeys: ["linear:one"],
    }),
    [legacyKey]: JSON.stringify({
      version: 1,
      selectedProcedureId: "linear",
      completedStepKeys: ["linear:one"],
    }),
  });

  const restored = readProcedureSessionV2(
    storage,
    "aircraft",
    "variant",
    "effective:v1:snapshot-a",
    context,
  );

  assert.deepEqual(
    restored,
    createFreshProcedureSessionSnapshotV2(
      "effective:v1:snapshot-a",
      procedures,
    ),
  );
  assert.notEqual(storage.getItem(legacyKey), null);
  assert.equal(storage.getItem(newKey), JSON.stringify(restored));
});

test("M1-E2B migrated legacy progress cannot be resurrected into a later configuration snapshot", () => {
  const legacyKey = procedureSessionStorageKey("aircraft", "variant");
  const storage = memoryStorage({
    [legacyKey]: JSON.stringify({
      version: 1,
      selectedProcedureId: "linear",
      completedStepKeys: ["linear:one"],
    }),
  });

  const first = readProcedureSessionV2(
    storage,
    "aircraft",
    "variant",
    "effective:v1:snapshot-a",
    context,
  );
  assert.deepEqual(first.completedStepKeys, ["linear:one"]);
  assert.equal(storage.getItem(legacyKey), null);

  const second = readProcedureSessionV2(
    storage,
    "aircraft",
    "variant",
    "effective:v1:snapshot-b",
    context,
  );
  assert.deepEqual(second.completedStepKeys, []);
  assert.deepEqual(second.graphStates, {});
});

test("M1-E2B graph fingerprint mismatch resets only the affected graph procedure", () => {
  const restored = normalizeProcedureSessionSnapshotV2(
    {
      ...validSnapshot(),
      graphStates: {
        ...validGraphStates(),
        "graph-a": {
          ...validGraphStates()["graph-a"],
          definitionFingerprint: "procedure:v1:old-definition",
        },
      },
    },
    "effective:v1:snapshot-a",
    context,
  );

  assert.deepEqual(restored.completedStepKeys, ["linear:one"]);
  assert.equal(restored.graphStates["graph-a"], undefined);
  assert.deepEqual(restored.graphStates["graph-b"], validGraphStates()["graph-b"]);
});

test("M1-E2B stale active/completed node or stale decision/option resets only that graph procedure", () => {
  const invalidGraphAStates = [
    {
      ...validGraphStates()["graph-a"],
      activeNodeId: "removed-node",
    },
    {
      ...validGraphStates()["graph-a"],
      completedNodeIds: ["removed-node"],
    },
    {
      ...validGraphStates()["graph-a"],
      branchSelections: { "removed-decision": "left" },
    },
    {
      ...validGraphStates()["graph-a"],
      branchSelections: { decision: "removed-option" },
    },
  ];

  for (const graphAState of invalidGraphAStates) {
    const restored = normalizeProcedureSessionSnapshotV2(
      {
        ...validSnapshot(),
        graphStates: {
          ...validGraphStates(),
          "graph-a": graphAState,
        },
      },
      "effective:v1:snapshot-a",
      context,
    );

    assert.deepEqual(restored.completedStepKeys, ["linear:one"]);
    assert.equal(restored.graphStates["graph-a"], undefined);
    assert.deepEqual(restored.graphStates["graph-b"], validGraphStates()["graph-b"]);
  }
});

test("M1-E2B write persists matching v2 state and rejects the wrong configuration snapshot", () => {
  const storage = memoryStorage();
  const snapshot = validSnapshot();

  writeProcedureSessionV2(
    storage,
    "aircraft",
    "variant",
    "effective:v1:snapshot-a",
    snapshot,
  );

  const key = procedureSessionStorageKeyV2(
    "aircraft",
    "variant",
    "effective:v1:snapshot-a",
  );
  assert.equal(storage.getItem(key), JSON.stringify(snapshot));

  assert.throws(
    () => writeProcedureSessionV2(
      storage,
      "aircraft",
      "variant",
      "effective:v1:snapshot-b",
      snapshot,
    ),
    /does not match the active configuration/i,
  );
});

import type {
  AircraftGraphProcedure,
  AircraftProcedure,
  AircraftProcedureDefinition,
} from "./universal-aircraft-content.ts";

export type ProcedureSessionSnapshot = {
  readonly version: 1;
  readonly selectedProcedureId: string;
  readonly completedStepKeys: readonly string[];
};

export type ProcedureGraphSessionStateV2 = {
  readonly definitionFingerprint: string;
  readonly activeNodeId: string;
  readonly completedNodeIds: readonly string[];
  readonly branchSelections: Readonly<Record<string, string>>;
};

export type ProcedureSessionSnapshotV2 = {
  readonly version: 2;
  readonly selectedProcedureId: string;
  readonly configurationSnapshotId: string;
  readonly completedStepKeys: readonly string[];
  readonly graphStates: Readonly<Record<string, ProcedureGraphSessionStateV2>>;
};

export type ProcedureSessionContextV2 = {
  readonly procedures: readonly AircraftProcedureDefinition[];
  readonly graphFingerprints: Readonly<Record<string, string>>;
};

export type ProcedureSessionStorage = {
  readonly getItem: (key: string) => string | null;
  readonly setItem: (key: string, value: string) => void;
  readonly removeItem: (key: string) => void;
};

export type ProcedureProgress = {
  readonly procedureId: string;
  readonly completedSteps: number;
  readonly totalSteps: number;
  readonly complete: boolean;
};

export function procedureStepKey(procedureId: string, stepId: string): string {
  return `${procedureId}:${stepId}`;
}

export function procedureSessionStorageKey(aircraftId: string, selectedVariant?: string): string {
  return `flytally-training-procedure-session:${encodeURIComponent(aircraftId)}:${encodeURIComponent(selectedVariant ?? "common")}`;
}

export function procedureSessionStorageKeyV2(
  aircraftId: string,
  selectedVariant: string | undefined,
  effectiveSnapshotId: string,
): string {
  return [
    "flytally-training-procedure-session-v2",
    encodeURIComponent(aircraftId),
    encodeURIComponent(selectedVariant ?? "common"),
    encodeURIComponent(effectiveSnapshotId),
  ].join(":");
}

function knownStepKeys(procedures: readonly AircraftProcedure[]): ReadonlySet<string> {
  return new Set(
    procedures.flatMap((procedure) =>
      procedure.steps.map((step) => procedureStepKey(procedure.id, step.id))),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function linearProcedures(
  procedures: readonly AircraftProcedureDefinition[],
): readonly AircraftProcedure[] {
  return procedures.filter(
    (procedure): procedure is AircraftProcedure => procedure.graph === undefined,
  );
}

function graphProcedures(
  procedures: readonly AircraftProcedureDefinition[],
): readonly AircraftGraphProcedure[] {
  return procedures.filter(
    (procedure): procedure is AircraftGraphProcedure => procedure.graph !== undefined,
  );
}

export function normalizeProcedureSessionSnapshot(
  value: unknown,
  procedures: readonly AircraftProcedure[],
): ProcedureSessionSnapshot {
  const procedureIds = new Set(procedures.map((procedure) => procedure.id));
  const stepKeys = knownStepKeys(procedures);
  const fallbackProcedureId = procedures[0]?.id ?? "";

  if (!isRecord(value) || value.version !== 1) {
    return { version: 1, selectedProcedureId: fallbackProcedureId, completedStepKeys: [] };
  }

  const selectedProcedureId = typeof value.selectedProcedureId === "string" && procedureIds.has(value.selectedProcedureId)
    ? value.selectedProcedureId
    : fallbackProcedureId;
  const completedStepKeys = Array.isArray(value.completedStepKeys)
    ? [...new Set(value.completedStepKeys.filter(
        (key): key is string => typeof key === "string" && stepKeys.has(key),
      ))]
    : [];

  return { version: 1, selectedProcedureId, completedStepKeys };
}

export function createFreshProcedureSessionSnapshotV2(
  effectiveSnapshotId: string,
  procedures: readonly AircraftProcedureDefinition[],
): ProcedureSessionSnapshotV2 {
  return {
    version: 2,
    selectedProcedureId: procedures[0]?.id ?? "",
    configurationSnapshotId: effectiveSnapshotId,
    completedStepKeys: [],
    graphStates: {},
  };
}

function normalizeGraphStateV2(
  value: unknown,
  procedure: AircraftGraphProcedure,
  expectedFingerprint: string | undefined,
): ProcedureGraphSessionStateV2 | undefined {
  if (!expectedFingerprint || !isRecord(value)) return undefined;
  if (value.definitionFingerprint !== expectedFingerprint) return undefined;
  if (typeof value.activeNodeId !== "string") return undefined;
  if (!Array.isArray(value.completedNodeIds)) return undefined;
  if (!isRecord(value.branchSelections)) return undefined;

  const nodes = new Map(
    procedure.graph.nodes.map((node) => [node.id, node] as const),
  );
  if (!nodes.has(value.activeNodeId)) return undefined;

  const completedNodeIds: string[] = [];
  for (const nodeId of value.completedNodeIds) {
    if (typeof nodeId !== "string" || !nodes.has(nodeId)) return undefined;
    if (!completedNodeIds.includes(nodeId)) completedNodeIds.push(nodeId);
  }

  const branchSelectionEntries: Array<readonly [string, string]> = [];
  for (const [decisionId, optionId] of Object.entries(value.branchSelections)) {
    if (typeof optionId !== "string") return undefined;

    const decision = nodes.get(decisionId);
    if (!decision || decision.kind !== "decision") return undefined;
    if (!decision.options.some((option) => option.id === optionId)) return undefined;

    branchSelectionEntries.push([decisionId, optionId]);
  }

  return {
    definitionFingerprint: expectedFingerprint,
    activeNodeId: value.activeNodeId,
    completedNodeIds,
    branchSelections: Object.fromEntries(branchSelectionEntries),
  };
}

export function normalizeProcedureSessionSnapshotV2(
  value: unknown,
  effectiveSnapshotId: string,
  context: ProcedureSessionContextV2,
): ProcedureSessionSnapshotV2 {
  const fresh = createFreshProcedureSessionSnapshotV2(
    effectiveSnapshotId,
    context.procedures,
  );

  if (
    !isRecord(value) ||
    value.version !== 2 ||
    value.configurationSnapshotId !== effectiveSnapshotId
  ) {
    return fresh;
  }

  const procedureIds = new Set(context.procedures.map((procedure) => procedure.id));
  const selectedProcedureId =
    typeof value.selectedProcedureId === "string" && procedureIds.has(value.selectedProcedureId)
      ? value.selectedProcedureId
      : fresh.selectedProcedureId;

  const validLinearStepKeys = knownStepKeys(linearProcedures(context.procedures));
  const completedStepKeys = Array.isArray(value.completedStepKeys)
    ? [...new Set(value.completedStepKeys.filter(
        (key): key is string =>
          typeof key === "string" && validLinearStepKeys.has(key),
      ))]
    : [];

  const rawGraphStates = isRecord(value.graphStates) ? value.graphStates : {};
  const graphStates: Record<string, ProcedureGraphSessionStateV2> = {};

  for (const procedure of graphProcedures(context.procedures)) {
    const normalized = normalizeGraphStateV2(
      rawGraphStates[procedure.id],
      procedure,
      context.graphFingerprints[procedure.id],
    );
    if (normalized) graphStates[procedure.id] = normalized;
  }

  return {
    version: 2,
    selectedProcedureId,
    configurationSnapshotId: effectiveSnapshotId,
    completedStepKeys,
    graphStates,
  };
}

export function migrateProcedureSessionV1ToV2(
  value: unknown,
  effectiveSnapshotId: string,
  context: ProcedureSessionContextV2,
): ProcedureSessionSnapshotV2 | undefined {
  if (!isRecord(value) || value.version !== 1) return undefined;

  const fresh = createFreshProcedureSessionSnapshotV2(
    effectiveSnapshotId,
    context.procedures,
  );
  const procedureIds = new Set(context.procedures.map((procedure) => procedure.id));
  const selectedProcedureId =
    typeof value.selectedProcedureId === "string" && procedureIds.has(value.selectedProcedureId)
      ? value.selectedProcedureId
      : fresh.selectedProcedureId;

  const validLinearStepKeys = knownStepKeys(linearProcedures(context.procedures));
  const completedStepKeys = Array.isArray(value.completedStepKeys)
    ? [...new Set(value.completedStepKeys.filter(
        (key): key is string =>
          typeof key === "string" && validLinearStepKeys.has(key),
      ))]
    : [];

  return {
    version: 2,
    selectedProcedureId,
    configurationSnapshotId: effectiveSnapshotId,
    completedStepKeys,
    graphStates: {},
  };
}

function parseStoredJson(raw: string): unknown | undefined {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function readProcedureSessionV2(
  storage: ProcedureSessionStorage,
  aircraftId: string,
  selectedVariant: string | undefined,
  effectiveSnapshotId: string,
  context: ProcedureSessionContextV2,
): ProcedureSessionSnapshotV2 {
  const newKey = procedureSessionStorageKeyV2(
    aircraftId,
    selectedVariant,
    effectiveSnapshotId,
  );
  const currentRaw = storage.getItem(newKey);

  if (currentRaw !== null) {
    const normalized = normalizeProcedureSessionSnapshotV2(
      parseStoredJson(currentRaw),
      effectiveSnapshotId,
      context,
    );
    storage.setItem(newKey, JSON.stringify(normalized));
    return normalized;
  }

  const legacyKey = procedureSessionStorageKey(aircraftId, selectedVariant);
  const legacyRaw = storage.getItem(legacyKey);

  if (legacyRaw === null) {
    return createFreshProcedureSessionSnapshotV2(
      effectiveSnapshotId,
      context.procedures,
    );
  }

  const migrated = migrateProcedureSessionV1ToV2(
    parseStoredJson(legacyRaw),
    effectiveSnapshotId,
    context,
  );

  // The legacy key is single-use. Removing it also prevents a later technical
  // configuration snapshot from resurrecting progress that belonged to the
  // previous aircraft configuration.
  storage.removeItem(legacyKey);

  if (!migrated) {
    return createFreshProcedureSessionSnapshotV2(
      effectiveSnapshotId,
      context.procedures,
    );
  }

  storage.setItem(newKey, JSON.stringify(migrated));
  return migrated;
}

export function writeProcedureSessionV2(
  storage: ProcedureSessionStorage,
  aircraftId: string,
  selectedVariant: string | undefined,
  effectiveSnapshotId: string,
  snapshot: ProcedureSessionSnapshotV2,
): void {
  if (
    snapshot.version !== 2 ||
    snapshot.configurationSnapshotId !== effectiveSnapshotId
  ) {
    throw new Error(
      "Procedure session snapshot does not match the active configuration.",
    );
  }

  storage.setItem(
    procedureSessionStorageKeyV2(
      aircraftId,
      selectedVariant,
      effectiveSnapshotId,
    ),
    JSON.stringify(snapshot),
  );
}

export function procedureProgress(
  procedures: readonly AircraftProcedure[],
  completedStepKeys: ReadonlySet<string>,
): readonly ProcedureProgress[] {
  return procedures.map((procedure) => {
    const completedSteps = procedure.steps.filter((step) =>
      completedStepKeys.has(procedureStepKey(procedure.id, step.id))).length;
    return {
      procedureId: procedure.id,
      completedSteps,
      totalSteps: procedure.steps.length,
      complete: procedure.steps.length > 0 && completedSteps === procedure.steps.length,
    };
  });
}

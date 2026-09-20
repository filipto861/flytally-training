import type {
  AircraftProcedureGraph,
  ProcedureDecisionNode,
  ProcedureNode,
} from "./universal-aircraft-content.ts";

export type ProcedureGraphExecutionState = {
  readonly activeNodeId: string;
  readonly completedNodeIds: readonly string[];
  readonly branchSelections: Readonly<Record<string, string>>;
};

export type ProcedureGraphRuntimeResult<T> =
  | {
      readonly ok: true;
      readonly value: T;
    }
  | {
      readonly ok: false;
      readonly error: string;
    };

function ok<T>(value: T): ProcedureGraphRuntimeResult<T> {
  return { ok: true, value };
}

function fail<T>(error: string): ProcedureGraphRuntimeResult<T> {
  return { ok: false, error };
}

function nodeById(
  graph: AircraftProcedureGraph,
  nodeId: string,
): ProcedureNode | undefined {
  return graph.nodes.find((node) => node.id === nodeId);
}

function withCompletedNode(
  state: ProcedureGraphExecutionState,
  nodeId: string,
): readonly string[] {
  return state.completedNodeIds.includes(nodeId)
    ? state.completedNodeIds
    : [...state.completedNodeIds, nodeId];
}

export function createProcedureGraphExecutionState(
  graph: AircraftProcedureGraph,
): ProcedureGraphExecutionState {
  return {
    activeNodeId: graph.entryNodeId,
    completedNodeIds: [],
    branchSelections: {},
  };
}

export function getActiveProcedureGraphNode(
  graph: AircraftProcedureGraph,
  state: ProcedureGraphExecutionState,
): ProcedureNode | undefined {
  return nodeById(graph, state.activeNodeId);
}

export function isProcedureGraphComplete(
  graph: AircraftProcedureGraph,
  state: ProcedureGraphExecutionState,
): boolean {
  return getActiveProcedureGraphNode(graph, state)?.kind === "end";
}

export function advanceProcedureGraph(
  graph: AircraftProcedureGraph,
  state: ProcedureGraphExecutionState,
): ProcedureGraphRuntimeResult<ProcedureGraphExecutionState> {
  const active = getActiveProcedureGraphNode(graph, state);

  if (!active) {
    return fail(`Active procedure node "${state.activeNodeId}" does not exist.`);
  }

  if (active.kind === "decision") {
    return fail(`Decision node "${active.id}" requires an explicit option selection.`);
  }

  if (active.kind === "end") {
    return fail(`Procedure graph is already complete at end node "${active.id}".`);
  }

  const target = nodeById(graph, active.nextNodeId);
  if (!target) {
    return fail(`Node "${active.id}" references missing target "${active.nextNodeId}".`);
  }

  return ok({
    ...state,
    activeNodeId: target.id,
    completedNodeIds: withCompletedNode(state, active.id),
  });
}

export function selectProcedureGraphDecision(
  graph: AircraftProcedureGraph,
  state: ProcedureGraphExecutionState,
  optionId: string,
): ProcedureGraphRuntimeResult<ProcedureGraphExecutionState> {
  const active = getActiveProcedureGraphNode(graph, state);

  if (!active) {
    return fail(`Active procedure node "${state.activeNodeId}" does not exist.`);
  }

  if (active.kind !== "decision") {
    return fail(`Node "${active.id}" is not a decision node.`);
  }

  return applyDecisionOption(graph, state, active, optionId);
}

function applyDecisionOption(
  graph: AircraftProcedureGraph,
  state: ProcedureGraphExecutionState,
  decision: ProcedureDecisionNode,
  optionId: string,
): ProcedureGraphRuntimeResult<ProcedureGraphExecutionState> {
  const option = decision.options.find((candidate) => candidate.id === optionId);
  if (!option) {
    return fail(`Decision node "${decision.id}" does not contain option "${optionId}".`);
  }

  const target = nodeById(graph, option.targetNodeId);
  if (!target) {
    return fail(
      `Decision option "${decision.id}:${option.id}" references missing target "${option.targetNodeId}".`,
    );
  }

  return ok({
    activeNodeId: target.id,
    completedNodeIds: withCompletedNode(state, decision.id),
    branchSelections: {
      ...state.branchSelections,
      [decision.id]: option.id,
    },
  });
}

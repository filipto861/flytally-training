import type { AircraftProcedureGraph } from "./universal-aircraft-content.ts";

type JsonRecord = Record<string, unknown>;

export type ProcedureGraphValidationResult = {
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
};

const nodeKinds = ["action", "decision", "note", "reference", "end"] as const;
type ProcedureNodeKind = typeof nodeKinds[number];

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateUnknownKeys(
  value: JsonRecord,
  allowed: ReadonlySet<string>,
  path: string,
  errors: string[],
): void {
  for (const key of Object.keys(value).sort()) {
    if (!allowed.has(key)) errors.push(`${path} contains unsupported field "${key}".`);
  }
}

function validateSources(value: unknown, path: string, errors: string[]): void {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must be a non-empty source array when supplied.`);
    return;
  }

  value.forEach((source, index) => {
    const sourcePath = `${path}[${index}]`;
    if (!isRecord(source)) {
      errors.push(`${sourcePath} must be a source object.`);
      return;
    }
    validateUnknownKeys(
      source,
      new Set(["manualId", "chapter", "section", "pageLabel", "note"]),
      sourcePath,
      errors,
    );
    if (!text(source.manualId)) errors.push(`${sourcePath}.manualId is required.`);
    if (!text(source.pageLabel)) errors.push(`${sourcePath}.pageLabel is required.`);
    for (const key of ["chapter", "section", "note"] as const) {
      if (source[key] !== undefined && !text(source[key])) {
        errors.push(`${sourcePath}.${key} must be non-empty text when supplied.`);
      }
    }
  });
}

function validateNotices(value: unknown, path: string, errors: string[]): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array when supplied.`);
    return;
  }

  value.forEach((notice, index) => {
    const noticePath = `${path}[${index}]`;
    if (!isRecord(notice)) {
      errors.push(`${noticePath} must be a notice object.`);
      return;
    }
    validateUnknownKeys(notice, new Set(["kind", "text"]), noticePath, errors);
    if (notice.kind !== "note" && notice.kind !== "caution" && notice.kind !== "warning") {
      errors.push(`${noticePath}.kind must be note, caution, or warning.`);
    }
    if (!text(notice.text)) errors.push(`${noticePath}.text is required.`);
  });
}

function validateExecutableMetadata(node: JsonRecord, path: string, errors: string[]): void {
  if (node.memoryItem !== undefined && typeof node.memoryItem !== "boolean") {
    errors.push(`${path}.memoryItem must be boolean when supplied.`);
  }
  if (node.crewRole !== undefined && !text(node.crewRole)) {
    errors.push(`${path}.crewRole must be non-empty text when supplied.`);
  }
}

function nodeKind(value: unknown): ProcedureNodeKind | undefined {
  return typeof value === "string" && (nodeKinds as readonly string[]).includes(value)
    ? value as ProcedureNodeKind
    : undefined;
}

function nodeTargets(node: JsonRecord): readonly string[] {
  const kind = nodeKind(node.kind);
  if (kind === "action" || kind === "note" || kind === "reference") {
    return text(node.nextNodeId) ? [node.nextNodeId] : [];
  }
  if (kind === "decision" && Array.isArray(node.options)) {
    return node.options.flatMap((option) =>
      isRecord(option) && text(option.targetNodeId) ? [option.targetNodeId] : [],
    );
  }
  return [];
}

function validateNodeShape(node: unknown, index: number, errors: string[]): JsonRecord | undefined {
  const path = `nodes[${index}]`;
  if (!isRecord(node)) {
    errors.push(`${path} must be a node object.`);
    return undefined;
  }

  if (node.applicability !== undefined) {
    errors.push(
      `${path}.applicability is not supported by the current procedure runtime; scope applicability at procedure level instead.`,
    );
  }

  if (!text(node.id)) errors.push(`${path}.id is required.`);
  const kind = nodeKind(node.kind);
  if (!kind) {
    errors.push(`${path}.kind must be action, decision, note, reference, or end.`);
    validateUnknownKeys(node, new Set(["id", "kind", "sources", "applicability"]), path, errors);
    validateSources(node.sources, `${path}.sources`, errors);
    return node;
  }

  const common = ["id", "kind", "sources", "applicability"];
  if (kind === "action") {
    validateUnknownKeys(
      node,
      new Set([...common, "action", "expectedResult", "verification", "rationale", "notices", "conditionText", "nextNodeId", "memoryItem", "crewRole"]),
      path,
      errors,
    );
    if (!text(node.action)) errors.push(`${path}.action is required.`);
    if (!text(node.nextNodeId)) errors.push(`${path}.nextNodeId is required.`);
    for (const key of ["expectedResult", "verification", "rationale", "conditionText"] as const) {
      if (node[key] !== undefined && !text(node[key])) {
        errors.push(`${path}.${key} must be non-empty text when supplied.`);
      }
    }
    validateExecutableMetadata(node, path, errors);
    validateNotices(node.notices, `${path}.notices`, errors);
  } else if (kind === "decision") {
    validateUnknownKeys(node, new Set([...common, "prompt", "options"]), path, errors);
    if (!text(node.prompt)) errors.push(`${path}.prompt is required.`);
    if (!Array.isArray(node.options) || node.options.length < 2) {
      errors.push(`${path}.options must contain at least two explicit user choices.`);
    } else {
      const optionIds = new Set<string>();
      node.options.forEach((option, optionIndex) => {
        const optionPath = `${path}.options[${optionIndex}]`;
        if (!isRecord(option)) {
          errors.push(`${optionPath} must be an option object.`);
          return;
        }
        validateUnknownKeys(option, new Set(["id", "label", "targetNodeId"]), optionPath, errors);
        if (!text(option.id)) errors.push(`${optionPath}.id is required.`);
        else if (optionIds.has(option.id)) errors.push(`${path}.options contains duplicate id "${option.id}".`);
        else optionIds.add(option.id);
        if (!text(option.label)) errors.push(`${optionPath}.label is required.`);
        if (!text(option.targetNodeId)) errors.push(`${optionPath}.targetNodeId is required.`);
      });
    }
  } else if (kind === "note") {
    validateUnknownKeys(node, new Set([...common, "text", "nextNodeId"]), path, errors);
    if (!text(node.text)) errors.push(`${path}.text is required.`);
    if (!text(node.nextNodeId)) errors.push(`${path}.nextNodeId is required.`);
  } else if (kind === "reference") {
    validateUnknownKeys(
      node,
      new Set([...common, "instruction", "targets", "nextNodeId", "memoryItem", "crewRole"]),
      path,
      errors,
    );
    if (!text(node.instruction)) errors.push(`${path}.instruction is required.`);
    if (!text(node.nextNodeId)) errors.push(`${path}.nextNodeId is required.`);
    validateExecutableMetadata(node, path, errors);
    if (!Array.isArray(node.targets) || node.targets.length === 0) {
      errors.push(`${path}.targets must contain at least one procedure reference.`);
    } else {
      node.targets.forEach((target, targetIndex) => {
        const targetPath = `${path}.targets[${targetIndex}]`;
        if (!isRecord(target)) {
          errors.push(`${targetPath} must be a reference target object.`);
          return;
        }
        validateUnknownKeys(target, new Set(["title", "procedureId", "sourceLocationText"]), targetPath, errors);
        if (!text(target.title)) errors.push(`${targetPath}.title is required.`);
        for (const key of ["procedureId", "sourceLocationText"] as const) {
          if (target[key] !== undefined && !text(target[key])) {
            errors.push(`${targetPath}.${key} must be non-empty text when supplied.`);
          }
        }
      });
    }
  } else {
    validateUnknownKeys(node, new Set([...common, "label"]), path, errors);
    if (node.label !== undefined && !text(node.label)) {
      errors.push(`${path}.label must be non-empty text when supplied.`);
    }
  }

  validateSources(node.sources, `${path}.sources`, errors);
  return node;
}

export function validateProcedureGraph(value: unknown): ProcedureGraphValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(value)) {
    return { errors: ["graph must be an object."], warnings };
  }

  validateUnknownKeys(value, new Set(["version", "entryNodeId", "nodes"]), "graph", errors);
  if (value.version !== 1) errors.push("graph.version must be 1.");
  if (!text(value.entryNodeId)) errors.push("graph.entryNodeId is required.");
  if (!Array.isArray(value.nodes) || value.nodes.length === 0) {
    errors.push("graph.nodes must contain at least one node.");
    return { errors, warnings };
  }

  const nodes = value.nodes.map((node, index) => validateNodeShape(node, index, errors));
  const byId = new Map<string, JsonRecord>();
  const nodeOrder: string[] = [];

  nodes.forEach((node) => {
    if (!node || !text(node.id)) return;
    if (byId.has(node.id)) {
      errors.push(`graph.nodes contains duplicate id "${node.id}".`);
      return;
    }
    byId.set(node.id, node);
    nodeOrder.push(node.id);
  });

  const entryNodeId = text(value.entryNodeId) ? value.entryNodeId : undefined;
  if (entryNodeId && !byId.has(entryNodeId)) {
    errors.push(`graph.entryNodeId references missing node "${entryNodeId}".`);
  }

  const adjacency = new Map<string, readonly string[]>();
  for (const id of nodeOrder) {
    const node = byId.get(id)!;
    const targets = nodeTargets(node);
    adjacency.set(id, targets);
    for (const target of targets) {
      if (!byId.has(target)) {
        errors.push(`node "${id}" references missing target "${target}".`);
      }
    }
  }

  const reachable = new Set<string>();
  if (entryNodeId && byId.has(entryNodeId)) {
    const queue = [entryNodeId];
    while (queue.length) {
      const id = queue.shift()!;
      if (reachable.has(id)) continue;
      reachable.add(id);
      for (const target of adjacency.get(id) ?? []) {
        if (byId.has(target) && !reachable.has(target)) queue.push(target);
      }
    }
  }

  for (const id of nodeOrder) {
    if (entryNodeId && byId.has(entryNodeId) && !reachable.has(id)) {
      errors.push(`node "${id}" is unreachable from graph.entryNodeId.`);
    }
  }

  const state = new Map<string, 0 | 1 | 2>();
  let hasCycle = false;
  const visit = (id: string): void => {
    state.set(id, 1);
    for (const target of adjacency.get(id) ?? []) {
      if (!byId.has(target)) continue;
      const targetState = state.get(target) ?? 0;
      if (targetState === 1) {
        hasCycle = true;
        errors.push(`graph contains a cycle from node "${id}" to "${target}".`);
      } else if (targetState === 0) {
        visit(target);
      }
    }
    state.set(id, 2);
  };
  for (const id of nodeOrder) {
    if ((state.get(id) ?? 0) === 0) visit(id);
  }

  const endIds = nodeOrder.filter((id) => byId.get(id)?.kind === "end");
  if (endIds.length === 0) errors.push("graph must contain at least one end node.");

  const targetsAreKnown = [...adjacency.values()].flat().every((target) => byId.has(target));
  if (!hasCycle && targetsAreKnown && endIds.length > 0 && entryNodeId && byId.has(entryNodeId)) {
    const memo = new Map<string, boolean>();
    const canReachEnd = (id: string): boolean => {
      const cached = memo.get(id);
      if (cached !== undefined) return cached;
      const node = byId.get(id);
      if (!node) return false;
      if (node.kind === "end") {
        memo.set(id, true);
        return true;
      }
      const targets = adjacency.get(id) ?? [];
      const result = targets.length > 0 && targets.every((target) => canReachEnd(target));
      memo.set(id, result);
      return result;
    };

    for (const id of nodeOrder) {
      if (reachable.has(id) && !canReachEnd(id)) {
        errors.push(`node "${id}" has at least one path that does not terminate at an end node.`);
      }
    }
  }

  return { errors, warnings };
}

export function containsProcedureGraphPayload(payload: unknown): boolean {
  if (!isRecord(payload) || !Array.isArray(payload.procedures)) return false;
  return payload.procedures.some((procedure) => isRecord(procedure) && procedure.graph !== undefined);
}

// Type-only compile guard: the pure validator is intentionally defined against
// unknown JSON while remaining aligned with the exported graph contract.
const _graphContractCompileGuard: AircraftProcedureGraph | undefined = undefined;
void _graphContractCompileGuard;

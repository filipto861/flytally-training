import type {
  AircraftGraphProcedure,
  AircraftProcedureDefinition,
  ProcedureDecisionOption,
  ProcedureReferenceTarget,
  TrainingNotice,
  TrainingSourceReference,
} from "./universal-aircraft-content.ts";

export type ProcedureRelevanceModel = {
  readonly phase?: string;
  readonly prerequisites: readonly string[];
  readonly completionCriteria: readonly string[];
  /** Source-defined graph ACTION conditions only. */
  readonly conditionTexts: readonly string[];
  /** Source-defined crew roles from executable graph ACTION/REFERENCE nodes only. */
  readonly crewRoles: readonly string[];
  /** User-visible text from executable graph nodes explicitly marked memoryItem. */
  readonly memoryItems: readonly string[];
  readonly sources: readonly TrainingSourceReference[];
};

export type ProcedureLearnStep = {
  readonly id: string;
  readonly action: string;
  readonly expectedResult?: string;
  readonly verification?: string;
  readonly rationale?: string;
  readonly notices?: readonly TrainingNotice[];
  readonly sources?: readonly TrainingSourceReference[];
};

export type ProcedureLearnNode =
  | {
      readonly id: string;
      readonly kind: "ACTION";
      readonly action: string;
      readonly expectedResult?: string;
      readonly verification?: string;
      readonly rationale?: string;
      readonly notices?: readonly TrainingNotice[];
      readonly conditionText?: string;
      readonly memoryItem?: boolean;
      readonly crewRole?: string;
      readonly sources?: readonly TrainingSourceReference[];
    }
  | {
      readonly id: string;
      readonly kind: "DECISION";
      readonly prompt: string;
      readonly options: readonly ProcedureDecisionOption[];
      readonly sources?: readonly TrainingSourceReference[];
    }
  | {
      readonly id: string;
      readonly kind: "NOTE";
      readonly text: string;
      readonly sources?: readonly TrainingSourceReference[];
    }
  | {
      readonly id: string;
      readonly kind: "REFERENCE";
      readonly instruction: string;
      readonly targets: readonly ProcedureReferenceTarget[];
      readonly memoryItem?: boolean;
      readonly crewRole?: string;
      readonly sources?: readonly TrainingSourceReference[];
    }
  | {
      readonly id: string;
      readonly kind: "END";
      readonly label?: string;
      readonly sources?: readonly TrainingSourceReference[];
    };

export type ProcedureLearnModel =
  | {
      readonly kind: "linear";
      readonly steps: readonly ProcedureLearnStep[];
    }
  | {
      readonly kind: "graph";
      readonly nodes: readonly ProcedureLearnNode[];
    };

function isGraphProcedure(
  procedure: AircraftProcedureDefinition,
): procedure is AircraftGraphProcedure {
  return procedure.graph !== undefined;
}

function uniqueStrings(values: readonly (string | undefined)[]): readonly string[] {
  const unique = new Set<string>();
  for (const value of values) {
    if (value) unique.add(value);
  }
  return [...unique];
}

export function collectProcedureConditionTexts(
  procedure: AircraftProcedureDefinition,
): readonly string[] {
  if (!isGraphProcedure(procedure)) return [];

  return uniqueStrings(
    procedure.graph.nodes.map((node) =>
      node.kind === "action" ? node.conditionText : undefined,
    ),
  );
}

export function procedureRelevance(
  procedure: AircraftProcedureDefinition,
): ProcedureRelevanceModel {
  const shared = {
    ...(procedure.phase ? { phase: procedure.phase } : {}),
    prerequisites: [...(procedure.prerequisites ?? [])],
    completionCriteria: [...(procedure.completionCriteria ?? [])],
    sources: [...(procedure.sources ?? [])],
  };

  if (!isGraphProcedure(procedure)) {
    return {
      ...shared,
      conditionTexts: [],
      crewRoles: [],
      memoryItems: [],
    };
  }

  const crewRoles: (string | undefined)[] = [];
  const memoryItems: (string | undefined)[] = [];

  for (const node of procedure.graph.nodes) {
    if (node.kind === "action") {
      crewRoles.push(node.crewRole);
      if (node.memoryItem === true) memoryItems.push(node.action);
    } else if (node.kind === "reference") {
      crewRoles.push(node.crewRole);
      if (node.memoryItem === true) memoryItems.push(node.instruction);
    }
  }

  return {
    ...shared,
    conditionTexts: collectProcedureConditionTexts(procedure),
    crewRoles: uniqueStrings(crewRoles),
    memoryItems: uniqueStrings(memoryItems),
  };
}

export function procedureLearnProjection(
  procedure: AircraftProcedureDefinition,
): ProcedureLearnModel {
  if (!isGraphProcedure(procedure)) {
    return {
      kind: "linear",
      steps: procedure.steps.map((step) => ({
        id: step.id,
        action: step.action,
        ...(step.expectedResult ? { expectedResult: step.expectedResult } : {}),
        ...(step.verification ? { verification: step.verification } : {}),
        ...(step.rationale ? { rationale: step.rationale } : {}),
        ...(step.notices ? { notices: [...step.notices] } : {}),
        ...(step.sources ? { sources: [...step.sources] } : {}),
      })),
    };
  }

  return {
    kind: "graph",
    // Definition order is intentional. Learn is not an execution traversal.
    nodes: procedure.graph.nodes.map((node): ProcedureLearnNode => {
      switch (node.kind) {
        case "action":
          return {
            id: node.id,
            kind: "ACTION",
            action: node.action,
            ...(node.expectedResult ? { expectedResult: node.expectedResult } : {}),
            ...(node.verification ? { verification: node.verification } : {}),
            ...(node.rationale ? { rationale: node.rationale } : {}),
            ...(node.notices ? { notices: [...node.notices] } : {}),
            ...(node.conditionText ? { conditionText: node.conditionText } : {}),
            ...(node.memoryItem !== undefined ? { memoryItem: node.memoryItem } : {}),
            ...(node.crewRole ? { crewRole: node.crewRole } : {}),
            ...(node.sources ? { sources: [...node.sources] } : {}),
          };
        case "decision":
          return {
            id: node.id,
            kind: "DECISION",
            prompt: node.prompt,
            options: node.options.map((option) => ({ ...option })),
            ...(node.sources ? { sources: [...node.sources] } : {}),
          };
        case "note":
          return {
            id: node.id,
            kind: "NOTE",
            text: node.text,
            ...(node.sources ? { sources: [...node.sources] } : {}),
          };
        case "reference":
          return {
            id: node.id,
            kind: "REFERENCE",
            instruction: node.instruction,
            targets: node.targets.map((target) => ({ ...target })),
            ...(node.memoryItem !== undefined ? { memoryItem: node.memoryItem } : {}),
            ...(node.crewRole ? { crewRole: node.crewRole } : {}),
            ...(node.sources ? { sources: [...node.sources] } : {}),
          };
        case "end":
          return {
            id: node.id,
            kind: "END",
            ...(node.label ? { label: node.label } : {}),
            ...(node.sources ? { sources: [...node.sources] } : {}),
          };
      }
    }),
  };
}

export function formatProcedureSources(
  sources: readonly TrainingSourceReference[] | undefined,
): string | undefined {
  return sources
    ?.map((item) =>
      [
        item.chapter ? `Ch ${item.chapter}` : undefined,
        item.section,
        `p. ${item.pageLabel}`,
      ]
        .filter(Boolean)
        .join(" · "),
    )
    .join(" · ");
}

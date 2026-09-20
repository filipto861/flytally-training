import type {
  AircraftProcedureDefinition,
  ProcedureNode,
} from "./universal-aircraft-content.ts";

export type ProcedureFilters = {
  readonly query?: string;
  readonly phase?: string;
};

const normalized = (value: string): string => value.trim().toLocaleLowerCase();

export function listProcedurePhases(
  procedures: readonly AircraftProcedureDefinition[],
): readonly string[] {
  return [...new Set(
    procedures
      .map((procedure) => procedure.phase?.trim())
      .filter((phase): phase is string => Boolean(phase)),
  )].sort((left, right) => left.localeCompare(right));
}

function graphNodeSearchValues(node: ProcedureNode): readonly (string | undefined)[] {
  switch (node.kind) {
    case "action":
      return [
        node.action,
        node.expectedResult,
        node.verification,
        node.rationale,
        node.conditionText,
        node.crewRole,
        ...(node.notices?.map((notice) => notice.text) ?? []),
      ];

    case "decision":
      return [
        node.prompt,
        ...node.options.flatMap((option) => [option.id, option.label]),
      ];

    case "note":
      return [node.text];

    case "reference":
      return [
        node.instruction,
        node.crewRole,
        ...node.targets.flatMap((target) => [
          target.title,
          target.procedureId,
          target.sourceLocationText,
        ]),
      ];

    case "end":
      return [node.label];
  }
}

export function procedureSearchText(
  procedure: AircraftProcedureDefinition,
): string {
  const executionValues = procedure.graph
    ? procedure.graph.nodes.flatMap(graphNodeSearchValues)
    : procedure.steps.flatMap((step) => [
        step.action,
        step.expectedResult,
        step.verification,
        step.rationale,
      ]);

  return [
    procedure.id,
    procedure.title,
    procedure.phase,
    procedure.summary,
    ...(procedure.prerequisites ?? []),
    ...executionValues,
    ...(procedure.completionCriteria ?? []),
  ].filter((value): value is string => Boolean(value)).join("\n").toLocaleLowerCase();
}

export function filterProcedures<T extends AircraftProcedureDefinition>(
  procedures: readonly T[],
  filters: ProcedureFilters,
): readonly T[] {
  const query = normalized(filters.query ?? "");
  const phase = normalized(filters.phase ?? "");

  return procedures.filter((procedure) => {
    if (phase && normalized(procedure.phase ?? "") !== phase) return false;
    if (query && !procedureSearchText(procedure).includes(query)) return false;
    return true;
  });
}

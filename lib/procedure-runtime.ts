import type { AircraftProcedure } from "./universal-aircraft-content.ts";

export type ProcedureFilters = {
  readonly query?: string;
  readonly phase?: string;
};

const normalized = (value: string): string => value.trim().toLocaleLowerCase();

export function listProcedurePhases(procedures: readonly AircraftProcedure[]): readonly string[] {
  return [...new Set(procedures.map((procedure) => procedure.phase?.trim()).filter((phase): phase is string => Boolean(phase)))].sort((a, b) => a.localeCompare(b));
}

export function procedureSearchText(procedure: AircraftProcedure): string {
  return [
    procedure.id,
    procedure.title,
    procedure.phase,
    procedure.summary,
    ...(procedure.prerequisites ?? []),
    ...procedure.steps.flatMap((step) => [step.action, step.expectedResult, step.verification, step.rationale]),
    ...(procedure.completionCriteria ?? []),
  ].filter((value): value is string => Boolean(value)).join("\n").toLocaleLowerCase();
}

export function filterProcedures(procedures: readonly AircraftProcedure[], filters: ProcedureFilters): readonly AircraftProcedure[] {
  const query = normalized(filters.query ?? "");
  const phase = normalized(filters.phase ?? "");

  return procedures.filter((procedure) => {
    if (phase && normalized(procedure.phase ?? "") !== phase) return false;
    if (query && !procedureSearchText(procedure).includes(query)) return false;
    return true;
  });
}

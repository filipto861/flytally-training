import type { AircraftProcedure } from "./universal-aircraft-content.ts";

export type ProcedureSessionSnapshot = {
  readonly version: 1;
  readonly selectedProcedureId: string;
  readonly completedStepKeys: readonly string[];
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

function knownStepKeys(procedures: readonly AircraftProcedure[]): ReadonlySet<string> {
  return new Set(procedures.flatMap((procedure) => procedure.steps.map((step) => procedureStepKey(procedure.id, step.id))));
}

export function normalizeProcedureSessionSnapshot(
  value: unknown,
  procedures: readonly AircraftProcedure[],
): ProcedureSessionSnapshot {
  const procedureIds = new Set(procedures.map((procedure) => procedure.id));
  const stepKeys = knownStepKeys(procedures);
  const fallbackProcedureId = procedures[0]?.id ?? "";
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { version: 1, selectedProcedureId: fallbackProcedureId, completedStepKeys: [] };
  }

  const raw = value as Record<string, unknown>;
  const selectedProcedureId = typeof raw.selectedProcedureId === "string" && procedureIds.has(raw.selectedProcedureId)
    ? raw.selectedProcedureId
    : fallbackProcedureId;
  const completedStepKeys = Array.isArray(raw.completedStepKeys)
    ? [...new Set(raw.completedStepKeys.filter((key): key is string => typeof key === "string" && stepKeys.has(key)))]
    : [];

  return { version: 1, selectedProcedureId, completedStepKeys };
}

export function procedureProgress(
  procedures: readonly AircraftProcedure[],
  completedStepKeys: ReadonlySet<string>,
): readonly ProcedureProgress[] {
  return procedures.map((procedure) => {
    const completedSteps = procedure.steps.filter((step) => completedStepKeys.has(procedureStepKey(procedure.id, step.id))).length;
    return {
      procedureId: procedure.id,
      completedSteps,
      totalSteps: procedure.steps.length,
      complete: procedure.steps.length > 0 && completedSteps === procedure.steps.length,
    };
  });
}

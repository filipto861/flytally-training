import { isChecklistTrainingMode, type ChecklistTrainingMode } from "./checklist-training.ts";
import type { RuntimeChecklist } from "./checklist-runtime.ts";

export type ChecklistSessionSnapshot = {
  readonly version: 1;
  readonly mode: ChecklistTrainingMode;
  readonly selectedPhaseId: string;
  readonly completedIds: readonly string[];
  readonly revealedFlowPhaseIds: readonly string[];
  readonly revealedResponseIds: readonly string[];
};

export type ChecklistPhaseProgress = {
  readonly phaseId: string;
  readonly complete: boolean;
  readonly completedItems: number;
  readonly totalItems: number;
};

function uniqueKnown(values: unknown, known: ReadonlySet<string>): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((value): value is string => typeof value === "string" && known.has(value)))];
}

export function checklistSessionStorageKey(checklist: Pick<RuntimeChecklist, "aircraftId" | "title">, selectedVariant?: string): string {
  return `flytally-training-checklist-session:${encodeURIComponent(checklist.aircraftId)}:${encodeURIComponent(selectedVariant ?? "common")}:${encodeURIComponent(checklist.title)}`;
}

export function initialChecklistPhaseId(checklist: RuntimeChecklist): string {
  return checklist.phases[0]?.id ?? "";
}

export function normalizeChecklistSessionSnapshot(value: unknown, checklist: RuntimeChecklist): ChecklistSessionSnapshot {
  const phaseIds = new Set(checklist.phases.map((phase) => phase.id));
  const itemIds = new Set(checklist.phases.flatMap((phase) => phase.items.map((item) => item.id)));
  const fallbackPhase = initialChecklistPhaseId(checklist);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { version: 1, mode: "run", selectedPhaseId: fallbackPhase, completedIds: [], revealedFlowPhaseIds: [], revealedResponseIds: [] };
  }

  const raw = value as Record<string, unknown>;
  const selectedPhaseId = typeof raw.selectedPhaseId === "string" && phaseIds.has(raw.selectedPhaseId)
    ? raw.selectedPhaseId
    : fallbackPhase;
  const mode = typeof raw.mode === "string" && isChecklistTrainingMode(raw.mode) ? raw.mode : "run";

  return {
    version: 1,
    mode,
    selectedPhaseId,
    completedIds: uniqueKnown(raw.completedIds, itemIds),
    revealedFlowPhaseIds: uniqueKnown(raw.revealedFlowPhaseIds, phaseIds),
    revealedResponseIds: uniqueKnown(raw.revealedResponseIds, itemIds),
  };
}

export function checklistPhaseProgress(checklist: RuntimeChecklist, completedIds: ReadonlySet<string>): readonly ChecklistPhaseProgress[] {
  return checklist.phases.map((phase) => {
    const completedItems = phase.items.filter((item) => completedIds.has(item.id)).length;
    return {
      phaseId: phase.id,
      completedItems,
      totalItems: phase.items.length,
      complete: phase.items.length > 0 && completedItems === phase.items.length,
    };
  });
}

export function nextChecklistPhaseId(checklist: RuntimeChecklist, currentPhaseId: string): string | undefined {
  const index = checklist.phases.findIndex((phase) => phase.id === currentPhaseId);
  if (index < 0) return checklist.phases[0]?.id;
  return checklist.phases[index + 1]?.id;
}

export function checklistProgressContentId(scope: "complete" | "phase", phaseId: string | undefined, mode: ChecklistTrainingMode, selectedVariant?: string): string {
  const target = scope === "complete" ? "complete-checklist" : `phase:${phaseId ?? "unknown"}`;
  return `${target}:mode=${mode}:variant=${selectedVariant ?? "common"}`;
}

import {
  checklistPhaseProgress,
  checklistSessionStorageKey,
  normalizeChecklistSessionSnapshot,
  type ChecklistSessionSnapshot,
} from "../checklist-session.ts";
import type { RuntimeChecklist } from "../checklist-runtime.ts";
import {
  restoreChecklistSessionWithLegacyMigration,
  type LegacyOperationalChecklistStorage,
} from "../checklist-session-migration.ts";

export type ChecklistSessionStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
};

function storageKey(
  checklist: RuntimeChecklist,
  selectedVariant?: string,
  sessionScope?: string,
): string {
  return checklistSessionStorageKey(checklist, selectedVariant, sessionScope);
}

export function restoreFastPathChecklistSession(
  checklist: RuntimeChecklist,
  storage: ChecklistSessionStorage,
  selectedVariant?: string,
  legacyStorage?: LegacyOperationalChecklistStorage,
  sessionScope?: string,
  previousCanonicalStorage?: ChecklistSessionStorage,
): ChecklistSessionSnapshot {
  if (legacyStorage) {
    return restoreChecklistSessionWithLegacyMigration(
      checklist,
      storage,
      legacyStorage,
      selectedVariant,
      sessionScope,
      previousCanonicalStorage,
    );
  }

  let raw: unknown;
  try {
    const stored = storage.getItem(
      storageKey(checklist, selectedVariant, sessionScope),
    );
    raw = stored ? JSON.parse(stored) : undefined;
  } catch {
    raw = undefined;
  }
  return normalizeChecklistSessionSnapshot(raw, checklist);
}

export function saveFastPathChecklistSession(
  checklist: RuntimeChecklist,
  snapshot: ChecklistSessionSnapshot,
  storage: ChecklistSessionStorage,
  selectedVariant?: string,
  sessionScope?: string,
): void {
  storage.setItem(
    storageKey(checklist, selectedVariant, sessionScope),
    JSON.stringify(snapshot),
  );
}

export function toggleFastPathChecklistItem(
  snapshot: ChecklistSessionSnapshot,
  itemId: string,
  checklist: RuntimeChecklist,
): ChecklistSessionSnapshot {
  const knownItemIds = new Set(
    checklist.phases.flatMap((phase) => phase.items.map((item) => item.id)),
  );
  if (!knownItemIds.has(itemId)) return snapshot;

  const completed = new Set(snapshot.completedIds);
  if (completed.has(itemId)) completed.delete(itemId);
  else completed.add(itemId);

  return normalizeChecklistSessionSnapshot(
    { ...snapshot, completedIds: [...completed] },
    checklist,
  );
}

export function fastPathChecklistProgress(
  checklist: RuntimeChecklist,
  snapshot: ChecklistSessionSnapshot,
): {
  readonly completed: number;
  readonly total: number;
  readonly active: boolean;
} {
  const progress = checklistPhaseProgress(checklist, new Set(snapshot.completedIds));
  const completed = progress.reduce((sum, phase) => sum + phase.completedItems, 0);
  const total = progress.reduce((sum, phase) => sum + phase.totalItems, 0);
  return {
    completed,
    total,
    active: completed > 0 && completed < total,
  };
}

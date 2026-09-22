import {
  checklistSessionStorageKey,
  normalizeChecklistSessionSnapshot,
  type ChecklistSessionSnapshot,
} from "./checklist-session.ts";
import type { RuntimeChecklist } from "./checklist-runtime.ts";

export type ChecklistCanonicalStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type LegacyOperationalChecklistStorage = {
  getItem(key: string): string | null;
  removeItem(key: string): void;
};

type LegacyOperationalChecklistV1 = {
  readonly version: 1;
  readonly phaseId: string;
  readonly completedIds: readonly string[];
};

function parseJson(raw: string): unknown | undefined {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function legacySnapshot(value: unknown): LegacyOperationalChecklistV1 | undefined {
  if (!isRecord(value) || value.version !== 1) return undefined;
  if (typeof value.phaseId !== "string") return undefined;
  if (
    !Array.isArray(value.completedIds) ||
    !value.completedIds.every((item) => typeof item === "string")
  ) {
    return undefined;
  }
  return {
    version: 1,
    phaseId: value.phaseId,
    completedIds: value.completedIds,
  };
}

export function legacyOperationalChecklistStorageKey(
  checklist: Pick<RuntimeChecklist, "aircraftId" | "title">,
  selectedVariant?: string,
): string {
  return `flytally:flight-checklist:v1:${checklist.aircraftId}:${selectedVariant ?? "common"}:${checklist.title}`;
}

export function restoreChecklistSessionWithLegacyMigration(
  checklist: RuntimeChecklist,
  canonicalStorage: ChecklistCanonicalStorage,
  legacyStorage: LegacyOperationalChecklistStorage,
  selectedVariant?: string,
): ChecklistSessionSnapshot {
  const canonicalKey = checklistSessionStorageKey(checklist, selectedVariant);
  const legacyKey = legacyOperationalChecklistStorageKey(
    checklist,
    selectedVariant,
  );

  const canonicalRaw = canonicalStorage.getItem(canonicalKey);
  if (canonicalRaw !== null) {
    const canonical = normalizeChecklistSessionSnapshot(
      parseJson(canonicalRaw),
      checklist,
    );
    canonicalStorage.setItem(canonicalKey, JSON.stringify(canonical));

    // Once canonical state exists, legacy state is never allowed to take
    // precedence on a later shell transition.
    if (legacyStorage.getItem(legacyKey) !== null) {
      legacyStorage.removeItem(legacyKey);
    }
    return canonical;
  }

  const legacyRaw = legacyStorage.getItem(legacyKey);
  if (legacyRaw === null) {
    return normalizeChecklistSessionSnapshot(undefined, checklist);
  }

  // Legacy state is single-use regardless of whether it validates.
  legacyStorage.removeItem(legacyKey);
  const legacy = legacySnapshot(parseJson(legacyRaw));

  const migrated = normalizeChecklistSessionSnapshot(
    legacy
      ? {
          version: 1,
          mode: "run",
          selectedPhaseId: legacy.phaseId,
          completedIds: legacy.completedIds,
          revealedFlowPhaseIds: [],
          revealedResponseIds: [],
        }
      : undefined,
    checklist,
  );

  canonicalStorage.setItem(canonicalKey, JSON.stringify(migrated));
  return migrated;
}

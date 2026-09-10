export const trainingActivityKinds = [
  "quick-start",
  "systems",
  "orientation",
  "normal-flight",
  "checklist-phase",
  "scenario",
  "knowledge",
] as const;

export type TrainingActivityKind = typeof trainingActivityKinds[number];

export type TrainingProgressEvent = {
  readonly eventId?: string;
  readonly aircraftId: string;
  readonly kind: TrainingActivityKind;
  readonly contentId: string;
  readonly occurredAt: string;
  readonly completed: boolean;
  readonly scorePercent?: number;
  readonly weakAreas?: readonly string[];
};

export type PersistedTrainingProgressEvent = TrainingProgressEvent & { readonly eventId: string };

export type TrainingProgressSummary = {
  readonly aircraftId: string;
  readonly attempts: number;
  readonly completedActivities: number;
  readonly latestActivityAt?: string;
  readonly weakAreas: readonly string[];
  readonly recent: readonly TrainingProgressEvent[];
};

export const MAX_PROGRESS_FUTURE_SKEW_MS = 10 * 60 * 1000;

export function isTrainingActivityKind(value: unknown): value is TrainingActivityKind {
  return typeof value === "string" && (trainingActivityKinds as readonly string[]).includes(value);
}

export function isPersistedTrainingProgressEvent(value: unknown): value is PersistedTrainingProgressEvent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  if (typeof event.eventId !== "string" || event.eventId.length < 8 || event.eventId.length > 128) return false;
  if (typeof event.aircraftId !== "string" || event.aircraftId.length < 1 || event.aircraftId.length > 128) return false;
  if (!isTrainingActivityKind(event.kind)) return false;
  if (typeof event.contentId !== "string" || event.contentId.length < 1 || event.contentId.length > 200) return false;
  if (typeof event.occurredAt !== "string" || Number.isNaN(Date.parse(event.occurredAt))) return false;
  if (typeof event.completed !== "boolean") return false;
  if (event.scorePercent !== undefined && (typeof event.scorePercent !== "number" || !Number.isInteger(event.scorePercent) || event.scorePercent < 0 || event.scorePercent > 100)) return false;
  if (event.weakAreas !== undefined && (!Array.isArray(event.weakAreas) || event.weakAreas.length > 20 || event.weakAreas.some((area) => typeof area !== "string" || area.length > 100))) return false;
  return true;
}

/**
 * Server ingestion accepts arbitrarily old events so offline history can sync,
 * but it must not let a bad device clock or crafted client place continuation
 * state far in the future. Ten minutes covers ordinary device clock skew while
 * preventing a future timestamp from dominating aircraft progress indefinitely.
 */
export function isServerAcceptableProgressEvent(
  value: unknown,
  nowMs = Date.now(),
): value is PersistedTrainingProgressEvent {
  if (!isPersistedTrainingProgressEvent(value)) return false;
  return Date.parse(value.occurredAt) <= nowMs + MAX_PROGRESS_FUTURE_SKEW_MS;
}

export function summarizeProgress(aircraftId: string, events: readonly TrainingProgressEvent[]): TrainingProgressSummary {
  const relevant = events.filter((event) => event.aircraftId === aircraftId).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const completedIds = new Set(relevant.filter((event) => event.completed).map((event) => `${event.kind}:${event.contentId}`));
  const weakAreas = [...new Set(relevant.flatMap((event) => event.weakAreas ?? []))];
  return { aircraftId, attempts: relevant.length, completedActivities: completedIds.size, latestActivityAt: relevant[0]?.occurredAt, weakAreas, recent: relevant.slice(0, 8) };
}

export function progressStorageKey(aircraftId: string): string {
  return `flytally-training-progress:${aircraftId}`;
}

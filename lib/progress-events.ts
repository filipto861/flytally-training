export type TrainingActivityKind =
  | "quick-start"
  | "systems"
  | "normal-flight"
  | "checklist-phase"
  | "scenario"
  | "knowledge";

export type TrainingProgressEvent = {
  readonly aircraftId: string;
  readonly kind: TrainingActivityKind;
  readonly contentId: string;
  readonly occurredAt: string;
  readonly completed: boolean;
  readonly scorePercent?: number;
  readonly weakAreas?: readonly string[];
};

export type TrainingProgressSummary = {
  readonly aircraftId: string;
  readonly attempts: number;
  readonly completedActivities: number;
  readonly latestActivityAt?: string;
  readonly weakAreas: readonly string[];
  readonly recent: readonly TrainingProgressEvent[];
};

export function summarizeProgress(
  aircraftId: string,
  events: readonly TrainingProgressEvent[],
): TrainingProgressSummary {
  const relevant = events
    .filter((event) => event.aircraftId === aircraftId)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  const completedIds = new Set(
    relevant.filter((event) => event.completed).map((event) => `${event.kind}:${event.contentId}`),
  );
  const weakAreas = [...new Set(relevant.flatMap((event) => event.weakAreas ?? []))];

  return {
    aircraftId,
    attempts: relevant.length,
    completedActivities: completedIds.size,
    latestActivityAt: relevant[0]?.occurredAt,
    weakAreas,
    recent: relevant.slice(0, 8),
  };
}

export function progressStorageKey(aircraftId: string): string {
  return `flytally-training-progress:${aircraftId}`;
}

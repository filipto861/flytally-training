import {
  isPersistedTrainingProgressEvent,
  progressStorageKey,
  type PersistedTrainingProgressEvent,
  type TrainingProgressEvent,
} from "./progress-events";

export type ProgressLoadResult = {
  readonly events: readonly PersistedTrainingProgressEvent[];
  readonly persistence: "account" | "local";
  readonly lastContentId?: string;
};

const MAX_LOCAL_PROGRESS_EVENTS = 1000;

function eventId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Local progress is kept oldest -> newest so appending and retention are
 * deterministic even though the server API returns newest -> oldest.
 */
export function normalizeProgressEvents(events: readonly PersistedTrainingProgressEvent[]): PersistedTrainingProgressEvent[] {
  const byId = new Map<string, PersistedTrainingProgressEvent>();
  for (const event of events) byId.set(event.eventId, event);
  return [...byId.values()]
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.eventId.localeCompare(b.eventId))
    .slice(-MAX_LOCAL_PROGRESS_EVENTS);
}

/** Remote events are canonical for a duplicate event id; local-only events are retained. */
export function mergeProgressEvents(
  local: readonly PersistedTrainingProgressEvent[],
  remote: readonly PersistedTrainingProgressEvent[],
): PersistedTrainingProgressEvent[] {
  return normalizeProgressEvents([...local, ...remote]);
}

function persistLocal(aircraftId: string, events: readonly PersistedTrainingProgressEvent[]): PersistedTrainingProgressEvent[] {
  const normalized = normalizeProgressEvents(events.filter((event) => event.aircraftId === aircraftId));
  if (typeof window !== "undefined") {
    window.localStorage.setItem(progressStorageKey(aircraftId), JSON.stringify(normalized));
  }
  return normalized;
}

export function readBrowserProgress(aircraftId: string): PersistedTrainingProgressEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(progressStorageKey(aircraftId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    let changed = false;
    const migrated = parsed.flatMap((item): unknown[] => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        changed = true;
        return [];
      }
      const record = item as Record<string, unknown>;
      if (typeof record.eventId === "string" && record.eventId.length >= 8) return [record];
      changed = true;
      return [{ ...record, eventId: eventId() }];
    });

    const valid = migrated.filter(isPersistedTrainingProgressEvent).filter((event) => event.aircraftId === aircraftId);
    if (valid.length !== migrated.length) changed = true;
    const normalized = normalizeProgressEvents(valid);
    if (normalized.length !== valid.length || normalized.some((event, index) => event !== valid[index])) changed = true;
    if (changed) persistLocal(aircraftId, normalized);
    return normalized;
  } catch {
    return [];
  }
}

export function appendBrowserProgress(event: TrainingProgressEvent): void {
  if (typeof window === "undefined") return;
  const persisted: PersistedTrainingProgressEvent = { ...event, eventId: event.eventId ?? eventId() };
  const current = readBrowserProgress(event.aircraftId);
  persistLocal(event.aircraftId, [...current, persisted]);
  window.dispatchEvent(new CustomEvent("flytally-training-progress", { detail: event.aircraftId }));
  void fetch("/api/progress", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ events: [persisted] }),
  }).catch(() => undefined);
}

export async function loadTrainingProgress(aircraftId: string): Promise<ProgressLoadResult> {
  const localAtStart = readBrowserProgress(aircraftId);
  try {
    if (localAtStart.length) {
      const syncResponse = await fetch("/api/progress", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ events: localAtStart }),
      });
      // Never replace local progress with an older server snapshot after a failed write.
      if (!syncResponse.ok) return { events: localAtStart, persistence: "local", lastContentId: localAtStart.at(-1)?.contentId };
    }

    const response = await fetch(`/api/progress?aircraftId=${encodeURIComponent(aircraftId)}`, {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) {
      const current = readBrowserProgress(aircraftId);
      return { events: current, persistence: "local", lastContentId: current.at(-1)?.contentId };
    }

    const data = await response.json() as { events?: unknown[]; state?: { lastContentId?: string } };
    const remote = normalizeProgressEvents(
      (Array.isArray(data.events) ? data.events : [])
        .filter(isPersistedTrainingProgressEvent)
        .filter((event) => event.aircraftId === aircraftId),
    );

    // A new local event may have been recorded while the POST/GET round-trip was
    // in flight. Merge the fresh browser state with the server response instead
    // of overwriting it. The next load will upload any local-only event.
    const currentLocal = readBrowserProgress(aircraftId);
    const remoteIds = new Set(remote.map((event) => event.eventId));
    const hasPendingLocal = currentLocal.some((event) => !remoteIds.has(event.eventId));
    const merged = persistLocal(aircraftId, mergeProgressEvents(currentLocal, remote));

    return {
      events: merged,
      persistence: hasPendingLocal ? "local" : "account",
      lastContentId: hasPendingLocal ? merged.at(-1)?.contentId : data.state?.lastContentId,
    };
  } catch {
    const current = readBrowserProgress(aircraftId);
    return { events: current, persistence: "local", lastContentId: current.at(-1)?.contentId };
  }
}

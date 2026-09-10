import { progressStorageKey, type PersistedTrainingProgressEvent, type TrainingProgressEvent } from "./progress-events";

export type ProgressLoadResult = {
  readonly events: readonly PersistedTrainingProgressEvent[];
  readonly persistence: "account" | "local";
  readonly lastContentId?: string;
};

function eventId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function persistLocal(aircraftId: string, events: readonly PersistedTrainingProgressEvent[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(progressStorageKey(aircraftId), JSON.stringify(events.slice(-1000)));
}

export function readBrowserProgress(aircraftId: string): PersistedTrainingProgressEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(progressStorageKey(aircraftId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    let migrated = false;
    const events = parsed.filter((item) => item && typeof item === "object").map((item) => {
      if (typeof item.eventId === "string" && item.eventId.length >= 8) return item as PersistedTrainingProgressEvent;
      migrated = true;
      return { ...item, eventId: eventId() } as PersistedTrainingProgressEvent;
    });
    if (migrated) persistLocal(aircraftId, events);
    return events;
  } catch { return []; }
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
  const local = readBrowserProgress(aircraftId);
  try {
    if (local.length) {
      await fetch("/api/progress", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ events: local }) });
    }
    const response = await fetch(`/api/progress?aircraftId=${encodeURIComponent(aircraftId)}`, { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) return { events: local, persistence: "local" };
    const data = await response.json() as { events?: PersistedTrainingProgressEvent[]; state?: { lastContentId?: string } };
    const remote = Array.isArray(data.events) ? data.events : [];
    persistLocal(aircraftId, remote);
    return { events: remote, persistence: "account", lastContentId: data.state?.lastContentId };
  } catch {
    return { events: local, persistence: "local" };
  }
}

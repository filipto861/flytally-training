import { progressStorageKey, type TrainingProgressEvent } from "./progress-events";

export function readBrowserProgress(aircraftId: string): TrainingProgressEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(progressStorageKey(aircraftId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendBrowserProgress(event: TrainingProgressEvent): void {
  if (typeof window === "undefined") return;
  const current = readBrowserProgress(event.aircraftId);
  const next = [...current, event].slice(-250);
  window.localStorage.setItem(progressStorageKey(event.aircraftId), JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("flytally-training-progress", { detail: event.aircraftId }));
}

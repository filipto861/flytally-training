import type { MetarFreshness, MetarSnapshot } from "./metar-types.ts";

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isMetarSnapshot(value: unknown): value is MetarSnapshot {
  if (!record(value)) return false;
  return (
    typeof value.station === "string"
    && /^[A-Z]{4}$/.test(value.station)
    && typeof value.observedAt === "string"
    && Number.isFinite(Date.parse(value.observedAt))
    && typeof value.fetchedAt === "string"
    && Number.isFinite(Date.parse(value.fetchedAt))
    && typeof value.rawText === "string"
    && typeof value.windVariable === "boolean"
    && typeof value.windCalm === "boolean"
    && value.source === "aviationweather.gov"
  );
}

export function formatMetarAge(timestamp: string, now = Date.now()): string {
  const observed = Date.parse(timestamp);
  if (!Number.isFinite(observed)) return "age unknown";
  const ageMs = Math.max(0, now - observed);
  const minutes = Math.floor(ageMs / 60_000);
  if (minutes < 1) return "<1 min ago";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours < 24) return remainder ? `${hours}h ${remainder}m ago` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function canApplyMetarFreshness(freshness: MetarFreshness): boolean {
  return freshness !== "expired";
}

export function formatObservationZulu(timestamp: string): string {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return "time unknown";
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}Z`;
}

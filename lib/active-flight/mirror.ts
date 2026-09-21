import { LOCAL_ACTIVE_FLIGHT_SUBJECT, type ActiveFlight } from "./types.ts";
import { isActiveFlight } from "./validation.ts";

export interface ActiveFlightMirrorStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const ACTIVE_FLIGHT_MIRROR_EVENT = "ft-active-flight-changed";

export function activeFlightMirrorKey(aircraftId: string): string {
  return "flytally-training:active-flight:v1:" + aircraftId;
}

export function readActiveFlightMirror(
  storage: ActiveFlightMirrorStorage,
  aircraftId: string,
): ActiveFlight | null {
  const raw = storage.getItem(activeFlightMirrorKey(aircraftId));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isActiveFlight(parsed) || parsed.aircraftId !== aircraftId) {
      storage.removeItem(activeFlightMirrorKey(aircraftId));
      return null;
    }
    return parsed;
  } catch {
    storage.removeItem(activeFlightMirrorKey(aircraftId));
    return null;
  }
}

export function writeActiveFlightMirror(
  storage: ActiveFlightMirrorStorage,
  flight: ActiveFlight,
): void {
  storage.setItem(activeFlightMirrorKey(flight.aircraftId), JSON.stringify(flight));
}

export function clearActiveFlightMirror(
  storage: ActiveFlightMirrorStorage,
  aircraftId: string,
): void {
  storage.removeItem(activeFlightMirrorKey(aircraftId));
}

/**
 * Server wins whenever it is available. undefined means the server was not
 * available (anonymous/offline), so the local mirror remains usable.
 * null is authoritative "no ACTIVE flight" and clears an ACTIVE local mirror.
 */
export function reconcileActiveFlightMirror(
  serverFlight: ActiveFlight | null | undefined,
  localFlight: ActiveFlight | null,
): ActiveFlight | null {
  return serverFlight === undefined ? localFlight : serverFlight;
}

export function createLocalActiveFlight(
  input: Omit<ActiveFlight, "id" | "accountSubject" | "lifecycle" | "weather" | "performanceDependency" | "createdAt" | "updatedAt" | "activatedAt" | "deactivatedAt" | "archivedAt">,
  snapshotId: string,
  id: string,
  now: string,
): ActiveFlight {
  const timestamp = new Date(now).toISOString();
  return {
    ...input,
    id,
    accountSubject: LOCAL_ACTIVE_FLIGHT_SUBJECT,
    lifecycle: "ACTIVE",
    weather: null,
    performanceDependency: { snapshotId },
    createdAt: timestamp,
    updatedAt: timestamp,
    activatedAt: timestamp,
    deactivatedAt: null,
    archivedAt: null,
  };
}

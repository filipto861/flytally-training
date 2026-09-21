"use client";

import {
  createLocalActiveFlight,
} from "./mirror";
import {
  LOCAL_ACTIVE_FLIGHT_SUBJECT,
  transitionActiveFlight,
  type ActiveFlight,
  type ActiveFlightInput,
  type ActiveFlightPatch,
} from "./types";
import {
  activeFlightDependencyReference,
  isActiveFlight,
} from "./validation";

export type ActiveFlightPersistenceMode = "server-mirror" | "local-only";

export class ActiveFlightClientError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "ActiveFlightClientError";
    this.code = code;
  }
}

function localCreate(input: ActiveFlightInput): ActiveFlight {
  return createLocalActiveFlight(
    {
      aircraftId: input.aircraftId,
      departure: input.departure,
      destination: input.destination,
      runway: input.runway,
      weight: input.weight,
      configuration: input.configuration,
      brief: input.brief ?? null,
    },
    activeFlightDependencyReference(input),
    crypto.randomUUID(),
    new Date().toISOString(),
  );
}

function localPatch(flight: ActiveFlight, patch: ActiveFlightPatch): ActiveFlight {
  const merged = {
    departure: patch.departure ?? flight.departure,
    destination: patch.destination ?? flight.destination,
    runway: patch.runway ?? flight.runway,
    weight: patch.weight ?? flight.weight,
    configuration: patch.configuration ?? flight.configuration,
  };
  const timestamp = new Date().toISOString();

  return {
    ...flight,
    ...merged,
    brief: patch.brief !== undefined ? patch.brief : flight.brief,
    performanceDependency: {
      snapshotId: activeFlightDependencyReference(merged),
    },
    updatedAt: timestamp,
  };
}

async function responseFlight(response: Response): Promise<ActiveFlight> {
  const body: unknown = await response.json();
  const flight = body && typeof body === "object" && !Array.isArray(body)
    ? (body as { flight?: unknown }).flight
    : undefined;
  if (!isActiveFlight(flight)) throw new ActiveFlightClientError("invalid_server_response");
  return flight;
}

function shouldUseLocalFallback(error: unknown): boolean {
  return error instanceof TypeError;
}

export async function createClientActiveFlight(
  input: ActiveFlightInput,
  persistenceMode: ActiveFlightPersistenceMode = "server-mirror",
): Promise<ActiveFlight> {
  if (persistenceMode === "local-only") return localCreate(input);

  try {
    const response = await fetch("/api/active-flight", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (response.status === 201) return responseFlight(response);
    if (response.status === 401) return localCreate(input);
    if (response.status === 409) throw new ActiveFlightClientError("active_flight_exists");
    if (response.status === 404) throw new ActiveFlightClientError("feature_disabled");
    throw new ActiveFlightClientError("create_failed");
  } catch (error) {
    if (shouldUseLocalFallback(error)) return localCreate(input);
    throw error;
  }
}

export async function patchClientActiveFlight(
  flight: ActiveFlight,
  patch: ActiveFlightPatch,
): Promise<ActiveFlight> {
  if (flight.lifecycle !== "ACTIVE") throw new ActiveFlightClientError("invalid_lifecycle");
  if (flight.accountSubject === LOCAL_ACTIVE_FLIGHT_SUBJECT) {
    return localPatch(flight, patch);
  }

  try {
    const response = await fetch("/api/active-flight", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        aircraftId: flight.aircraftId,
        patch,
      }),
    });
    if (response.ok) return responseFlight(response);
    if (response.status === 401) return localPatch(flight, patch);
    throw new ActiveFlightClientError("update_failed");
  } catch (error) {
    if (shouldUseLocalFallback(error)) return localPatch(flight, patch);
    throw error;
  }
}

export async function deactivateClientActiveFlight(flight: ActiveFlight): Promise<ActiveFlight> {
  if (flight.lifecycle !== "ACTIVE") throw new ActiveFlightClientError("invalid_lifecycle");
  if (flight.accountSubject === LOCAL_ACTIVE_FLIGHT_SUBJECT) {
    return transitionActiveFlight(flight, "PREVIOUS", new Date().toISOString());
  }

  try {
    const response = await fetch("/api/active-flight/deactivate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ aircraftId: flight.aircraftId }),
    });
    if (response.ok) return responseFlight(response);
    if (response.status === 401) {
      return transitionActiveFlight(flight, "PREVIOUS", new Date().toISOString());
    }
    throw new ActiveFlightClientError("deactivate_failed");
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      return transitionActiveFlight(flight, "PREVIOUS", new Date().toISOString());
    }
    throw error;
  }
}

export async function archiveClientActiveFlight(flight: ActiveFlight): Promise<ActiveFlight> {
  if (flight.lifecycle !== "PREVIOUS") throw new ActiveFlightClientError("invalid_lifecycle");
  if (flight.accountSubject === LOCAL_ACTIVE_FLIGHT_SUBJECT) {
    return transitionActiveFlight(flight, "ARCHIVED", new Date().toISOString());
  }

  try {
    const response = await fetch("/api/active-flight/archive", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ aircraftId: flight.aircraftId, id: flight.id }),
    });
    if (response.ok) return responseFlight(response);
    if (response.status === 401) {
      return transitionActiveFlight(flight, "ARCHIVED", new Date().toISOString());
    }
    throw new ActiveFlightClientError("archive_failed");
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      return transitionActiveFlight(flight, "ARCHIVED", new Date().toISOString());
    }
    throw error;
  }
}

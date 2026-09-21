import "server-only";

import { randomUUID } from "node:crypto";

import { sql } from "../db";
import type { ActiveFlight, ActiveFlightInput, ActiveFlightPatch } from "./types";
import { activeFlightDependencyReference } from "./validation";

type ActiveFlightRow = {
  id: string;
  aircraft_id: string;
  account_subject: string;
  lifecycle: ActiveFlight["lifecycle"];
  departure: unknown;
  destination: unknown;
  runway: unknown;
  weight: unknown;
  configuration: unknown;
  weather: unknown;
  performance_dependency: unknown;
  brief: unknown;
  created_at: string | Date;
  updated_at: string | Date;
  activated_at: string | Date;
  deactivated_at: string | Date | null;
  archived_at: string | Date | null;
};

function jsonObject<T>(value: unknown): T {
  if (value && typeof value === "object") return value as T;
  if (typeof value === "string") return JSON.parse(value) as T;
  throw new Error("Invalid Active Flight JSON field.");
}

function mapRow(row: ActiveFlightRow): ActiveFlight {
  return {
    id: row.id,
    aircraftId: row.aircraft_id,
    accountSubject: row.account_subject,
    lifecycle: row.lifecycle,
    departure: jsonObject<ActiveFlight["departure"]>(row.departure),
    destination: jsonObject<ActiveFlight["destination"]>(row.destination),
    runway: jsonObject<ActiveFlight["runway"]>(row.runway),
    weight: jsonObject<ActiveFlight["weight"]>(row.weight),
    configuration: jsonObject<ActiveFlight["configuration"]>(row.configuration),
    weather: row.weather == null ? null : jsonObject<ActiveFlight["weather"]>(row.weather),
    performanceDependency: jsonObject<ActiveFlight["performanceDependency"]>(row.performance_dependency),
    brief: row.brief == null ? null : jsonObject<ActiveFlight["brief"]>(row.brief),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    activatedAt: new Date(row.activated_at).toISOString(),
    deactivatedAt: row.deactivated_at ? new Date(row.deactivated_at).toISOString() : null,
    archivedAt: row.archived_at ? new Date(row.archived_at).toISOString() : null,
  };
}

export class ActiveFlightConflictError extends Error {
  constructor() {
    super("An ACTIVE flight already exists for this aircraft.");
    this.name = "ActiveFlightConflictError";
  }
}

export class ActiveFlightNotFoundError extends Error {
  constructor(message = "Active Flight not found for requested lifecycle.") {
    super(message);
    this.name = "ActiveFlightNotFoundError";
  }
}

/** Active Flight runtime persistence is DML-only. Schema creation belongs to database bootstrap. */
export async function createActiveFlight(
  accountSubject: string,
  input: ActiveFlightInput,
): Promise<ActiveFlight> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const dependency = { snapshotId: activeFlightDependencyReference(input) };
  const rows = await sql`WITH account_guard AS MATERIALIZED (
      SELECT pg_advisory_xact_lock(hashtextextended(${accountSubject}, 0))
    )
    INSERT INTO training_active_flights(
      id,account_subject,aircraft_id,lifecycle,departure,destination,runway,weight,
      configuration,weather,performance_dependency,brief,created_at,updated_at,
      activated_at,deactivated_at,archived_at
    )
    SELECT
      ${id},${accountSubject},${input.aircraftId},'ACTIVE',
      ${JSON.stringify(input.departure)}::jsonb,
      ${JSON.stringify(input.destination)}::jsonb,
      ${JSON.stringify(input.runway)}::jsonb,
      ${JSON.stringify(input.weight)}::jsonb,
      ${JSON.stringify(input.configuration)}::jsonb,
      NULL,
      ${JSON.stringify(dependency)}::jsonb,
      ${input.brief == null ? null : JSON.stringify(input.brief)}::jsonb,
      ${now}::timestamptz,${now}::timestamptz,${now}::timestamptz,NULL,NULL
    FROM account_guard
    WHERE NOT EXISTS (
      SELECT 1 FROM training_active_flights
      WHERE account_subject=${accountSubject}
        AND aircraft_id=${input.aircraftId}
        AND lifecycle='ACTIVE'
    )
    RETURNING *` as ActiveFlightRow[];

  const row = rows[0];
  if (!row) throw new ActiveFlightConflictError();
  return mapRow(row);
}

export async function getActiveFlight(
  accountSubject: string,
  aircraftId: string,
): Promise<ActiveFlight | null> {
  const rows = await sql`SELECT * FROM training_active_flights
    WHERE account_subject=${accountSubject}
      AND aircraft_id=${aircraftId}
      AND lifecycle='ACTIVE'
    ORDER BY activated_at DESC
    LIMIT 1` as ActiveFlightRow[];
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function updateActiveFlight(
  accountSubject: string,
  aircraftId: string,
  patch: ActiveFlightPatch,
): Promise<ActiveFlight> {
  const current = await getActiveFlight(accountSubject, aircraftId);
  if (!current) throw new ActiveFlightNotFoundError();

  const merged = {
    departure: patch.departure ?? current.departure,
    destination: patch.destination ?? current.destination,
    runway: patch.runway ?? current.runway,
    weight: patch.weight ?? current.weight,
    configuration: patch.configuration ?? current.configuration,
  };
  const dependency = { snapshotId: activeFlightDependencyReference(merged) };
  const brief = patch.brief !== undefined ? patch.brief : current.brief;

  const rows = await sql`WITH account_guard AS MATERIALIZED (
      SELECT pg_advisory_xact_lock(hashtextextended(${accountSubject}, 0))
    )
    UPDATE training_active_flights SET
      departure=${JSON.stringify(merged.departure)}::jsonb,
      destination=${JSON.stringify(merged.destination)}::jsonb,
      runway=${JSON.stringify(merged.runway)}::jsonb,
      weight=${JSON.stringify(merged.weight)}::jsonb,
      configuration=${JSON.stringify(merged.configuration)}::jsonb,
      performance_dependency=${JSON.stringify(dependency)}::jsonb,
      brief=${brief == null ? null : JSON.stringify(brief)}::jsonb,
      updated_at=NOW()
    FROM account_guard
    WHERE account_subject=${accountSubject}
      AND aircraft_id=${aircraftId}
      AND lifecycle='ACTIVE'
    RETURNING training_active_flights.*` as ActiveFlightRow[];

  if (!rows[0]) throw new ActiveFlightNotFoundError();
  return mapRow(rows[0]);
}

export async function deactivateActiveFlight(
  accountSubject: string,
  aircraftId: string,
): Promise<ActiveFlight> {
  const rows = await sql`WITH account_guard AS MATERIALIZED (
      SELECT pg_advisory_xact_lock(hashtextextended(${accountSubject}, 0))
    )
    UPDATE training_active_flights SET
      lifecycle='PREVIOUS',
      deactivated_at=NOW(),
      updated_at=NOW()
    WHERE account_subject=${accountSubject}
      AND aircraft_id=${aircraftId}
      AND lifecycle='ACTIVE'
    RETURNING *` as ActiveFlightRow[];
  if (!rows[0]) throw new ActiveFlightNotFoundError("No ACTIVE flight to deactivate.");
  return mapRow(rows[0]);
}

export async function archiveActiveFlight(
  accountSubject: string,
  aircraftId: string,
  flightId: string,
): Promise<ActiveFlight> {
  const rows = await sql`WITH account_guard AS MATERIALIZED (
      SELECT pg_advisory_xact_lock(hashtextextended(${accountSubject}, 0))
    )
    UPDATE training_active_flights SET
      lifecycle='ARCHIVED',
      archived_at=NOW(),
      updated_at=NOW()
    WHERE account_subject=${accountSubject}
      AND aircraft_id=${aircraftId}
      AND id=${flightId}
      AND lifecycle='PREVIOUS'
    RETURNING *` as ActiveFlightRow[];
  if (!rows[0]) throw new ActiveFlightNotFoundError("No PREVIOUS flight to archive.");
  return mapRow(rows[0]);
}

export async function deleteActiveFlight(
  accountSubject: string,
  aircraftId: string,
  flightId: string,
): Promise<boolean> {
  const rows = await sql`WITH account_guard AS MATERIALIZED (
      SELECT pg_advisory_xact_lock(hashtextextended(${accountSubject}, 0))
    )
    DELETE FROM training_active_flights
    USING account_guard
    WHERE account_subject=${accountSubject}
      AND aircraft_id=${aircraftId}
      AND id=${flightId}
    RETURNING training_active_flights.id` as Array<{ id: string }>;
  return Boolean(rows[0]);
}

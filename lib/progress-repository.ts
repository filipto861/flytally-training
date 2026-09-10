import "server-only";

import { sql } from "./db";
import type { PersistedTrainingProgressEvent, TrainingActivityKind } from "./progress-events";

export type AircraftLearningState = {
  readonly aircraftId: string;
  readonly lastActivityKind?: TrainingActivityKind;
  readonly lastContentId?: string;
  readonly lastActivityAt?: string;
};

export interface TrainingProgressRepository {
  listEvents(accountSubject: string, aircraftId: string): Promise<readonly PersistedTrainingProgressEvent[]>;
  appendEvents(accountSubject: string, events: readonly PersistedTrainingProgressEvent[]): Promise<void>;
  getAircraftState(accountSubject: string, aircraftId: string): Promise<AircraftLearningState>;
}

type ProgressRow = {
  event_id: string;
  aircraft_id: string;
  activity_kind: TrainingActivityKind;
  content_id: string;
  occurred_at: string | Date;
  completed: boolean;
  score_percent: number | string | null;
  weak_areas: unknown;
};

function weakAreas(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []; } catch { return []; }
  }
  return [];
}

function latestEventsByAircraft(events: readonly PersistedTrainingProgressEvent[]): PersistedTrainingProgressEvent[] {
  const latest = new Map<string, PersistedTrainingProgressEvent>();
  for (const event of events) {
    const current = latest.get(event.aircraftId);
    if (!current || event.occurredAt > current.occurredAt) latest.set(event.aircraftId, event);
  }
  return [...latest.values()];
}

export class PostgresTrainingProgressRepository implements TrainingProgressRepository {
  /** Runtime progress access is deliberately DML-only. Schema provisioning belongs to admin/deployment bootstrap. */
  async listEvents(accountSubject: string, aircraftId: string): Promise<readonly PersistedTrainingProgressEvent[]> {
    const rows = await sql`SELECT event_id, aircraft_id, activity_kind, content_id, occurred_at, completed, score_percent, weak_areas
      FROM training_progress_events WHERE account_subject=${accountSubject} AND aircraft_id=${aircraftId}
      ORDER BY occurred_at DESC LIMIT 1000` as ProgressRow[];
    return rows.map((row) => ({
      eventId: row.event_id,
      aircraftId: row.aircraft_id,
      kind: row.activity_kind,
      contentId: row.content_id,
      occurredAt: new Date(row.occurred_at).toISOString(),
      completed: Boolean(row.completed),
      scorePercent: row.score_percent == null ? undefined : Number(row.score_percent),
      weakAreas: weakAreas(row.weak_areas),
    }));
  }

  async appendEvents(accountSubject: string, events: readonly PersistedTrainingProgressEvent[]): Promise<void> {
    if (!events.length) return;

    const eventRows = JSON.stringify(events.map((event) => ({
      event_id: event.eventId,
      aircraft_id: event.aircraftId,
      activity_kind: event.kind,
      content_id: event.contentId,
      occurred_at: event.occurredAt,
      completed: event.completed,
      score_percent: event.scorePercent ?? null,
      weak_areas: event.weakAreas ?? [],
    })));

    await sql`INSERT INTO training_progress_events(account_subject,event_id,aircraft_id,activity_kind,content_id,occurred_at,completed,score_percent,weak_areas)
      SELECT ${accountSubject},x.event_id,x.aircraft_id,x.activity_kind,x.content_id,x.occurred_at::timestamptz,x.completed,x.score_percent::smallint,COALESCE(x.weak_areas,'[]'::jsonb)
      FROM jsonb_to_recordset(${eventRows}::jsonb) AS x(
        event_id text,
        aircraft_id text,
        activity_kind text,
        content_id text,
        occurred_at text,
        completed boolean,
        score_percent integer,
        weak_areas jsonb
      )
      ON CONFLICT(account_subject,event_id) DO NOTHING`;

    const stateRows = JSON.stringify(latestEventsByAircraft(events).map((event) => ({
      aircraft_id: event.aircraftId,
      last_activity_kind: event.kind,
      last_content_id: event.contentId,
      last_activity_at: event.occurredAt,
    })));

    await sql`INSERT INTO training_aircraft_state(account_subject,aircraft_id,last_activity_kind,last_content_id,last_activity_at)
      SELECT ${accountSubject},x.aircraft_id,x.last_activity_kind,x.last_content_id,x.last_activity_at::timestamptz
      FROM jsonb_to_recordset(${stateRows}::jsonb) AS x(
        aircraft_id text,
        last_activity_kind text,
        last_content_id text,
        last_activity_at text
      )
      ON CONFLICT(account_subject,aircraft_id) DO UPDATE SET
        last_activity_kind=CASE WHEN EXCLUDED.last_activity_at >= COALESCE(training_aircraft_state.last_activity_at, '-infinity'::timestamptz) THEN EXCLUDED.last_activity_kind ELSE training_aircraft_state.last_activity_kind END,
        last_content_id=CASE WHEN EXCLUDED.last_activity_at >= COALESCE(training_aircraft_state.last_activity_at, '-infinity'::timestamptz) THEN EXCLUDED.last_content_id ELSE training_aircraft_state.last_content_id END,
        last_activity_at=GREATEST(COALESCE(training_aircraft_state.last_activity_at, '-infinity'::timestamptz), EXCLUDED.last_activity_at),
        updated_at=NOW()`;
  }

  async getAircraftState(accountSubject: string, aircraftId: string): Promise<AircraftLearningState> {
    const rows = await sql`SELECT aircraft_id,last_activity_kind,last_content_id,last_activity_at FROM training_aircraft_state WHERE account_subject=${accountSubject} AND aircraft_id=${aircraftId} LIMIT 1` as Array<{aircraft_id:string;last_activity_kind:TrainingActivityKind|null;last_content_id:string|null;last_activity_at:string|Date|null}>;
    const row = rows[0];
    return row ? {
      aircraftId: row.aircraft_id,
      lastActivityKind: row.last_activity_kind ?? undefined,
      lastContentId: row.last_content_id ?? undefined,
      lastActivityAt: row.last_activity_at ? new Date(row.last_activity_at).toISOString() : undefined,
    } : { aircraftId };
  }
}

let repository: TrainingProgressRepository | undefined;
export function getTrainingProgressRepository(): TrainingProgressRepository {
  return repository ??= new PostgresTrainingProgressRepository();
}

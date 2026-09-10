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

let schemaReady: Promise<void> | undefined;

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS training_progress_events (
        id BIGSERIAL PRIMARY KEY,
        account_subject TEXT NOT NULL,
        event_id TEXT NOT NULL,
        aircraft_id TEXT NOT NULL,
        activity_kind TEXT NOT NULL,
        content_id TEXT NOT NULL,
        occurred_at TIMESTAMPTZ NOT NULL,
        completed BOOLEAN NOT NULL,
        score_percent SMALLINT NULL,
        weak_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(account_subject, event_id)
      )`;
      await sql`CREATE INDEX IF NOT EXISTS idx_training_progress_subject_aircraft_time ON training_progress_events(account_subject, aircraft_id, occurred_at DESC)`;
      await sql`CREATE TABLE IF NOT EXISTS training_aircraft_state (
        account_subject TEXT NOT NULL,
        aircraft_id TEXT NOT NULL,
        last_activity_kind TEXT NULL,
        last_content_id TEXT NULL,
        last_activity_at TIMESTAMPTZ NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY(account_subject, aircraft_id)
      )`;
    })().catch((error) => { schemaReady = undefined; throw error; });
  }
  return schemaReady;
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

export class PostgresTrainingProgressRepository implements TrainingProgressRepository {
  async listEvents(accountSubject: string, aircraftId: string): Promise<readonly PersistedTrainingProgressEvent[]> {
    await ensureSchema();
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
    await ensureSchema();
    for (const event of events) {
      await sql`INSERT INTO training_progress_events(account_subject,event_id,aircraft_id,activity_kind,content_id,occurred_at,completed,score_percent,weak_areas)
        VALUES(${accountSubject},${event.eventId},${event.aircraftId},${event.kind},${event.contentId},${event.occurredAt},${event.completed},${event.scorePercent ?? null},${JSON.stringify(event.weakAreas ?? [])}::jsonb)
        ON CONFLICT(account_subject,event_id) DO NOTHING`;
    }
    const latest = [...events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
    await sql`INSERT INTO training_aircraft_state(account_subject,aircraft_id,last_activity_kind,last_content_id,last_activity_at)
      VALUES(${accountSubject},${latest.aircraftId},${latest.kind},${latest.contentId},${latest.occurredAt})
      ON CONFLICT(account_subject,aircraft_id) DO UPDATE SET
        last_activity_kind=CASE WHEN EXCLUDED.last_activity_at >= COALESCE(training_aircraft_state.last_activity_at, '-infinity'::timestamptz) THEN EXCLUDED.last_activity_kind ELSE training_aircraft_state.last_activity_kind END,
        last_content_id=CASE WHEN EXCLUDED.last_activity_at >= COALESCE(training_aircraft_state.last_activity_at, '-infinity'::timestamptz) THEN EXCLUDED.last_content_id ELSE training_aircraft_state.last_content_id END,
        last_activity_at=GREATEST(COALESCE(training_aircraft_state.last_activity_at, '-infinity'::timestamptz), EXCLUDED.last_activity_at),
        updated_at=NOW()`;
  }

  async getAircraftState(accountSubject: string, aircraftId: string): Promise<AircraftLearningState> {
    await ensureSchema();
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

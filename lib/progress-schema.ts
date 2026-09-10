import "server-only";

import { sql } from "./db";

let progressSchemaReady: Promise<void> | undefined;

/**
 * Provision Training-owned progress tables from an explicit administration or
 * deployment bootstrap path. Learner progress requests must never run DDL.
 */
export async function ensureTrainingProgressSchema(): Promise<void> {
  if (!progressSchemaReady) {
    progressSchemaReady = (async () => {
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
      await sql`CREATE INDEX IF NOT EXISTS idx_training_progress_subject_aircraft_time
        ON training_progress_events(account_subject, aircraft_id, occurred_at DESC)`;
      await sql`CREATE TABLE IF NOT EXISTS training_aircraft_state (
        account_subject TEXT NOT NULL,
        aircraft_id TEXT NOT NULL,
        last_activity_kind TEXT NULL,
        last_content_id TEXT NULL,
        last_activity_at TIMESTAMPTZ NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY(account_subject, aircraft_id)
      )`;
    })().catch((error) => {
      progressSchemaReady = undefined;
      throw error;
    });
  }
  return progressSchemaReady;
}

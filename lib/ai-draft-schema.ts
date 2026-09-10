import "server-only";

import { ensureContentSchema } from "./content-admin-repository";
import { sql } from "./db";

let aiDraftSchemaReady: Promise<void> | undefined;

/**
 * Provision AI-draft audit persistence only from the explicit admin/bootstrap
 * schema path. Ordinary authoring requests never execute DDL.
 */
export async function ensureTrainingAiDraftSchema(): Promise<void> {
  if (!aiDraftSchemaReady) {
    aiDraftSchemaReady = (async () => {
      await ensureContentSchema();
      await sql`CREATE TABLE IF NOT EXISTS training_ai_draft_runs (
        run_id TEXT PRIMARY KEY,
        version_id TEXT NOT NULL REFERENCES training_content_versions(version_id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        provider_response_id TEXT NULL,
        source_text_sha256 TEXT NOT NULL,
        source_text_chars INTEGER NOT NULL,
        source_reference_ids JSONB NOT NULL,
        warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_by TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK(source_text_chars >= 0)
      )`;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_training_ai_draft_runs_version ON training_ai_draft_runs(version_id)`;
    })().catch((error) => { aiDraftSchemaReady = undefined; throw error; });
  }
  return aiDraftSchemaReady;
}

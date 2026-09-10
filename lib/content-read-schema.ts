import "server-only";

import { sql } from "./db";

let readSchemaReady: Promise<void> | undefined;

/**
 * Minimal neutral schema required by the learner-facing PostgreSQL content reader.
 *
 * This module intentionally imports neither the admin repository nor the static
 * bootstrap seed. The write/admin side may add governance tables, but learner
 * reads depend only on these stable published-content records.
 */
export async function ensureContentReadSchema(): Promise<void> {
  if (!readSchemaReady) {
    readSchemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS training_aircraft_types (
        aircraft_id TEXT PRIMARY KEY,
        manufacturer TEXT NOT NULL,
        model TEXT NOT NULL,
        display_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK(status IN ('draft','published'))
      )`;
      await sql`CREATE TABLE IF NOT EXISTS training_aircraft_variants (
        aircraft_id TEXT NOT NULL REFERENCES training_aircraft_types(aircraft_id) ON DELETE CASCADE,
        variant_key TEXT NOT NULL,
        display_name TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY(aircraft_id,variant_key)
      )`;
      await sql`CREATE TABLE IF NOT EXISTS training_manuals (
        manual_id TEXT PRIMARY KEY,
        aircraft_id TEXT NOT NULL REFERENCES training_aircraft_types(aircraft_id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        publisher TEXT NOT NULL,
        source_kind TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS training_manual_revisions (
        revision_id TEXT PRIMARY KEY,
        manual_id TEXT NOT NULL REFERENCES training_manuals(manual_id) ON DELETE CASCADE,
        revision_code TEXT NOT NULL,
        issue_date TEXT NOT NULL,
        authority_note TEXT NOT NULL DEFAULT '',
        source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        chapters JSONB NOT NULL DEFAULT '[]'::jsonb,
        source_uri TEXT NULL,
        checksum_sha256 TEXT NULL,
        registered_by TEXT NOT NULL,
        registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(manual_id,revision_code)
      )`;
      await sql`CREATE TABLE IF NOT EXISTS training_content_items (
        item_id BIGSERIAL PRIMARY KEY,
        aircraft_id TEXT NOT NULL REFERENCES training_aircraft_types(aircraft_id) ON DELETE CASCADE,
        domain TEXT NOT NULL,
        content_key TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(aircraft_id,domain,content_key)
      )`;
      await sql`CREATE TABLE IF NOT EXISTS training_content_versions (
        version_id TEXT PRIMARY KEY,
        item_id BIGINT NOT NULL REFERENCES training_content_items(item_id) ON DELETE CASCADE,
        version_no INTEGER NOT NULL,
        state TEXT NOT NULL DEFAULT 'draft',
        origin TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_by TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(item_id,version_no),
        CHECK(state IN ('draft','approved','published','stale','archived'))
      )`;
      await sql`CREATE TABLE IF NOT EXISTS training_content_publications (
        item_id BIGINT PRIMARY KEY REFERENCES training_content_items(item_id) ON DELETE CASCADE,
        version_id TEXT NOT NULL REFERENCES training_content_versions(version_id) ON DELETE RESTRICT,
        published_by TEXT NOT NULL,
        published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`CREATE INDEX IF NOT EXISTS idx_training_content_items_aircraft ON training_content_items(aircraft_id,domain)`;
    })().catch((error) => {
      readSchemaReady = undefined;
      throw error;
    });
  }
  return readSchemaReady;
}

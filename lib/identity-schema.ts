import "server-only";

import { sql } from "./db";

let identitySchemaReady: Promise<void> | undefined;

/**
 * Provision the Training-owned one-time assertion ledger from an explicit
 * administration/deployment bootstrap path. Authentication callbacks only
 * consume rows and must never execute schema DDL.
 */
export async function ensureTrainingIdentitySchema(): Promise<void> {
  if (!identitySchemaReady) {
    identitySchemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS training_identity_assertions (
        jti TEXT PRIMARY KEY,
        expires_at TIMESTAMPTZ NOT NULL,
        consumed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`CREATE INDEX IF NOT EXISTS idx_training_identity_assertions_expires_at
        ON training_identity_assertions(expires_at)`;
    })().catch((error) => {
      identitySchemaReady = undefined;
      throw error;
    });
  }
  return identitySchemaReady;
}

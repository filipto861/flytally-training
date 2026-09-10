import "server-only";

import { sql } from "./db";

const authorityConstraintName = "training_manual_revisions_authority_role_check";

/**
 * Upgrade pre-M9 Training databases to the closed source-authority taxonomy.
 * This runs only from the explicit database bootstrap path, never learner reads.
 */
export async function ensureSourceAuthoritySchema(): Promise<void> {
  await sql`ALTER TABLE training_manual_revisions
    ADD COLUMN IF NOT EXISTS authority_role TEXT NOT NULL DEFAULT 'UNCLASSIFIED'`;

  await sql`DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'training_manual_revisions_authority_role_check'
        AND conrelid = 'training_manual_revisions'::regclass
    ) THEN
      ALTER TABLE training_manual_revisions
        ADD CONSTRAINT training_manual_revisions_authority_role_check
        CHECK(authority_role IN (
          'CONTROLLING',
          'OPERATING_REFERENCE',
          'TRAINING_REFERENCE',
          'SIMULATOR_IMPLEMENTATION',
          'SIMULATOR_WORKFLOW',
          'UNCLASSIFIED'
        ));
    END IF;
  END $$`;

  const rows = await sql`SELECT EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema='public'
        AND table_name='training_manual_revisions'
        AND column_name='authority_role'
    ) AS has_column,
    EXISTS(
      SELECT 1
      FROM pg_constraint
      WHERE conname=${authorityConstraintName}
        AND conrelid='training_manual_revisions'::regclass
    ) AS has_constraint` as unknown as Array<{has_column:boolean;has_constraint:boolean}>;

  if (!rows[0]?.has_column || !rows[0]?.has_constraint) {
    throw new Error("Training source-authority schema upgrade incomplete.");
  }
}

import "server-only";

import { ensureTrainingAiDraftSchema } from "./ai-draft-schema";
import { ensureTrainingActiveFlightSchema } from "./active-flight/schema";
import { ensureContentSchema } from "./content-admin-repository";
import { sql } from "./db";
import { ensureTrainingIdentitySchema } from "./identity-schema";
import { ensureTrainingProgressSchema } from "./progress-schema";
import { ensureSourceAuthoritySchema } from "./source-authority-schema";

export const trainingDatabaseTables = [
  "training_aircraft_types",
  "training_aircraft_variants",
  "training_manuals",
  "training_manual_revisions",
  "training_source_references",
  "training_content_items",
  "training_content_versions",
  "training_content_version_sources",
  "training_content_approvals",
  "training_content_publications",
  "training_content_stale_flags",
  "training_progress_events",
  "training_aircraft_state",
  "training_identity_assertions",
  "training_ai_draft_runs",
  "training_active_flights",
] as const;

/**
 * Provision every active Training-owned persistence boundary before the first
 * runtime request. Source documents are intentionally not a persistence
 * boundary: M31 stores source records and provenance only.
 */
export async function initializeTrainingDatabase(): Promise<void> {
  await ensureContentSchema();
  await ensureSourceAuthoritySchema();
  await Promise.all([
    ensureTrainingProgressSchema(),
    ensureTrainingIdentitySchema(),
    ensureTrainingAiDraftSchema(),
    ensureTrainingActiveFlightSchema(),
  ]);
  await verifyTrainingDatabaseSchema();
}

export async function verifyTrainingDatabaseSchema(): Promise<void> {
  const checks = await Promise.all(trainingDatabaseTables.map(async table => {
    const rows = await sql`SELECT to_regclass(${`public.${table}`})::text AS relation` as unknown as Array<{relation:string|null}>;
    return { table, present: Boolean(rows[0]?.relation) };
  }));
  const missing = checks.filter(check => !check.present).map(check => check.table);
  if (missing.length) throw new Error(`Training database bootstrap incomplete; missing relations: ${missing.join(", ")}`);
}

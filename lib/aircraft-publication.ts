import "server-only";

import { sql } from "./db";

function aircraftId(value: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > 128 || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(normalized)) {
    throw new Error("Invalid aircraft id.");
  }
  return normalized;
}

/**
 * Expose an aircraft in the learner catalogue once it has at least one
 * governed, currently published training bundle, at least one immutable manual
 * revision and no unresolved stale-source review on its effective training
 * bundles. M9 deliberately does not require one fixed curriculum: the module
 * set belongs to the aircraft data, not to application code.
 *
 * The legacy cockpit-orientation domain is intentionally excluded from the
 * minimum training-content requirement while that visual module is deferred.
 * Controlled-Blob availability remains the stricter production-readiness gate
 * and is intentionally checked separately.
 */
export async function publishGovernedAircraft(value: string): Promise<void> {
  const id = aircraftId(value);
  const rows = await sql`WITH eligibility AS (
      SELECT a.aircraft_id,
        EXISTS(
          SELECT 1
          FROM training_manuals m
          JOIN training_manual_revisions r ON r.manual_id=m.manual_id
          WHERE m.aircraft_id=a.aircraft_id
        ) AS has_manual,
        EXISTS(
          SELECT 1
          FROM training_content_items i
          JOIN training_content_publications p ON p.item_id=i.item_id
          WHERE i.aircraft_id=a.aircraft_id
            AND i.content_key='bundle'
            AND i.domain<>'orientation'
        ) AS has_training_content,
        NOT EXISTS(
          SELECT 1
          FROM training_content_publications p
          JOIN training_content_items i ON i.item_id=p.item_id
          JOIN training_content_stale_flags sf ON sf.version_id=p.version_id
          WHERE i.aircraft_id=a.aircraft_id
            AND i.content_key='bundle'
            AND i.domain<>'orientation'
            AND sf.resolved_at IS NULL
        ) AS current_content_fresh
      FROM training_aircraft_types a
      WHERE a.aircraft_id=${id}
    )
    UPDATE training_aircraft_types a
    SET status='published',updated_at=NOW()
    FROM eligibility e
    WHERE a.aircraft_id=e.aircraft_id
      AND e.has_manual
      AND e.has_training_content
      AND e.current_content_fresh
    RETURNING a.aircraft_id` as Array<{aircraft_id:string}>;

  if (!rows[0]) {
    throw new Error("Aircraft cannot be published until it has a manual revision, at least one governed training bundle is published and current published training content has no unresolved stale-source review.");
  }
}

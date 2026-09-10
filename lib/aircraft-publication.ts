import "server-only";

import { trainingContentDomains } from "./content-admin-types";
import { sql } from "./db";

function aircraftId(value: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > 128 || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(normalized)) {
    throw new Error("Invalid aircraft id.");
  }
  return normalized;
}

/**
 * Expose an aircraft in the learner catalogue only after every canonical v1
 * content domain has a current published bundle and at least one immutable
 * manual revision exists. Controlled-Blob availability remains the stricter
 * production-readiness gate and is intentionally checked separately.
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
        (
          SELECT COUNT(DISTINCT i.domain)::int
          FROM training_content_items i
          JOIN training_content_publications p ON p.item_id=i.item_id
          WHERE i.aircraft_id=a.aircraft_id
            AND i.content_key='bundle'
            AND i.domain IN ('learning','normal-flight','orientation','abnormal','reference-knowledge')
        ) AS published_domains
      FROM training_aircraft_types a
      WHERE a.aircraft_id=${id}
    )
    UPDATE training_aircraft_types a
    SET status='published',updated_at=NOW()
    FROM eligibility e
    WHERE a.aircraft_id=e.aircraft_id
      AND e.has_manual
      AND e.published_domains=${trainingContentDomains.length}
    RETURNING a.aircraft_id` as Array<{aircraft_id:string}>;

  if (!rows[0]) {
    throw new Error("Aircraft cannot be published until it has a manual revision and all canonical learner bundles are published.");
  }
}

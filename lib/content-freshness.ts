import "server-only";

import { sql } from "./db";

/**
 * Published training content is current only when none of its effective
 * versions has an unresolved stale flag caused by a newer controlled/manual
 * revision. M9 applies this to whatever training modules the aircraft actually
 * publishes rather than to a hard-coded aircraft curriculum.
 *
 * The deferred legacy cockpit-orientation domain is not a release blocker.
 * Historical stale flags on versions that are no longer published do not block
 * readiness.
 */
export async function hasFreshCurrentPublishedContent(aircraftId: string): Promise<boolean> {
  const rows = await sql`SELECT NOT EXISTS(
      SELECT 1
      FROM training_content_publications p
      JOIN training_content_items i ON i.item_id=p.item_id
      JOIN training_content_stale_flags sf ON sf.version_id=p.version_id
      WHERE i.aircraft_id=${aircraftId}
        AND i.content_key='bundle'
        AND i.domain<>'orientation'
        AND sf.resolved_at IS NULL
    ) AS fresh` as Array<{fresh:boolean}>;
  return rows[0]?.fresh === true;
}

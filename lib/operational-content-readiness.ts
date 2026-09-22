import "server-only";

import { sql } from "./db";
import { browserTrainingAircraftId,browserTrainingFixtureEnabled } from "./browser-training-fixture";

export const operationalFlightDomains = ["checklists", "performance", "abnormal"] as const;
export type OperationalFlightDomain = typeof operationalFlightDomains[number];

export type OperationalModuleReadiness = Readonly<{
  published: boolean;
  fresh: boolean;
  sourceAuthoritative: boolean;
  ready: boolean;
}>;

type ReadinessRow = {
  readonly domain: OperationalFlightDomain;
  readonly fresh: boolean;
  readonly linked_source_count: number | string;
  readonly authoritative_source_count: number | string;
};

function unavailable(): OperationalModuleReadiness {
  return { published:false, fresh:false, sourceAuthoritative:false, ready:false };
}

/**
 * Flight Deck is deliberately stricter than general training access. A module
 * is operationally readable only when its current publication is fresh and
 * every linked source resolves to this aircraft with CONTROLLING or
 * OPERATING_REFERENCE authority. Database or governance ambiguity fails closed.
 */
export async function getOperationalFlightReadiness(
  aircraftId: string,
): Promise<Record<OperationalFlightDomain, OperationalModuleReadiness>> {
  const result: Record<OperationalFlightDomain, OperationalModuleReadiness> = {
    checklists: unavailable(),
    performance: unavailable(),
    abnormal: unavailable(),
  };
  if(browserTrainingFixtureEnabled()&&aircraftId===browserTrainingAircraftId){
    const ready={published:true,fresh:true,sourceAuthoritative:true,ready:true} as const;
    return{checklists:ready,performance:ready,abnormal:ready};
  }
  if (process.env.TRAINING_CONTENT_BACKEND?.trim() !== "postgres") return result;

  try {
    const rows = await sql`SELECT i.domain,
      NOT EXISTS(
        SELECT 1
        FROM training_content_stale_flags sf
        WHERE sf.version_id=p.version_id
          AND sf.resolved_at IS NULL
      ) AS fresh,
      (
        SELECT COUNT(*)::int
        FROM training_content_version_sources cvs
        WHERE cvs.version_id=p.version_id
      ) AS linked_source_count,
      (
        SELECT COUNT(*)::int
        FROM training_content_version_sources cvs
        JOIN training_source_references sr ON sr.reference_id=cvs.reference_id
        JOIN training_manual_revisions r ON r.revision_id=sr.revision_id
        JOIN training_manuals m ON m.manual_id=r.manual_id
        WHERE cvs.version_id=p.version_id
          AND m.aircraft_id=i.aircraft_id
          AND r.authority_role IN ('CONTROLLING','OPERATING_REFERENCE')
      ) AS authoritative_source_count
    FROM training_content_items i
    JOIN training_content_publications p ON p.item_id=i.item_id
    JOIN training_aircraft_types a ON a.aircraft_id=i.aircraft_id
    WHERE i.aircraft_id=${aircraftId}
      AND i.content_key='bundle'
      AND i.domain IN ('checklists','performance','abnormal')
      AND a.status='published'` as ReadinessRow[];

    for (const row of rows) {
      if (!(operationalFlightDomains as readonly string[]).includes(row.domain)) continue;
      const linked=Number(row.linked_source_count);
      const authoritative=Number(row.authoritative_source_count);
      const sourceAuthoritative=linked>0 && authoritative===linked;
      result[row.domain]={
        published:true,
        fresh:row.fresh===true,
        sourceAuthoritative,
        ready:row.fresh===true && sourceAuthoritative,
      };
    }
  } catch {
    // Flight Deck safety boundary fails closed on database/governance ambiguity.
  }
  return result;
}

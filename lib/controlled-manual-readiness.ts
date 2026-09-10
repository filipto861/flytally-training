import "server-only";

import { head } from "@vercel/blob";
import { controlledManualMetadataMatches, type ControlledManualExpectedMetadata } from "./controlled-manual-metadata";
import { sql } from "./db";

type ControlledManualRow = ControlledManualExpectedMetadata & {
  readonly finalized_at: string | Date | null;
};

/**
 * Proves that a complete aircraft's currently published learner content is
 * backed by at least one server-verified controlled PDF that still exists in
 * private Blob storage. Finalization already established SHA-256 integrity;
 * readiness performs only a lightweight HEAD probe and metadata comparison.
 */
export async function hasAvailablePublishedControlledManual(aircraftId: string): Promise<boolean> {
  const candidates = await sql`SELECT DISTINCT a.pathname,a.size_bytes,a.content_type,a.finalized_at
    FROM training_manual_assets a
    JOIN training_manual_revisions r ON r.revision_id=a.attached_revision_id
    JOIN training_manuals m ON m.manual_id=r.manual_id
    JOIN training_source_references sr ON sr.revision_id=r.revision_id
    JOIN training_content_version_sources cvs ON cvs.reference_id=sr.reference_id
    JOIN training_content_publications p ON p.version_id=cvs.version_id
    JOIN training_content_items ci ON ci.item_id=p.item_id AND ci.aircraft_id=m.aircraft_id
    WHERE m.aircraft_id=${aircraftId}
      AND a.aircraft_id=${aircraftId}
      AND a.status='attached'
      AND a.blob_url IS NOT NULL
    ORDER BY a.finalized_at DESC NULLS LAST
    LIMIT 3` as ControlledManualRow[];

  for (const candidate of candidates) {
    try {
      const blob = await head(candidate.pathname);
      if (controlledManualMetadataMatches(candidate, blob)) return true;
    } catch {
      // Try another currently published controlled source if one exists. A
      // missing object, invalid Blob credential or storage outage keeps the
      // deployment not-ready rather than weakening the source chain.
    }
  }
  return false;
}

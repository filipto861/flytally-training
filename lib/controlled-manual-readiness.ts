import "server-only";

import { head } from "@vercel/blob";
import type { TrainingContentDomain } from "./content-admin-types";
import { controlledManualMetadataMatches, type ControlledManualExpectedMetadata } from "./controlled-manual-metadata";
import { sql } from "./db";

type ControlledManualCandidate = ControlledManualExpectedMetadata & {
  readonly domain: TrainingContentDomain;
  readonly finalized_at: string | Date | null;
};

type PublishedDomainRow = { readonly domain: TrainingContentDomain };

/**
 * Proves that every effective training module currently published for an
 * aircraft has at least one source reference backed by a server-verified,
 * attached controlled PDF that still exists in private Blob storage.
 *
 * M9 intentionally derives the required domain set from the aircraft's current
 * publications. Adding a new product domain therefore does not make unrelated
 * aircraft incomplete. The deferred legacy cockpit-orientation domain is not a
 * release requirement.
 *
 * Finalization already established PDF signature, byte-count and SHA-256
 * integrity. Readiness therefore performs only lightweight HEAD probes. Up to
 * three distinct controlled assets are considered per domain so a stale object
 * cannot hide another valid source for the same published module.
 */
export async function hasCompletePublishedControlledManualCoverage(aircraftId: string): Promise<boolean> {
  const [publishedRows, candidates] = await Promise.all([
    sql`SELECT DISTINCT ci.domain
      FROM training_content_items ci
      JOIN training_content_publications p ON p.item_id=ci.item_id
      WHERE ci.aircraft_id=${aircraftId}
        AND ci.content_key='bundle'
        AND ci.domain<>'orientation'
      ORDER BY ci.domain` as Promise<PublishedDomainRow[]>,
    sql`WITH eligible AS (
      SELECT DISTINCT ci.domain,a.pathname,a.size_bytes,a.content_type,a.finalized_at
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
        AND ci.content_key='bundle'
        AND ci.domain<>'orientation'
    ), ranked AS (
      SELECT domain,pathname,size_bytes,content_type,finalized_at,
        ROW_NUMBER() OVER (PARTITION BY domain ORDER BY finalized_at DESC NULLS LAST,pathname) AS candidate_rank
      FROM eligible
    )
    SELECT domain,pathname,size_bytes,content_type,finalized_at
    FROM ranked
    WHERE candidate_rank<=3
    ORDER BY domain,finalized_at DESC NULLS LAST` as Promise<ControlledManualCandidate[]>,
  ]);

  const requiredDomains = new Set<TrainingContentDomain>(publishedRows.map(row => row.domain));
  if (requiredDomains.size === 0) return false;

  const covered = new Set<TrainingContentDomain>();
  const availability = new Map<string, boolean>();

  for (const candidate of candidates) {
    if (!requiredDomains.has(candidate.domain) || covered.has(candidate.domain)) continue;

    let valid = availability.get(candidate.pathname);
    if (valid === undefined) {
      try {
        const blob = await head(candidate.pathname);
        valid = controlledManualMetadataMatches(candidate, blob);
      } catch {
        valid = false;
      }
      availability.set(candidate.pathname, valid);
    }

    if (valid) covered.add(candidate.domain);
  }

  return [...requiredDomains].every(domain => covered.has(domain));
}

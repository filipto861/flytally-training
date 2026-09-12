import "server-only";

import { sql } from "./db";
import { assertValidContentPayload, validateContentPayload } from "./content-contracts";
import type { TrainingContentDomain } from "./content-admin-types";
import { collectEmbeddedManualIds } from "./content-source-binding";
import { assertApplicabilityVariantsRegistered } from "./content-applicability-binding";

export type ContentVersionReviewRecord = {
  readonly id: string;
  readonly aircraftId: string;
  readonly domain: TrainingContentDomain;
  readonly contentKey: string;
  readonly versionNo: number;
  readonly state: string;
  readonly origin: string;
  readonly payload: unknown;
  readonly sourceReferenceIds: readonly string[];
  readonly validationErrors: readonly string[];
};

function json(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return value; }
}

export async function getContentVersionForReview(versionId: string): Promise<ContentVersionReviewRecord | undefined> {
  const rows = await sql`SELECT v.version_id,v.version_no,v.state,v.origin,v.payload,i.aircraft_id,i.domain,i.content_key,
    COALESCE(json_agg(cvs.reference_id) FILTER (WHERE cvs.reference_id IS NOT NULL),'[]'::json) source_ids
    FROM training_content_versions v JOIN training_content_items i ON i.item_id=v.item_id
    LEFT JOIN training_content_version_sources cvs ON cvs.version_id=v.version_id
    WHERE v.version_id=${versionId}
    GROUP BY v.version_id,v.version_no,v.state,v.origin,v.payload,i.aircraft_id,i.domain,i.content_key LIMIT 1` as Array<{version_id:string;version_no:number|string;state:string;origin:string;payload:unknown;aircraft_id:string;domain:TrainingContentDomain;content_key:string;source_ids:unknown}>;
  const row = rows[0];
  if (!row) return undefined;
  const payload = json(row.payload);
  const sourceReferenceIds = Array.isArray(row.source_ids) ? row.source_ids.filter((id): id is string => typeof id === "string") : [];
  return {
    id: row.version_id,
    aircraftId: row.aircraft_id,
    domain: row.domain,
    contentKey: row.content_key,
    versionNo: Number(row.version_no),
    state: row.state,
    origin: row.origin,
    payload,
    sourceReferenceIds,
    validationErrors: validateContentPayload(row.domain, payload, row.aircraft_id),
  };
}

export async function assertSourceReferencesBelongToAircraft(aircraftId: string, referenceIds: readonly string[]): Promise<void> {
  const unique = [...new Set(referenceIds.filter(Boolean))];
  if (!unique.length) throw new Error("At least one source reference is required.");
  const rows = await sql`SELECT sr.reference_id FROM training_source_references sr
    JOIN training_manual_revisions r ON r.revision_id=sr.revision_id
    JOIN training_manuals m ON m.manual_id=r.manual_id
    WHERE m.aircraft_id=${aircraftId}` as Array<{reference_id:string}>;
  const allowed = new Set(rows.map((row) => row.reference_id));
  const invalid = unique.filter((id) => !allowed.has(id));
  if (invalid.length) throw new Error(`Source references do not belong to aircraft ${aircraftId}: ${invalid.join(", ")}`);
}

/**
 * Native M9 payloads carry manualId at claim/item level. Publication therefore
 * requires the immutable version-source links to cover exactly those source
 * families. This prevents a module from being approved against an unrelated
 * reference merely because every reference belongs to the same aircraft.
 *
 * Legacy migration payloads do not yet carry manualId and retain the older
 * aircraft-scoped provenance rule until migrated.
 */
export async function assertEmbeddedSourcesMatchVersionLinks(payload: unknown, referenceIds: readonly string[]): Promise<void> {
  const embeddedManualIds = collectEmbeddedManualIds(payload);
  if (!embeddedManualIds.length) return;

  const uniqueReferences = [...new Set(referenceIds.filter(Boolean))];
  const referencesJson = JSON.stringify(uniqueReferences);
  const rows = await sql`WITH input_refs AS (
      SELECT DISTINCT value::text AS reference_id
      FROM jsonb_array_elements_text(${referencesJson}::jsonb)
    )
    SELECT DISTINCT m.manual_id
    FROM input_refs ir
    JOIN training_source_references sr ON sr.reference_id=ir.reference_id
    JOIN training_manual_revisions r ON r.revision_id=sr.revision_id
    JOIN training_manuals m ON m.manual_id=r.manual_id` as Array<{manual_id:string}>;

  const linkedManualIds = new Set(rows.map((row) => row.manual_id));
  const embedded = new Set(embeddedManualIds);
  const missing = embeddedManualIds.filter((manualId) => !linkedManualIds.has(manualId));
  const unrelated = [...linkedManualIds].filter((manualId) => !embedded.has(manualId));
  if (missing.length || unrelated.length) {
    const details = [
      missing.length ? `missing: ${missing.join(", ")}` : "",
      unrelated.length ? `unrelated: ${unrelated.join(", ")}` : "",
    ].filter(Boolean).join("; ");
    throw new Error(`Version source links do not match embedded content sources (${details}).`);
  }
}

/**
 * Applicability is part of the release contract, not just a learner-side
 * filter. A typo in a variant key would otherwise validate structurally but
 * silently hide the content at runtime. Approval and publication therefore
 * fail closed when payload applicability names an unregistered variant.
 */
export async function assertEmbeddedApplicabilityMatchesAircraft(aircraftId: string, payload: unknown): Promise<void> {
  const rows = await sql`SELECT variant_key FROM training_aircraft_variants WHERE aircraft_id=${aircraftId}` as Array<{variant_key:string}>;
  assertApplicabilityVariantsRegistered(payload, rows.map((row) => row.variant_key), aircraftId);
}

export async function assertContentVersionValidForApprovalOrPublication(versionId: string): Promise<ContentVersionReviewRecord> {
  const version = await getContentVersionForReview(versionId);
  if (!version) throw new Error("Content version not found.");
  assertValidContentPayload(version.domain, version.payload, version.aircraftId);
  await assertEmbeddedApplicabilityMatchesAircraft(version.aircraftId, version.payload);
  await assertSourceReferencesBelongToAircraft(version.aircraftId, version.sourceReferenceIds);
  await assertEmbeddedSourcesMatchVersionLinks(version.payload, version.sourceReferenceIds);
  return version;
}

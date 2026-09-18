import "server-only";

import { sql } from "./db";
import { assertValidContentPayload, validateContentPayload } from "./content-contracts";
import type { TrainingContentDomain } from "./content-admin-types";
import { collectEmbeddedManualIds } from "./content-source-binding";
import { isOperationalSourceAuthority, requiresOperationalSourceAuthority } from "./source-authority";
import {
  assertApplicabilityEquipmentRegistered,
  assertApplicabilityVariantsRegistered,
} from "./content-applicability-binding";

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

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) : [];
}

function variantMetadata(value: unknown): Record<string, unknown> {
  const parsed = json(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
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

export async function assertOperationalSourceAuthorityForVersion(
  domain: TrainingContentDomain,
  referenceIds: readonly string[],
): Promise<void> {
  if (!requiresOperationalSourceAuthority(domain)) return;
  const unique = [...new Set(referenceIds.filter(Boolean))];
  const referencesJson = JSON.stringify(unique);
  const rows = await sql`WITH input_refs AS (
      SELECT DISTINCT value::text AS reference_id
      FROM jsonb_array_elements_text(${referencesJson}::jsonb)
    )
    SELECT ir.reference_id,r.authority_role
    FROM input_refs ir
    JOIN training_source_references sr ON sr.reference_id=ir.reference_id
    JOIN training_manual_revisions r ON r.revision_id=sr.revision_id` as Array<{reference_id:string;authority_role:string}>;
  const roles = new Map(rows.map((row) => [row.reference_id, row.authority_role]));
  const invalid = unique.filter((id) => !isOperationalSourceAuthority(roles.get(id) ?? ""));
  if (invalid.length) {
    throw new Error(
      `Operational ${domain} content requires CONTROLLING or OPERATING_REFERENCE source authority: ${invalid.join(", ")}`,
    );
  }
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
 * filter. Variant and equipment identifiers therefore have to exist in the
 * configured aircraft profile before a draft may be approved or published.
 */
export async function assertEmbeddedApplicabilityMatchesAircraft(aircraftId: string, payload: unknown): Promise<void> {
  const rows = await sql`SELECT variant_key,metadata FROM training_aircraft_variants WHERE aircraft_id=${aircraftId}` as Array<{variant_key:string;metadata:unknown}>;
  const equipmentTags = [...new Set(rows.flatMap((row) => stringArray(variantMetadata(row.metadata).equipmentTags)))];
  assertApplicabilityVariantsRegistered(payload, rows.map((row) => row.variant_key), aircraftId);
  assertApplicabilityEquipmentRegistered(payload, equipmentTags, aircraftId);
}

export async function assertContentVersionValidForApprovalOrPublication(versionId: string): Promise<ContentVersionReviewRecord> {
  const version = await getContentVersionForReview(versionId);
  if (!version) throw new Error("Content version not found.");
  assertValidContentPayload(version.domain,version.payload,version.aircraftId);
  await assertEmbeddedApplicabilityMatchesAircraft(version.aircraftId, version.payload);
  await assertSourceReferencesBelongToAircraft(version.aircraftId,version.sourceReferenceIds);
  await assertOperationalSourceAuthorityForVersion(version.domain, version.sourceReferenceIds);
  await assertEmbeddedSourcesMatchVersionLinks(version.payload, version.sourceReferenceIds);
  return version;
}

import "server-only";

import { sql } from "./db";

export type GovernedManualRevisionInput = {
  readonly aircraftId: string;
  readonly manualId: string;
  readonly revisionId: string;
  readonly title: string;
  readonly publisher: string;
  readonly sourceKind: string;
  readonly revision: string;
  readonly issueDate: string;
  readonly authorityNote?: string;
  readonly sourceUri?: string;
  readonly checksumSha256?: string;
  readonly sourceMetadata?: object;
  readonly chapters?: readonly unknown[];
  readonly assetId?: string;
};

const idPattern = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const assetIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sha256Pattern = /^[a-f0-9]{64}$/i;

function id(value: string, label: string): string {
  const normalized = value.trim();
  if (!idPattern.test(normalized)) throw new Error(`Invalid ${label}.`);
  return normalized;
}

function required(value: string, label: string, max = 512): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > max) throw new Error(`Invalid ${label}.`);
  return normalized;
}

function optionalChecksum(value: string | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (!normalized) return null;
  if (!sha256Pattern.test(normalized)) throw new Error("External SHA-256 checksum must contain 64 hexadecimal characters.");
  return normalized;
}

/**
 * Register an immutable manual revision as one non-interactive PostgreSQL
 * transaction. When a controlled asset is selected, claiming the verified
 * object, deriving its URI/checksum, inserting the revision, creating stale
 * flags and attaching the asset all share the same transaction boundary.
 */
export async function registerGovernedManualRevision(input: GovernedManualRevisionInput, subject: string): Promise<void> {
  const aircraftId = id(input.aircraftId, "aircraft id");
  const manualId = id(input.manualId, "manual id");
  const revisionId = id(input.revisionId, "revision id");
  const title = required(input.title, "manual title");
  const publisher = required(input.publisher, "manual publisher");
  const sourceKind = required(input.sourceKind, "source kind", 128);
  const revision = required(input.revision, "revision code", 128);
  const issueDate = required(input.issueDate, "issue date", 128);
  const authorityNote = input.authorityNote?.trim() ?? "";
  const sourceMetadata = JSON.stringify(input.sourceMetadata ?? {});
  const chapters = JSON.stringify(input.chapters ?? []);
  const assetId = input.assetId?.trim() || undefined;

  const staleReason = `New manual revision ${revision} registered`;

  if (assetId) {
    if (!assetIdPattern.test(assetId)) throw new Error("Invalid controlled manual asset id.");

    const results = await sql.transaction((txn) => [
      txn`UPDATE training_manual_assets
        SET status='claimed',claimed_by=${subject},claimed_at=NOW()
        WHERE asset_id=${assetId} AND aircraft_id=${aircraftId} AND status='ready'
          AND (
            NOT EXISTS(SELECT 1 FROM training_manuals WHERE manual_id=${manualId})
            OR EXISTS(SELECT 1 FROM training_manuals WHERE manual_id=${manualId} AND aircraft_id=${aircraftId})
          )
        RETURNING asset_id`,
      txn`INSERT INTO training_manuals(manual_id,aircraft_id,title,publisher,source_kind)
        SELECT ${manualId},${aircraftId},${title},${publisher},${sourceKind}
        WHERE EXISTS(SELECT 1 FROM training_manual_assets WHERE asset_id=${assetId} AND status='claimed' AND claimed_by=${subject})
        ON CONFLICT(manual_id) DO NOTHING
        RETURNING manual_id`,
      txn`INSERT INTO training_manual_revisions(revision_id,manual_id,revision_code,issue_date,authority_note,source_metadata,chapters,source_uri,checksum_sha256,registered_by)
        SELECT ${revisionId},${manualId},${revision},${issueDate},${authorityNote},${sourceMetadata}::jsonb,${chapters}::jsonb,a.blob_url,a.checksum_sha256,${subject}
        FROM training_manual_assets a
        JOIN training_manuals m ON m.manual_id=${manualId} AND m.aircraft_id=${aircraftId}
        WHERE a.asset_id=${assetId} AND a.aircraft_id=${aircraftId} AND a.status='claimed' AND a.claimed_by=${subject} AND a.blob_url IS NOT NULL
        RETURNING revision_id`,
      txn`INSERT INTO training_content_stale_flags(version_id,newer_revision_id,reason)
        SELECT DISTINCT p.version_id,${revisionId},${staleReason}
        FROM training_content_publications p
        JOIN training_content_version_sources cvs ON cvs.version_id=p.version_id
        JOIN training_source_references sr ON sr.reference_id=cvs.reference_id
        JOIN training_manual_revisions oldr ON oldr.revision_id=sr.revision_id
        WHERE oldr.manual_id=${manualId} AND oldr.revision_id<>${revisionId}
          AND EXISTS(SELECT 1 FROM training_manual_revisions WHERE revision_id=${revisionId})
        ON CONFLICT(version_id,newer_revision_id) DO NOTHING
        RETURNING stale_id`,
      txn`UPDATE training_manual_assets
        SET status='attached',attached_revision_id=${revisionId},claimed_by=NULL,claimed_at=NULL
        WHERE asset_id=${assetId} AND aircraft_id=${aircraftId} AND status='claimed' AND claimed_by=${subject}
          AND EXISTS(SELECT 1 FROM training_manual_revisions WHERE revision_id=${revisionId})
        RETURNING asset_id`,
    ]);

    const revisionRows = results[2] as unknown as Array<{revision_id:string}>;
    const attachmentRows = results[4] as unknown as Array<{asset_id:string}>;
    if (!revisionRows[0] || !attachmentRows[0]) {
      throw new Error("Controlled manual asset is not ready for this aircraft, or the manual family belongs to another aircraft.");
    }
    return;
  }

  const sourceUri = input.sourceUri?.trim() || null;
  const checksumSha256 = optionalChecksum(input.checksumSha256);
  const results = await sql.transaction((txn) => [
    txn`INSERT INTO training_manuals(manual_id,aircraft_id,title,publisher,source_kind)
      VALUES(${manualId},${aircraftId},${title},${publisher},${sourceKind})
      ON CONFLICT(manual_id) DO NOTHING
      RETURNING manual_id`,
    txn`INSERT INTO training_manual_revisions(revision_id,manual_id,revision_code,issue_date,authority_note,source_metadata,chapters,source_uri,checksum_sha256,registered_by)
      SELECT ${revisionId},${manualId},${revision},${issueDate},${authorityNote},${sourceMetadata}::jsonb,${chapters}::jsonb,${sourceUri},${checksumSha256},${subject}
      FROM training_manuals m
      WHERE m.manual_id=${manualId} AND m.aircraft_id=${aircraftId}
      RETURNING revision_id`,
    txn`INSERT INTO training_content_stale_flags(version_id,newer_revision_id,reason)
      SELECT DISTINCT p.version_id,${revisionId},${staleReason}
      FROM training_content_publications p
      JOIN training_content_version_sources cvs ON cvs.version_id=p.version_id
      JOIN training_source_references sr ON sr.reference_id=cvs.reference_id
      JOIN training_manual_revisions oldr ON oldr.revision_id=sr.revision_id
      WHERE oldr.manual_id=${manualId} AND oldr.revision_id<>${revisionId}
        AND EXISTS(SELECT 1 FROM training_manual_revisions WHERE revision_id=${revisionId})
      ON CONFLICT(version_id,newer_revision_id) DO NOTHING
      RETURNING stale_id`,
  ]);

  const revisionRows = results[1] as unknown as Array<{revision_id:string}>;
  if (!revisionRows[0]) throw new Error("Manual family belongs to another aircraft.");
}

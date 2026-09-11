import "server-only";

import { sql } from "./db";
import { parseSourceAuthorityRole, type SourceAuthorityRole } from "./source-authority";

export type GovernedManualRevisionInput = {
  readonly aircraftId: string;
  readonly manualId: string;
  readonly revisionId: string;
  readonly title: string;
  readonly publisher: string;
  readonly sourceKind: string;
  readonly revision: string;
  readonly issueDate: string;
  readonly authorityRole: SourceAuthorityRole;
  readonly authorityNote?: string;
  readonly sourceUri?: string;
  readonly checksumSha256?: string;
  readonly sourceMetadata?: object;
  readonly chapters?: readonly unknown[];
};

const idPattern = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
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
  if (!sha256Pattern.test(normalized)) throw new Error("Source SHA-256 fingerprint must contain 64 hexadecimal characters.");
  return normalized;
}

/**
 * Register an immutable source revision without retaining the source document.
 * Only source identity, authority, optional citation URI, metadata and an
 * optional SHA-256 fingerprint are persisted. Revision registration and stale
 * detection remain one governed PostgreSQL transaction.
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
  const authorityRole = parseSourceAuthorityRole(input.authorityRole);
  const authorityNote = input.authorityNote?.trim() ?? "";
  const sourceMetadata = JSON.stringify(input.sourceMetadata ?? { intakeMode:"metadata-only", documentHostedByFlyTally:false });
  const chapters = JSON.stringify(input.chapters ?? []);
  const sourceUri = input.sourceUri?.trim() || null;
  const checksumSha256 = optionalChecksum(input.checksumSha256);
  const staleReason = `New manual revision ${revision} registered`;

  const results = await sql.transaction((txn) => [
    txn`INSERT INTO training_manuals(manual_id,aircraft_id,title,publisher,source_kind)
      VALUES(${manualId},${aircraftId},${title},${publisher},${sourceKind})
      ON CONFLICT(manual_id) DO NOTHING
      RETURNING manual_id`,
    txn`INSERT INTO training_manual_revisions(revision_id,manual_id,revision_code,issue_date,authority_role,authority_note,source_metadata,chapters,source_uri,checksum_sha256,registered_by)
      SELECT ${revisionId},${manualId},${revision},${issueDate},${authorityRole},${authorityNote},${sourceMetadata}::jsonb,${chapters}::jsonb,${sourceUri},${checksumSha256},${subject}
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

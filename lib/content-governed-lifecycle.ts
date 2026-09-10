import "server-only";

import { randomUUID } from "node:crypto";
import {
  contentVersionOrigins,
  trainingContentDomains,
  type ContentVersionOrigin,
  type TrainingContentDomain,
} from "./content-admin-types";
import { assertContentVersionValidForApprovalOrPublication } from "./content-governance";
import { sql } from "./db";

export type GovernedAiDraftAudit = {
  readonly provider: string;
  readonly model: string;
  readonly responseId?: string;
  readonly sourceTextSha256: string;
  readonly sourceTextChars: number;
  readonly warnings: readonly string[];
};

function validId(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > 128 || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(normalized)) {
    throw new Error(`Invalid ${label}.`);
  }
  return normalized;
}

function validDomain(value: string): TrainingContentDomain {
  if (!(trainingContentDomains as readonly string[]).includes(value)) throw new Error("Unsupported content domain.");
  return value as TrainingContentDomain;
}

function validOrigin(value: string): ContentVersionOrigin {
  if (!(contentVersionOrigins as readonly string[]).includes(value)) throw new Error("Unsupported content version origin.");
  return value as ContentVersionOrigin;
}

function sourceReferenceIds(values: readonly string[]): readonly string[] {
  const result = [...new Set(values.map(value => value.trim()).filter(Boolean))];
  if (!result.length) throw new Error("At least one source reference is required before a technical draft can be reviewed.");
  if (result.some(value => value.length > 256)) throw new Error("Invalid source reference id.");
  return result;
}

function normalizedAiAudit(value: GovernedAiDraftAudit): GovernedAiDraftAudit {
  const provider = value.provider.trim();
  const model = value.model.trim();
  const responseId = value.responseId?.trim() || undefined;
  const sourceTextSha256 = value.sourceTextSha256.trim().toLowerCase();
  const warnings = value.warnings.map(item => item.trim()).filter(Boolean);
  if (!provider || provider.length > 128) throw new Error("Invalid AI drafting provider.");
  if (!model || model.length > 256) throw new Error("Invalid AI drafting model.");
  if (responseId && responseId.length > 512) throw new Error("Invalid AI provider response id.");
  if (!/^[a-f0-9]{64}$/.test(sourceTextSha256)) throw new Error("AI source excerpt SHA-256 is invalid.");
  if (!Number.isSafeInteger(value.sourceTextChars) || value.sourceTextChars < 1 || value.sourceTextChars > 120000) throw new Error("AI source excerpt size is invalid.");
  if (warnings.length > 100 || warnings.some(item => item.length > 4000)) throw new Error("AI drafting warnings exceed the audit limit.");
  return { provider, model, responseId, sourceTextSha256, sourceTextChars:value.sourceTextChars, warnings };
}

export async function createGovernedDraftVersion(input: {
  readonly aircraftId: string;
  readonly domain: string;
  readonly contentKey?: string;
  readonly payload: unknown;
  readonly origin: ContentVersionOrigin;
  readonly sourceReferenceIds: readonly string[];
  readonly aiAudit?: GovernedAiDraftAudit;
}, subject: string): Promise<string> {
  const aircraftId = validId(input.aircraftId, "aircraft id");
  const domain = validDomain(input.domain);
  const contentKey = validId(input.contentKey?.trim() || "bundle", "content key");
  const origin = validOrigin(input.origin);
  if (!input.payload || typeof input.payload !== "object") throw new Error("Draft payload must be a JSON object or array.");
  if (origin === "ai-assisted" && !input.aiAudit) throw new Error("AI-assisted drafts require immutable audit metadata.");
  if (origin !== "ai-assisted" && input.aiAudit) throw new Error("AI audit metadata is only valid for AI-assisted drafts.");

  const references = sourceReferenceIds(input.sourceReferenceIds);
  const referencesJson = JSON.stringify(references);
  const payloadJson = JSON.stringify(input.payload);
  const audit = input.aiAudit ? normalizedAiAudit(input.aiAudit) : undefined;
  const warningsJson = audit ? JSON.stringify(audit.warnings) : undefined;
  const versionId = randomUUID();
  const runId = audit ? randomUUID() : undefined;
  const lockKey = `${aircraftId}:${domain}:${contentKey}`;

  const results = await sql.transaction((txn) => {
    const queries = [
      txn`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey},0))`,
      txn`WITH input_refs AS (
          SELECT DISTINCT value::text AS reference_id
          FROM jsonb_array_elements_text(${referencesJson}::jsonb)
        ),
        valid_refs AS (
          SELECT ir.reference_id
          FROM input_refs ir
          JOIN training_source_references sr ON sr.reference_id=ir.reference_id
          JOIN training_manual_revisions r ON r.revision_id=sr.revision_id
          JOIN training_manuals m ON m.manual_id=r.manual_id
          WHERE m.aircraft_id=${aircraftId}
        ),
        validation AS (
          SELECT COUNT(*)::int=${references.length} AS valid
          FROM valid_refs
        ),
        item AS (
          INSERT INTO training_content_items(aircraft_id,domain,content_key)
          SELECT ${aircraftId},${domain},${contentKey}
          FROM validation
          WHERE valid
          ON CONFLICT(aircraft_id,domain,content_key)
          DO UPDATE SET content_key=EXCLUDED.content_key
          RETURNING item_id
        ),
        inserted_version AS (
          INSERT INTO training_content_versions(version_id,item_id,version_no,state,origin,payload,created_by)
          SELECT ${versionId},i.item_id,
            COALESCE((SELECT MAX(v.version_no) FROM training_content_versions v WHERE v.item_id=i.item_id),0)+1,
            'draft',${origin},${payloadJson}::jsonb,${subject}
          FROM item i
          RETURNING version_id
        ),
        linked_sources AS (
          INSERT INTO training_content_version_sources(version_id,reference_id)
          SELECT v.version_id,r.reference_id
          FROM inserted_version v
          CROSS JOIN valid_refs r
          RETURNING reference_id
        )
        SELECT v.version_id,(SELECT COUNT(*)::int FROM linked_sources) AS linked_count
        FROM inserted_version v`,
    ];
    if (audit && runId && warningsJson !== undefined) {
      queries.push(txn`INSERT INTO training_ai_draft_runs(
          run_id,version_id,provider,model,provider_response_id,source_text_sha256,source_text_chars,source_reference_ids,warnings,created_by
        )
        SELECT ${runId},v.version_id,${audit.provider},${audit.model},${audit.responseId ?? null},${audit.sourceTextSha256},${audit.sourceTextChars},${referencesJson}::jsonb,${warningsJson}::jsonb,${subject}
        FROM training_content_versions v
        WHERE v.version_id=${versionId}
        RETURNING version_id`);
    }
    return queries;
  });

  const rows = results[1] as unknown as Array<{version_id:string;linked_count:number|string}>;
  const created = rows[0];
  if (!created || Number(created.linked_count) !== references.length) {
    throw new Error("Every source reference must belong to the same aircraft before a draft can be created.");
  }
  if (audit) {
    const auditRows = results[2] as unknown as Array<{version_id:string}>;
    if (!auditRows?.[0]) throw new Error("AI-assisted draft audit could not be persisted atomically.");
  }
  return created.version_id;
}

export async function approveGovernedContentVersion(versionId: string, subject: string, note?: string): Promise<void> {
  // The governed writer owns the publishability contract. Callers cannot
  // bypass payload/schema or source-aircraft validation by invoking it directly.
  await assertContentVersionValidForApprovalOrPublication(versionId);
  const approvalId = randomUUID();

  const results = await sql.transaction((txn) => [
    txn`SELECT pg_advisory_xact_lock(COALESCE((SELECT item_id FROM training_content_versions WHERE version_id=${versionId}),-1)::bigint)`,
    txn`WITH candidate AS (
        SELECT v.version_id
        FROM training_content_versions v
        WHERE v.version_id=${versionId}
          AND v.state='draft'
          AND EXISTS(SELECT 1 FROM training_content_version_sources cvs WHERE cvs.version_id=v.version_id)
          AND (v.origin<>'ai-assisted' OR EXISTS(SELECT 1 FROM training_ai_draft_runs ar WHERE ar.version_id=v.version_id))
      ),
      inserted_approval AS (
        INSERT INTO training_content_approvals(approval_id,version_id,decision,reviewed_by,review_note)
        SELECT ${approvalId},c.version_id,'approved',${subject},${note?.trim() || null}
        FROM candidate c
        WHERE NOT EXISTS(
          SELECT 1 FROM training_content_approvals a
          WHERE a.version_id=c.version_id AND a.decision='approved'
        )
        RETURNING version_id
      ),
      eligible AS (
        SELECT c.version_id
        FROM candidate c
        WHERE EXISTS(SELECT 1 FROM inserted_approval ia WHERE ia.version_id=c.version_id)
           OR EXISTS(
             SELECT 1 FROM training_content_approvals a
             WHERE a.version_id=c.version_id AND a.decision='approved'
           )
      ),
      transitioned AS (
        UPDATE training_content_versions v
        SET state='approved'
        FROM eligible e
        WHERE v.version_id=e.version_id AND v.state='draft'
        RETURNING v.version_id
      )
      SELECT version_id FROM transitioned`,
  ]);

  const rows = results[1] as unknown as Array<{version_id:string}>;
  if (!rows[0]) throw new Error("Content version is not an approvable sourced draft with the required provenance audit.");
}

export async function publishGovernedContentVersion(versionId: string, subject: string): Promise<void> {
  // Revalidate at publication rather than trusting an earlier approval. This
  // also protects historical approved rows if the contract becomes stricter.
  await assertContentVersionValidForApprovalOrPublication(versionId);

  const results = await sql.transaction((txn) => [
    txn`SELECT pg_advisory_xact_lock(COALESCE((SELECT item_id FROM training_content_versions WHERE version_id=${versionId}),-1)::bigint)`,
    txn`WITH target AS (
        SELECT v.item_id,v.version_id
        FROM training_content_versions v
        WHERE v.version_id=${versionId}
          AND v.state IN ('approved','published')
          AND EXISTS(
            SELECT 1 FROM training_content_approvals a
            WHERE a.version_id=v.version_id AND a.decision='approved'
          )
          AND (v.origin<>'ai-assisted' OR EXISTS(SELECT 1 FROM training_ai_draft_runs ar WHERE ar.version_id=v.version_id))
      ),
      archived AS (
        UPDATE training_content_versions v
        SET state='archived'
        FROM target t
        WHERE v.item_id=t.item_id
          AND v.state='published'
          AND v.version_id<>t.version_id
        RETURNING v.version_id
      ),
      published AS (
        UPDATE training_content_versions v
        SET state='published'
        FROM target t
        WHERE v.version_id=t.version_id
        RETURNING v.item_id,v.version_id
      ),
      publication AS (
        INSERT INTO training_content_publications(item_id,version_id,published_by)
        SELECT p.item_id,p.version_id,${subject}
        FROM published p
        ON CONFLICT(item_id) DO UPDATE
          SET version_id=EXCLUDED.version_id,
              published_by=EXCLUDED.published_by,
              published_at=NOW()
        RETURNING version_id
      )
      SELECT version_id FROM publication`,
  ]);

  const rows = results[1] as unknown as Array<{version_id:string}>;
  if (!rows[0]) throw new Error("Explicit human approval and required provenance audit are required before publication.");
}

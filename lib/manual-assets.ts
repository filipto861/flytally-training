import "server-only";

import { randomUUID } from "node:crypto";
import { head, issueSignedToken, presignUrl } from "@vercel/blob";
import { ensureContentSchema } from "./content-admin-repository";
import { sql } from "./db";
import { MAX_MANUAL_ASSET_BYTES, manualAssetPathname, validateManualUploadMetadata, type ManualUploadMetadata } from "./manual-asset-input";

export type ManualAssetStatus = "pending" | "ready" | "claimed" | "attached" | "failed";
export type ManualAsset = {
  readonly id: string;
  readonly aircraftId: string;
  readonly pathname: string;
  readonly blobUrl?: string;
  readonly originalName: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly checksumSha256: string;
  readonly status: ManualAssetStatus;
  readonly attachedRevisionId?: string;
  readonly createdAt: string;
};

let manualAssetSchemaReady: Promise<void> | undefined;

export async function ensureManualAssetSchema(): Promise<void> {
  if (!manualAssetSchemaReady) {
    manualAssetSchemaReady = (async () => {
      await ensureContentSchema();
      await sql`CREATE TABLE IF NOT EXISTS training_manual_assets (
        asset_id TEXT PRIMARY KEY,
        aircraft_id TEXT NOT NULL REFERENCES training_aircraft_types(aircraft_id) ON DELETE CASCADE,
        provider TEXT NOT NULL DEFAULT 'vercel-blob',
        pathname TEXT NOT NULL UNIQUE,
        blob_url TEXT NULL,
        original_filename TEXT NOT NULL,
        content_type TEXT NOT NULL,
        size_bytes BIGINT NOT NULL,
        checksum_sha256 TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_by TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        finalized_at TIMESTAMPTZ NULL,
        claimed_by TEXT NULL,
        claimed_at TIMESTAMPTZ NULL,
        attached_revision_id TEXT NULL UNIQUE REFERENCES training_manual_revisions(revision_id) ON DELETE SET NULL,
        CHECK(provider IN ('vercel-blob')),
        CHECK(status IN ('pending','ready','claimed','attached','failed')),
        CHECK(size_bytes > 0)
      )`;
      await sql`CREATE INDEX IF NOT EXISTS idx_training_manual_assets_aircraft ON training_manual_assets(aircraft_id,status,created_at DESC)`;
    })().catch((error) => { manualAssetSchemaReady = undefined; throw error; });
  }
  return manualAssetSchemaReady;
}

function mapAsset(row: {
  asset_id:string;aircraft_id:string;pathname:string;blob_url:string|null;original_filename:string;content_type:string;size_bytes:number|string;checksum_sha256:string;status:ManualAssetStatus;attached_revision_id:string|null;created_at:string|Date;
}): ManualAsset {
  return {
    id: row.asset_id,
    aircraftId: row.aircraft_id,
    pathname: row.pathname,
    blobUrl: row.blob_url ?? undefined,
    originalName: row.original_filename,
    contentType: row.content_type,
    sizeBytes: Number(row.size_bytes),
    checksumSha256: row.checksum_sha256,
    status: row.status,
    attachedRevisionId: row.attached_revision_id ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

const assetColumns = "asset_id,aircraft_id,pathname,blob_url,original_filename,content_type,size_bytes,checksum_sha256,status,attached_revision_id,created_at";

export async function issueManualAssetUpload(input: ManualUploadMetadata, subject: string): Promise<{assetId:string;pathname:string;presignedUrl:string;validUntil:number}> {
  const metadata = validateManualUploadMetadata(input);
  await ensureManualAssetSchema();
  const aircraft = await sql`SELECT 1 FROM training_aircraft_types WHERE aircraft_id=${metadata.aircraftId} LIMIT 1` as unknown[];
  if (!aircraft[0]) throw new Error("Aircraft does not exist.");

  const assetId = randomUUID();
  const pathname = manualAssetPathname(metadata.aircraftId, assetId);
  await sql`INSERT INTO training_manual_assets(asset_id,aircraft_id,pathname,original_filename,content_type,size_bytes,checksum_sha256,created_by)
    VALUES(${assetId},${metadata.aircraftId},${pathname},${metadata.originalName},'application/pdf',${metadata.sizeBytes},${metadata.checksumSha256},${subject})`;

  const validUntil = Date.now() + 15 * 60 * 1000;
  try {
    const token = await issueSignedToken({
      pathname,
      operations: ["put"],
      allowedContentTypes: ["application/pdf"],
      maximumSizeInBytes: MAX_MANUAL_ASSET_BYTES,
      validUntil,
    });
    const signed = await presignUrl(token, { pathname, operation: "put", validUntil });
    return { assetId, pathname, presignedUrl: signed.presignedUrl, validUntil };
  } catch (error) {
    await sql`UPDATE training_manual_assets SET status='failed' WHERE asset_id=${assetId}`;
    throw error;
  }
}

export async function finalizeManualAsset(assetId: string, subject: string): Promise<ManualAsset> {
  void subject;
  await ensureManualAssetSchema();
  const rows = await sql`SELECT asset_id,aircraft_id,pathname,blob_url,original_filename,content_type,size_bytes,checksum_sha256,status,attached_revision_id,created_at FROM training_manual_assets WHERE asset_id=${assetId} LIMIT 1` as Array<{
    asset_id:string;aircraft_id:string;pathname:string;blob_url:string|null;original_filename:string;content_type:string;size_bytes:number|string;checksum_sha256:string;status:ManualAssetStatus;attached_revision_id:string|null;created_at:string|Date;
  }>;
  const row = rows[0];
  if (!row) throw new Error("Manual asset not found.");
  if (row.status === "ready" || row.status === "attached") return mapAsset(row);
  if (row.status !== "pending") throw new Error(`Manual asset cannot be finalized from state ${row.status}.`);

  try {
    const blob = await head(row.pathname, { access: "private" });
    if (Number(blob.size) !== Number(row.size_bytes)) throw new Error("Uploaded PDF size does not match the signed upload request.");
    if (blob.contentType !== "application/pdf") throw new Error("Uploaded object is not application/pdf.");
    await sql`UPDATE training_manual_assets SET status='ready',blob_url=${blob.url},finalized_at=NOW() WHERE asset_id=${assetId} AND status='pending'`;
  } catch (error) {
    await sql`UPDATE training_manual_assets SET status='failed' WHERE asset_id=${assetId} AND status='pending'`;
    throw error;
  }

  const ready = await sql`SELECT asset_id,aircraft_id,pathname,blob_url,original_filename,content_type,size_bytes,checksum_sha256,status,attached_revision_id,created_at FROM training_manual_assets WHERE asset_id=${assetId} LIMIT 1` as typeof rows;
  if (!ready[0]) throw new Error("Manual asset disappeared after finalization.");
  return mapAsset(ready[0]);
}

export async function listManualAssets(aircraftId: string): Promise<readonly ManualAsset[]> {
  await ensureManualAssetSchema();
  const rows = await sql`SELECT asset_id,aircraft_id,pathname,blob_url,original_filename,content_type,size_bytes,checksum_sha256,status,attached_revision_id,created_at FROM training_manual_assets WHERE aircraft_id=${aircraftId} ORDER BY created_at DESC` as Array<{
    asset_id:string;aircraft_id:string;pathname:string;blob_url:string|null;original_filename:string;content_type:string;size_bytes:number|string;checksum_sha256:string;status:ManualAssetStatus;attached_revision_id:string|null;created_at:string|Date;
  }>;
  return rows.map(mapAsset);
}

export async function claimManualAsset(aircraftId: string, assetId: string, subject: string): Promise<ManualAsset> {
  await ensureManualAssetSchema();
  const rows = await sql`UPDATE training_manual_assets
    SET status='claimed',claimed_by=${subject},claimed_at=NOW()
    WHERE asset_id=${assetId} AND aircraft_id=${aircraftId}
      AND (status='ready' OR (status='claimed' AND claimed_at < NOW()-INTERVAL '30 minutes'))
    RETURNING asset_id,aircraft_id,pathname,blob_url,original_filename,content_type,size_bytes,checksum_sha256,status,attached_revision_id,created_at` as Array<{
      asset_id:string;aircraft_id:string;pathname:string;blob_url:string|null;original_filename:string;content_type:string;size_bytes:number|string;checksum_sha256:string;status:ManualAssetStatus;attached_revision_id:string|null;created_at:string|Date;
    }>;
  if (!rows[0] || !rows[0].blob_url) throw new Error("Manual asset is not ready or is already in use.");
  return mapAsset(rows[0]);
}

export async function releaseManualAssetClaim(assetId: string, subject: string): Promise<void> {
  await ensureManualAssetSchema();
  await sql`UPDATE training_manual_assets SET status='ready',claimed_by=NULL,claimed_at=NULL WHERE asset_id=${assetId} AND status='claimed' AND claimed_by=${subject}`;
}

export async function attachClaimedManualAsset(assetId: string, revisionId: string, subject: string): Promise<void> {
  await ensureManualAssetSchema();
  const rows = await sql`UPDATE training_manual_assets SET status='attached',attached_revision_id=${revisionId},claimed_by=NULL,claimed_at=NULL
    WHERE asset_id=${assetId} AND status='claimed' AND claimed_by=${subject}
    RETURNING asset_id` as Array<{asset_id:string}>;
  if (!rows[0]) throw new Error("Manual asset claim was lost before the revision could be attached.");
}

export async function issueManualAssetDownload(assetId: string): Promise<string> {
  await ensureManualAssetSchema();
  const rows = await sql`SELECT pathname,status FROM training_manual_assets WHERE asset_id=${assetId} LIMIT 1` as Array<{pathname:string;status:ManualAssetStatus}>;
  const row = rows[0];
  if (!row || !["ready","claimed","attached"].includes(row.status)) throw new Error("Manual asset is not available for download.");
  const validUntil = Date.now() + 5 * 60 * 1000;
  const token = await issueSignedToken({ pathname: row.pathname, operations: ["get"], validUntil });
  const signed = await presignUrl(token, { pathname: row.pathname, operation: "get", validUntil, useCache: false });
  return signed.presignedUrl;
}

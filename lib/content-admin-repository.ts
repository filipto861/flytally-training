import "server-only";

import { randomUUID } from "node:crypto";
import { sql } from "./db";
import {
  type AdminAircraftDetail,
  type AdminAircraftSummary,
  type AdminContentVersion,
  type AdminManualRevision,
  type AdminSourceReference,
  type TrainingContentDomain,
} from "./content-admin-types";
import { parseSourceAuthorityRole } from "./source-authority";

let contentSchemaReady: Promise<void> | undefined;

export async function ensureContentSchema(): Promise<void> {
  if (!contentSchemaReady) {
    contentSchemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS training_aircraft_types (
        aircraft_id TEXT PRIMARY KEY,
        manufacturer TEXT NOT NULL,
        model TEXT NOT NULL,
        display_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK(status IN ('draft','published'))
      )`;
      await sql`CREATE TABLE IF NOT EXISTS training_aircraft_variants (
        aircraft_id TEXT NOT NULL REFERENCES training_aircraft_types(aircraft_id) ON DELETE CASCADE,
        variant_key TEXT NOT NULL,
        display_name TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY(aircraft_id,variant_key)
      )`;
      await sql`CREATE TABLE IF NOT EXISTS training_manuals (
        manual_id TEXT PRIMARY KEY,
        aircraft_id TEXT NOT NULL REFERENCES training_aircraft_types(aircraft_id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        publisher TEXT NOT NULL,
        source_kind TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS training_manual_revisions (
        revision_id TEXT PRIMARY KEY,
        manual_id TEXT NOT NULL REFERENCES training_manuals(manual_id) ON DELETE CASCADE,
        revision_code TEXT NOT NULL,
        issue_date TEXT NOT NULL,
        authority_role TEXT NOT NULL DEFAULT 'UNCLASSIFIED',
        authority_note TEXT NOT NULL DEFAULT '',
        source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        chapters JSONB NOT NULL DEFAULT '[]'::jsonb,
        source_uri TEXT NULL,
        checksum_sha256 TEXT NULL,
        registered_by TEXT NOT NULL,
        registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(manual_id,revision_code),
        CHECK(authority_role IN ('CONTROLLING','OPERATING_REFERENCE','TRAINING_REFERENCE','SIMULATOR_IMPLEMENTATION','SIMULATOR_WORKFLOW','UNCLASSIFIED'))
      )`;
      // Existing Training databases predate M9 source authority. The explicit
      // bootstrap path upgrades them without moving DDL into runtime reads.
      await sql`ALTER TABLE training_manual_revisions ADD COLUMN IF NOT EXISTS authority_role TEXT NOT NULL DEFAULT 'UNCLASSIFIED'`;
      await sql`CREATE TABLE IF NOT EXISTS training_source_references (
        reference_id TEXT PRIMARY KEY,
        revision_id TEXT NOT NULL REFERENCES training_manual_revisions(revision_id) ON DELETE CASCADE,
        chapter TEXT NULL,
        section TEXT NULL,
        page_label TEXT NOT NULL,
        note TEXT NULL,
        created_by TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS training_content_items (
        item_id BIGSERIAL PRIMARY KEY,
        aircraft_id TEXT NOT NULL REFERENCES training_aircraft_types(aircraft_id) ON DELETE CASCADE,
        domain TEXT NOT NULL,
        content_key TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(aircraft_id,domain,content_key)
      )`;
      await sql`CREATE TABLE IF NOT EXISTS training_content_versions (
        version_id TEXT PRIMARY KEY,
        item_id BIGINT NOT NULL REFERENCES training_content_items(item_id) ON DELETE CASCADE,
        version_no INTEGER NOT NULL,
        state TEXT NOT NULL DEFAULT 'draft',
        origin TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_by TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(item_id,version_no),
        CHECK(state IN ('draft','approved','published','stale','archived'))
      )`;
      await sql`CREATE TABLE IF NOT EXISTS training_content_version_sources (
        version_id TEXT NOT NULL REFERENCES training_content_versions(version_id) ON DELETE CASCADE,
        reference_id TEXT NOT NULL REFERENCES training_source_references(reference_id) ON DELETE RESTRICT,
        PRIMARY KEY(version_id,reference_id)
      )`;
      await sql`CREATE TABLE IF NOT EXISTS training_content_approvals (
        approval_id TEXT PRIMARY KEY,
        version_id TEXT NOT NULL REFERENCES training_content_versions(version_id) ON DELETE CASCADE,
        decision TEXT NOT NULL,
        reviewed_by TEXT NOT NULL,
        review_note TEXT NULL,
        reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK(decision IN ('approved','rejected'))
      )`;
      await sql`CREATE TABLE IF NOT EXISTS training_content_publications (
        item_id BIGINT PRIMARY KEY REFERENCES training_content_items(item_id) ON DELETE CASCADE,
        version_id TEXT NOT NULL REFERENCES training_content_versions(version_id) ON DELETE RESTRICT,
        published_by TEXT NOT NULL,
        published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS training_content_stale_flags (
        stale_id BIGSERIAL PRIMARY KEY,
        version_id TEXT NOT NULL REFERENCES training_content_versions(version_id) ON DELETE CASCADE,
        newer_revision_id TEXT NOT NULL REFERENCES training_manual_revisions(revision_id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        resolved_at TIMESTAMPTZ NULL,
        resolved_by TEXT NULL,
        resolution_note TEXT NULL,
        UNIQUE(version_id,newer_revision_id)
      )`;
      await sql`CREATE INDEX IF NOT EXISTS idx_training_content_items_aircraft ON training_content_items(aircraft_id,domain)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_training_stale_open ON training_content_stale_flags(version_id) WHERE resolved_at IS NULL`;
    })().catch((error) => { contentSchemaReady = undefined; throw error; });
  }
  return contentSchemaReady;
}

function validId(value: string, label: string) {
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > 128 || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(cleaned)) throw new Error(`Invalid ${label}.`);
  return cleaned;
}

export async function createAircraft(input: {id:string;manufacturer:string;model:string;displayName:string}, subject: string) {
  void subject;
  const id = validId(input.id, "aircraft id");
  await sql`INSERT INTO training_aircraft_types(aircraft_id,manufacturer,model,display_name) VALUES(${id},${input.manufacturer.trim()},${input.model.trim()},${input.displayName.trim()})`;
}

export async function addAircraftVariant(aircraftId: string, variant: string) {
  const key = validId(variant, "variant");
  await sql`INSERT INTO training_aircraft_variants(aircraft_id,variant_key,display_name) VALUES(${aircraftId},${key},${variant.trim()}) ON CONFLICT(aircraft_id,variant_key) DO NOTHING`;
}

export async function createSourceReference(input:{revisionId:string;chapter?:string;section?:string;pageLabel:string;note?:string},subject:string):Promise<string>{
  const id=randomUUID();
  await sql`INSERT INTO training_source_references(reference_id,revision_id,chapter,section,page_label,note,created_by) VALUES(${id},${input.revisionId},${input.chapter?.trim()||null},${input.section?.trim()||null},${input.pageLabel.trim()},${input.note?.trim()||null},${subject})`;
  return id;
}

export async function resolveStaleFlag(staleId:number,subject:string,note?:string){
  await sql`UPDATE training_content_stale_flags SET resolved_at=NOW(),resolved_by=${subject},resolution_note=${note?.trim()||null} WHERE stale_id=${staleId} AND resolved_at IS NULL`;
}

async function adminSummaries():Promise<AdminAircraftSummary[]>{
  const rows=await sql`SELECT a.aircraft_id,a.manufacturer,a.model,a.display_name,a.status,
    COALESCE((SELECT json_agg(v.variant_key ORDER BY v.variant_key) FROM training_aircraft_variants v WHERE v.aircraft_id=a.aircraft_id),'[]'::json) variants,
    (SELECT COUNT(*) FROM training_manual_revisions r JOIN training_manuals m ON m.manual_id=r.manual_id WHERE m.aircraft_id=a.aircraft_id)::int manual_count,
    (SELECT COUNT(*) FROM training_content_items i WHERE i.aircraft_id=a.aircraft_id)::int item_count,
    (SELECT COUNT(*) FROM training_content_stale_flags sf JOIN training_content_versions cv ON cv.version_id=sf.version_id JOIN training_content_items ci ON ci.item_id=cv.item_id WHERE ci.aircraft_id=a.aircraft_id AND sf.resolved_at IS NULL)::int stale_count
    FROM training_aircraft_types a ORDER BY a.display_name` as Array<{aircraft_id:string;manufacturer:string;model:string;display_name:string;status:"draft"|"published";variants:unknown;manual_count:number|string;item_count:number|string;stale_count:number|string}>;
  return rows.map(row=>({id:row.aircraft_id,manufacturer:row.manufacturer,model:row.model,displayName:row.display_name,status:row.status,variants:Array.isArray(row.variants)?row.variants.filter((v):v is string=>typeof v==="string"):[],manualRevisionCount:Number(row.manual_count),contentItemCount:Number(row.item_count),staleCount:Number(row.stale_count)}));
}

export async function listAdminAircraft(){return adminSummaries();}

export async function getAdminAircraft(aircraftId:string):Promise<AdminAircraftDetail|undefined>{
  const summary=(await adminSummaries()).find(item=>item.id===aircraftId); if(!summary)return undefined;
  const manuals=await sql`SELECT m.manual_id,r.revision_id,m.title,m.publisher,r.revision_code,r.issue_date,m.source_kind,r.authority_role,r.source_uri,r.checksum_sha256 FROM training_manuals m JOIN training_manual_revisions r ON r.manual_id=m.manual_id WHERE m.aircraft_id=${aircraftId} ORDER BY r.registered_at DESC` as Array<{manual_id:string;revision_id:string;title:string;publisher:string;revision_code:string;issue_date:string;source_kind:string;authority_role:string;source_uri:string|null;checksum_sha256:string|null}>;
  const refs=await sql`SELECT sr.reference_id,sr.revision_id,sr.chapter,sr.section,sr.page_label,sr.note FROM training_source_references sr JOIN training_manual_revisions r ON r.revision_id=sr.revision_id JOIN training_manuals m ON m.manual_id=r.manual_id WHERE m.aircraft_id=${aircraftId} ORDER BY sr.created_at DESC` as Array<{reference_id:string;revision_id:string;chapter:string|null;section:string|null;page_label:string;note:string|null}>;
  const versions=await sql`SELECT v.version_id,i.domain,i.content_key,v.version_no,v.state,v.origin,v.created_by,v.created_at,a.reviewed_by,p.published_at FROM training_content_items i JOIN training_content_versions v ON v.item_id=i.item_id LEFT JOIN LATERAL(SELECT reviewed_by FROM training_content_approvals aa WHERE aa.version_id=v.version_id AND aa.decision='approved' ORDER BY reviewed_at DESC LIMIT 1)a ON TRUE LEFT JOIN training_content_publications p ON p.version_id=v.version_id WHERE i.aircraft_id=${aircraftId} ORDER BY v.created_at DESC` as Array<{version_id:string;domain:TrainingContentDomain;content_key:string;version_no:number|string;state:AdminContentVersion["state"];origin:AdminContentVersion["origin"];created_by:string;created_at:string|Date;reviewed_by:string|null;published_at:string|Date|null}>;
  return {
    ...summary,
    manuals:manuals.map((r):AdminManualRevision=>({manualId:r.manual_id,revisionId:r.revision_id,title:r.title,publisher:r.publisher,revision:r.revision_code,issueDate:r.issue_date,sourceKind:r.source_kind,authorityRole:parseSourceAuthorityRole(r.authority_role||"UNCLASSIFIED"),sourceUri:r.source_uri??undefined,checksumSha256:r.checksum_sha256??undefined})),
    sourceReferences:refs.map((r):AdminSourceReference=>({id:r.reference_id,revisionId:r.revision_id,chapter:r.chapter??undefined,section:r.section??undefined,pageLabel:r.page_label,note:r.note??undefined})),
    contentVersions:versions.map((v):AdminContentVersion=>({id:v.version_id,domain:v.domain,contentKey:v.content_key,versionNo:Number(v.version_no),state:v.state,origin:v.origin,createdBy:v.created_by,createdAt:new Date(v.created_at).toISOString(),approvedBy:v.reviewed_by??undefined,publishedAt:v.published_at?new Date(v.published_at).toISOString():undefined})),
  };
}

export async function getOpenStaleFlags(aircraftId:string){
  return await sql`SELECT sf.stale_id,sf.version_id,sf.newer_revision_id,sf.reason,sf.detected_at,i.domain,i.content_key FROM training_content_stale_flags sf JOIN training_content_versions v ON v.version_id=sf.version_id JOIN training_content_items i ON i.item_id=v.item_id WHERE i.aircraft_id=${aircraftId} AND sf.resolved_at IS NULL ORDER BY sf.detected_at DESC` as Array<{stale_id:number|string;version_id:string;newer_revision_id:string;reason:string;detected_at:string|Date;domain:string;content_key:string}>;
}

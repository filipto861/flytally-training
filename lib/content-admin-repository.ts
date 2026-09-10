import "server-only";

import { randomUUID } from "node:crypto";
import { sql } from "./db";
import { staticTrainingContentSeed } from "./static-content-repository";
import {
  trainingContentDomains,
  type AdminAircraftDetail,
  type AdminAircraftSummary,
  type AdminContentVersion,
  type AdminManualRevision,
  type AdminSourceReference,
  type ContentVersionOrigin,
  type TrainingContentDomain,
} from "./content-admin-types";

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
        authority_note TEXT NOT NULL DEFAULT '',
        source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        chapters JSONB NOT NULL DEFAULT '[]'::jsonb,
        source_uri TEXT NULL,
        checksum_sha256 TEXT NULL,
        registered_by TEXT NOT NULL,
        registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(manual_id,revision_code)
      )`;
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

function assertDomain(domain: string): TrainingContentDomain {
  if (!(trainingContentDomains as readonly string[]).includes(domain)) throw new Error("Unsupported content domain.");
  return domain as TrainingContentDomain;
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

export async function publishAircraft(aircraftId: string) {
  await sql`UPDATE training_aircraft_types SET status='published',updated_at=NOW() WHERE aircraft_id=${aircraftId}`;
}

export async function registerManualRevision(input: {
  aircraftId:string;manualId:string;revisionId:string;title:string;publisher:string;sourceKind:string;revision:string;issueDate:string;authorityNote?:string;sourceUri?:string;checksumSha256?:string;sourceMetadata?:object;chapters?:unknown[];
}, subject:string): Promise<void> {
  const manualId = validId(input.manualId, "manual id");
  const revisionId = validId(input.revisionId, "revision id");
  await sql`INSERT INTO training_manuals(manual_id,aircraft_id,title,publisher,source_kind) VALUES(${manualId},${input.aircraftId},${input.title.trim()},${input.publisher.trim()},${input.sourceKind.trim()}) ON CONFLICT(manual_id) DO NOTHING`;
  const existing = await sql`SELECT revision_id FROM training_manual_revisions WHERE revision_id=${revisionId} OR (manual_id=${manualId} AND revision_code=${input.revision.trim()}) LIMIT 1` as Array<{revision_id:string}>;
  if (existing[0]) throw new Error("Manual revision already exists. Revisions are immutable; register a new revision id/code instead.");
  await sql`INSERT INTO training_manual_revisions(revision_id,manual_id,revision_code,issue_date,authority_note,source_metadata,chapters,source_uri,checksum_sha256,registered_by)
    VALUES(${revisionId},${manualId},${input.revision.trim()},${input.issueDate.trim()},${input.authorityNote?.trim() ?? ""},${JSON.stringify(input.sourceMetadata ?? {})}::jsonb,${JSON.stringify(input.chapters ?? [])}::jsonb,${input.sourceUri?.trim() || null},${input.checksumSha256?.trim() || null},${subject})`;
  await sql`INSERT INTO training_content_stale_flags(version_id,newer_revision_id,reason)
    SELECT DISTINCT p.version_id,${revisionId},${`New manual revision ${input.revision.trim()} registered`}
    FROM training_content_publications p
    JOIN training_content_version_sources cvs ON cvs.version_id=p.version_id
    JOIN training_source_references sr ON sr.reference_id=cvs.reference_id
    JOIN training_manual_revisions oldr ON oldr.revision_id=sr.revision_id
    WHERE oldr.manual_id=${manualId} AND oldr.revision_id<>${revisionId}
    ON CONFLICT(version_id,newer_revision_id) DO NOTHING`;
}

export async function createSourceReference(input:{revisionId:string;chapter?:string;section?:string;pageLabel:string;note?:string},subject:string):Promise<string>{
  const id=randomUUID();
  await sql`INSERT INTO training_source_references(reference_id,revision_id,chapter,section,page_label,note,created_by) VALUES(${id},${input.revisionId},${input.chapter?.trim()||null},${input.section?.trim()||null},${input.pageLabel.trim()},${input.note?.trim()||null},${subject})`;
  return id;
}

export async function createDraftVersion(input:{aircraftId:string;domain:string;contentKey?:string;payload:unknown;origin:ContentVersionOrigin;sourceReferenceIds:readonly string[]},subject:string):Promise<string>{
  const domain=assertDomain(input.domain);
  if (!input.payload || typeof input.payload!=="object") throw new Error("Draft payload must be a JSON object or array.");
  if (!input.sourceReferenceIds.length) throw new Error("At least one source reference is required before a technical draft can be reviewed.");
  const key=validId(input.contentKey?.trim()||"bundle","content key");
  await sql`INSERT INTO training_content_items(aircraft_id,domain,content_key) VALUES(${input.aircraftId},${domain},${key}) ON CONFLICT(aircraft_id,domain,content_key) DO NOTHING`;
  const items=await sql`SELECT item_id FROM training_content_items WHERE aircraft_id=${input.aircraftId} AND domain=${domain} AND content_key=${key} LIMIT 1` as Array<{item_id:number|string}>;
  const itemId=Number(items[0]?.item_id); if(!itemId)throw new Error("Unable to resolve content item.");
  const versions=await sql`SELECT COALESCE(MAX(version_no),0)::int next FROM training_content_versions WHERE item_id=${itemId}` as Array<{next:number|string}>;
  const versionNo=Number(versions[0]?.next??0)+1;
  const versionId=randomUUID();
  await sql`INSERT INTO training_content_versions(version_id,item_id,version_no,state,origin,payload,created_by) VALUES(${versionId},${itemId},${versionNo},'draft',${input.origin},${JSON.stringify(input.payload)}::jsonb,${subject})`;
  for(const referenceId of [...new Set(input.sourceReferenceIds)]) await sql`INSERT INTO training_content_version_sources(version_id,reference_id) VALUES(${versionId},${referenceId})`;
  return versionId;
}

export async function approveContentVersion(versionId:string,subject:string,note?:string){
  const rows=await sql`SELECT v.state,COUNT(cvs.reference_id)::int source_count FROM training_content_versions v LEFT JOIN training_content_version_sources cvs ON cvs.version_id=v.version_id WHERE v.version_id=${versionId} GROUP BY v.state` as Array<{state:string;source_count:number|string}>;
  const row=rows[0]; if(!row)throw new Error("Content version not found.");
  if(row.state!=="draft")throw new Error("Only draft content can be approved.");
  if(Number(row.source_count)<1)throw new Error("Content cannot be approved without source references.");
  await sql`INSERT INTO training_content_approvals(approval_id,version_id,decision,reviewed_by,review_note) VALUES(${randomUUID()},${versionId},'approved',${subject},${note?.trim()||null})`;
  await sql`UPDATE training_content_versions SET state='approved' WHERE version_id=${versionId}`;
}

export async function publishContentVersion(versionId:string,subject:string){
  const rows=await sql`SELECT v.item_id,v.state,EXISTS(SELECT 1 FROM training_content_approvals a WHERE a.version_id=v.version_id AND a.decision='approved') approved FROM training_content_versions v WHERE v.version_id=${versionId} LIMIT 1` as Array<{item_id:number|string;state:string;approved:boolean}>;
  const row=rows[0]; if(!row)throw new Error("Content version not found.");
  if(row.state!=="approved"||!row.approved)throw new Error("Explicit human approval is required before publication.");
  const itemId=Number(row.item_id);
  await sql`UPDATE training_content_versions SET state='archived' WHERE item_id=${itemId} AND state='published' AND version_id<>${versionId}`;
  await sql`UPDATE training_content_versions SET state='published' WHERE version_id=${versionId}`;
  await sql`INSERT INTO training_content_publications(item_id,version_id,published_by) VALUES(${itemId},${versionId},${subject}) ON CONFLICT(item_id) DO UPDATE SET version_id=EXCLUDED.version_id,published_by=EXCLUDED.published_by,published_at=NOW()`;
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
  const manuals=await sql`SELECT m.manual_id,r.revision_id,m.title,m.publisher,r.revision_code,r.issue_date,m.source_kind,r.source_uri,r.checksum_sha256 FROM training_manuals m JOIN training_manual_revisions r ON r.manual_id=m.manual_id WHERE m.aircraft_id=${aircraftId} ORDER BY r.registered_at DESC` as Array<{manual_id:string;revision_id:string;title:string;publisher:string;revision_code:string;issue_date:string;source_kind:string;source_uri:string|null;checksum_sha256:string|null}>;
  const refs=await sql`SELECT sr.reference_id,sr.revision_id,sr.chapter,sr.section,sr.page_label,sr.note FROM training_source_references sr JOIN training_manual_revisions r ON r.revision_id=sr.revision_id JOIN training_manuals m ON m.manual_id=r.manual_id WHERE m.aircraft_id=${aircraftId} ORDER BY sr.created_at DESC` as Array<{reference_id:string;revision_id:string;chapter:string|null;section:string|null;page_label:string;note:string|null}>;
  const versions=await sql`SELECT v.version_id,i.domain,i.content_key,v.version_no,v.state,v.origin,v.created_by,v.created_at,a.reviewed_by,p.published_at FROM training_content_items i JOIN training_content_versions v ON v.item_id=i.item_id LEFT JOIN LATERAL(SELECT reviewed_by FROM training_content_approvals aa WHERE aa.version_id=v.version_id AND aa.decision='approved' ORDER BY reviewed_at DESC LIMIT 1)a ON TRUE LEFT JOIN training_content_publications p ON p.version_id=v.version_id WHERE i.aircraft_id=${aircraftId} ORDER BY v.created_at DESC` as Array<{version_id:string;domain:TrainingContentDomain;content_key:string;version_no:number|string;state:AdminContentVersion["state"];origin:AdminContentVersion["origin"];created_by:string;created_at:string|Date;reviewed_by:string|null;published_at:string|Date|null}>;
  return {...summary,manuals:manuals.map((r):AdminManualRevision=>({manualId:r.manual_id,revisionId:r.revision_id,title:r.title,publisher:r.publisher,revision:r.revision_code,issueDate:r.issue_date,sourceKind:r.source_kind,sourceUri:r.source_uri??undefined,checksumSha256:r.checksum_sha256??undefined})),sourceReferences:refs.map((r):AdminSourceReference=>({id:r.reference_id,revisionId:r.revision_id,chapter:r.chapter??undefined,section:r.section??undefined,pageLabel:r.page_label,note:r.note??undefined})),contentVersions:versions.map((v):AdminContentVersion=>({id:v.version_id,domain:v.domain,contentKey:v.content_key,versionNo:Number(v.version_no),state:v.state,origin:v.origin,createdBy:v.created_by,createdAt:new Date(v.created_at).toISOString(),approvedBy:v.reviewed_by??undefined,publishedAt:v.published_at?new Date(v.published_at).toISOString():undefined}))};
}

export async function getOpenStaleFlags(aircraftId:string){
  return await sql`SELECT sf.stale_id,sf.version_id,sf.newer_revision_id,sf.reason,sf.detected_at,i.domain,i.content_key FROM training_content_stale_flags sf JOIN training_content_versions v ON v.version_id=sf.version_id JOIN training_content_items i ON i.item_id=v.item_id WHERE i.aircraft_id=${aircraftId} AND sf.resolved_at IS NULL ORDER BY sf.detected_at DESC` as Array<{stale_id:number|string;version_id:string;newer_revision_id:string;reason:string;detected_at:string|Date;domain:string;content_key:string}>;
}

async function ensureBootstrapReference(aircraftId:string,manualId:string,revision:{id:string;title:string;publisher:string;revision:string;issueDate:string;sourceKind:string;authorityNote:string;sourceReferences:object;chapters:unknown[]},subject:string){
  await sql`INSERT INTO training_manuals(manual_id,aircraft_id,title,publisher,source_kind) VALUES(${manualId},${aircraftId},${revision.title},${revision.publisher},${revision.sourceKind}) ON CONFLICT(manual_id) DO NOTHING`;
  await sql`INSERT INTO training_manual_revisions(revision_id,manual_id,revision_code,issue_date,authority_note,source_metadata,chapters,registered_by) VALUES(${revision.id},${manualId},${revision.revision},${revision.issueDate},${revision.authorityNote},${JSON.stringify(revision.sourceReferences)}::jsonb,${JSON.stringify(revision.chapters)}::jsonb,${subject}) ON CONFLICT(revision_id) DO NOTHING`;
  const refId=`bootstrap:${revision.id}`;
  await sql`INSERT INTO training_source_references(reference_id,revision_id,chapter,section,page_label,note,created_by) VALUES(${refId},${revision.id},NULL,'Registered revision','multiple','Bootstrap provenance; detailed page references remain embedded in the migrated content payload.',${subject}) ON CONFLICT(reference_id) DO NOTHING`;
  return refId;
}

export async function bootstrapStaticContent(subject:string){
  const refsByAircraft=new Map<string,string[]>();
  for(const aircraft of staticTrainingContentSeed.aircraft){
    await sql`INSERT INTO training_aircraft_types(aircraft_id,manufacturer,model,display_name,status) VALUES(${aircraft.id},${aircraft.manufacturer},${aircraft.model},${aircraft.displayName},'published') ON CONFLICT(aircraft_id) DO UPDATE SET manufacturer=EXCLUDED.manufacturer,model=EXCLUDED.model,display_name=EXCLUDED.display_name`;
    for(const variant of aircraft.variants) await sql`INSERT INTO training_aircraft_variants(aircraft_id,variant_key,display_name) VALUES(${aircraft.id},${variant},${variant}) ON CONFLICT(aircraft_id,variant_key) DO NOTHING`;
    const refs:string[]=[];
    for(const revision of aircraft.manuals) refs.push(await ensureBootstrapReference(aircraft.id,revision.id,revision as never,subject));
    refsByAircraft.set(aircraft.id,refs);
  }
  const domains:Array<[TrainingContentDomain,readonly {aircraftId:string}[]]>=[["learning",staticTrainingContentSeed.learningContent],["normal-flight",staticTrainingContentSeed.normalFlights],["orientation",staticTrainingContentSeed.cockpitOrientations],["abnormal",staticTrainingContentSeed.abnormalTrainings],["reference-knowledge",staticTrainingContentSeed.referenceKnowledge]];
  for(const [domain,records] of domains){
    for(const record of records){
      const published=await sql`SELECT 1 FROM training_content_items i JOIN training_content_publications p ON p.item_id=i.item_id WHERE i.aircraft_id=${record.aircraftId} AND i.domain=${domain} AND i.content_key='bundle' LIMIT 1` as unknown[];
      if(published[0])continue;
      const versionId=await createDraftVersion({aircraftId:record.aircraftId,domain,contentKey:"bundle",payload:record,origin:"bootstrap-migration",sourceReferenceIds:refsByAircraft.get(record.aircraftId)??[]},subject);
      await approveContentVersion(versionId,subject,"Explicit migration approval of the existing source-backed v1 Learjet content.");
      await publishContentVersion(versionId,subject);
    }
  }
}

import "server-only";

import { sql } from "./db";
import { assertSourceReferencesBelongToAircraft,getContentVersionForReview } from "./content-governance";
import { createGovernedDraftVersion } from "./content-governed-lifecycle";

export type FingerprintSourceReference = {
  readonly id: string;
  readonly revisionId: string;
  readonly manualTitle: string;
  readonly revision: string;
  readonly pageLabel: string;
  readonly chapter?: string;
  readonly section?: string;
  readonly checksumSha256: string;
};

export async function listFingerprintSourceReferencesForAircraft(aircraftId:string):Promise<readonly FingerprintSourceReference[]>{
  const rows=await sql`SELECT sr.reference_id,sr.revision_id,m.title,r.revision_code,sr.page_label,sr.chapter,sr.section,r.checksum_sha256
    FROM training_source_references sr
    JOIN training_manual_revisions r ON r.revision_id=sr.revision_id
    JOIN training_manuals m ON m.manual_id=r.manual_id
    WHERE m.aircraft_id=${aircraftId}
      AND r.checksum_sha256 IS NOT NULL
    ORDER BY r.registered_at DESC,sr.created_at DESC` as Array<{reference_id:string;revision_id:string;title:string;revision_code:string;page_label:string;chapter:string|null;section:string|null;checksum_sha256:string}>;
  return rows.map(row=>({id:row.reference_id,revisionId:row.revision_id,manualTitle:row.title,revision:row.revision_code,pageLabel:row.page_label,chapter:row.chapter??undefined,section:row.section??undefined,checksumSha256:row.checksum_sha256}));
}

export async function reviseContentVersion(input:{versionId:string;payload:unknown;sourceReferenceIds?:readonly string[]},subject:string):Promise<string>{
  const current=await getContentVersionForReview(input.versionId);
  if(!current)throw new Error("Content version not found.");
  const refs=input.sourceReferenceIds?.length?input.sourceReferenceIds:current.sourceReferenceIds;
  await assertSourceReferencesBelongToAircraft(current.aircraftId,refs);
  return createGovernedDraftVersion({aircraftId:current.aircraftId,domain:current.domain,contentKey:current.contentKey,payload:input.payload,origin:"human",sourceReferenceIds:refs},subject);
}

export async function reSourceContentVersion(input:{versionId:string;sourceReferenceIds:readonly string[]},subject:string):Promise<{versionId:string;aircraftId:string}>{
  const current=await getContentVersionForReview(input.versionId);
  if(!current)throw new Error("Content version not found.");

  const requested=[...new Set(input.sourceReferenceIds.map(id=>id.trim()).filter(Boolean))];
  if(!requested.length)throw new Error("Select at least one fingerprint-backed source reference.");

  const fingerprinted=await listFingerprintSourceReferencesForAircraft(current.aircraftId);
  const allowed=new Set(fingerprinted.map(reference=>reference.id));
  const invalid=requested.filter(id=>!allowed.has(id));
  if(invalid.length)throw new Error(`Selected source references are not backed by fingerprinted source records for aircraft ${current.aircraftId}: ${invalid.join(", ")}`);

  const versionId=await createGovernedDraftVersion({
    aircraftId:current.aircraftId,
    domain:current.domain,
    contentKey:current.contentKey,
    payload:current.payload,
    origin:"human",
    sourceReferenceIds:requested,
  },subject);
  return {versionId,aircraftId:current.aircraftId};
}

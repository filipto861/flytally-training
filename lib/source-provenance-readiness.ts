import "server-only";

import type { TrainingContentDomain } from "./content-admin-types";
import { sql } from "./db";
import {
  requiresOperationalSourceAuthority,
  resolveContentSourcePolicy,
  sourcePolicyAllowsAuthority,
} from "./source-authority";

type PublicationRow={
  readonly domain:TrainingContentDomain;
  readonly version_id:string;
  readonly payload:unknown;
};
type AuthorityRow={
  readonly version_id:string;
  readonly authority_role:string;
};

function json(value:unknown):unknown{
  if(typeof value!=="string")return value;
  try{return JSON.parse(value);}catch{return value;}
}

function sourcePolicyFromPayload(payload:unknown){
  const parsed=json(payload);
  const record=parsed&&typeof parsed==="object"&&!Array.isArray(parsed)
    ? parsed as Record<string,unknown>
    : {};
  return resolveContentSourcePolicy(record.sourcePolicy);
}

/**
 * A release is source-governed when every effective published training bundle
 * has exact source references tied to immutable, classified source revisions.
 * Operational domains resolve the effective payload sourcePolicy and apply the
 * same canonical authority rules used by approval/publication governance.
 * Missing or unknown sourcePolicy therefore remains fail-closed via the
 * historic faa-approved default. No source document needs to be hosted by
 * FlyTally.
 */
export async function hasCompletePublishedSourceProvenance(aircraftId:string):Promise<boolean>{
  const publications=await sql`SELECT ci.domain,p.version_id,v.payload
    FROM training_content_items ci
    JOIN training_content_publications p ON p.item_id=ci.item_id
    JOIN training_content_versions v ON v.version_id=p.version_id
    WHERE ci.aircraft_id=${aircraftId}
      AND ci.content_key='bundle'
      AND ci.domain<>'orientation'
    ORDER BY ci.domain,p.version_id` as unknown as PublicationRow[];
  if(publications.length===0)return false;

  const authorityRows=await sql`SELECT p.version_id,r.authority_role
    FROM training_content_items ci
    JOIN training_content_publications p ON p.item_id=ci.item_id
    JOIN training_content_version_sources cvs ON cvs.version_id=p.version_id
    JOIN training_source_references sr ON sr.reference_id=cvs.reference_id
    JOIN training_manual_revisions r ON r.revision_id=sr.revision_id
    JOIN training_manuals m ON m.manual_id=r.manual_id AND m.aircraft_id=ci.aircraft_id
    WHERE ci.aircraft_id=${aircraftId}
      AND ci.content_key='bundle'
      AND ci.domain<>'orientation'
    ORDER BY p.version_id,cvs.reference_id` as unknown as AuthorityRow[];

  const rolesByVersion=new Map<string,string[]>();
  for(const row of authorityRows){
    const roles=rolesByVersion.get(row.version_id)??[];
    roles.push(row.authority_role);
    rolesByVersion.set(row.version_id,roles);
  }

  return publications.every(publication=>{
    const roles=rolesByVersion.get(publication.version_id)??[];
    if(roles.length===0||roles.some(role=>role==="UNCLASSIFIED"))return false;
    if(!requiresOperationalSourceAuthority(publication.domain))return true;

    const sourcePolicy=sourcePolicyFromPayload(publication.payload);
    return roles.every(role=>sourcePolicyAllowsAuthority(sourcePolicy,role));
  });
}

import "server-only";

import { commonAircraftEquipmentProfileKey } from "./aircraft-configuration-profile";
import {
  assertApplicabilityEquipmentRegistered,
  assertApplicabilityVariantsRegistered,
} from "./content-applicability-binding";
import {
  deriveAircraftPackageReadiness,
  type AircraftPackageReadiness,
  type AircraftPackageReadinessFacts,
} from "./aircraft-package-readiness-model";
import { validateContentPayload } from "./content-contracts";
import type { TrainingContentDomain } from "./content-admin-types";
import { sql } from "./db";
import { hasCompletePublishedSourceProvenance } from "./source-provenance-readiness";

type SummaryRow={
  source_revision_count:number|string;
  source_reference_count:number|string;
  published_module_count:number|string;
  pending_version_count:number|string;
  fresh:boolean;
};
type PublishedRow={domain:TrainingContentDomain;payload:unknown};
type VariantRow={variant_key:string;metadata:unknown};

function parseJson(value:unknown):unknown{
  if(typeof value!=="string")return value;
  try{return JSON.parse(value);}catch{return value;}
}
function metadata(value:unknown):Record<string,unknown>{
  const parsed=parseJson(value);
  return parsed&&typeof parsed==="object"&&!Array.isArray(parsed)?parsed as Record<string,unknown>:{};
}
function stringArray(value:unknown):string[]{
  return Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"&&Boolean(item.trim())).map(item=>item.trim()):[];
}
function validAircraftId(value:string):string{
  const id=value.trim();
  if(!id||id.length>128||!/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(id))throw new Error("Invalid aircraft id.");
  return id;
}

export async function getAircraftPackageReadiness(value:string):Promise<AircraftPackageReadiness>{
  const aircraftId=validAircraftId(value);
  const [summaryRows,publishedRows,variantRows]=await Promise.all([
    sql`SELECT
      (SELECT COUNT(*)::int FROM training_manual_revisions r JOIN training_manuals m ON m.manual_id=r.manual_id WHERE m.aircraft_id=a.aircraft_id) AS source_revision_count,
      (SELECT COUNT(*)::int FROM training_source_references sr JOIN training_manual_revisions r ON r.revision_id=sr.revision_id JOIN training_manuals m ON m.manual_id=r.manual_id WHERE m.aircraft_id=a.aircraft_id) AS source_reference_count,
      (SELECT COUNT(*)::int FROM training_content_items i JOIN training_content_publications p ON p.item_id=i.item_id WHERE i.aircraft_id=a.aircraft_id AND i.content_key='bundle' AND i.domain<>'orientation') AS published_module_count,
      (SELECT COUNT(*)::int FROM training_content_items i JOIN training_content_versions v ON v.item_id=i.item_id WHERE i.aircraft_id=a.aircraft_id AND v.state IN ('draft','approved')) AS pending_version_count,
      NOT EXISTS(
        SELECT 1 FROM training_content_publications p
        JOIN training_content_items i ON i.item_id=p.item_id
        JOIN training_content_stale_flags sf ON sf.version_id=p.version_id
        WHERE i.aircraft_id=a.aircraft_id AND i.content_key='bundle' AND i.domain<>'orientation' AND sf.resolved_at IS NULL
      ) AS fresh
      FROM training_aircraft_types a WHERE a.aircraft_id=${aircraftId} LIMIT 1` as unknown as Promise<SummaryRow[]>,
    sql`SELECT i.domain,v.payload
      FROM training_content_items i
      JOIN training_content_publications p ON p.item_id=i.item_id
      JOIN training_content_versions v ON v.version_id=p.version_id
      WHERE i.aircraft_id=${aircraftId} AND i.content_key='bundle' AND i.domain<>'orientation'` as unknown as Promise<PublishedRow[]>,
    sql`SELECT variant_key,metadata FROM training_aircraft_variants WHERE aircraft_id=${aircraftId}` as unknown as Promise<VariantRow[]>,
  ]);

  const summary=summaryRows[0];
  if(!summary)throw new Error("Aircraft not found.");

  const payloads=publishedRows.map(row=>({domain:row.domain,payload:parseJson(row.payload)}));
  const publishedContractsValid=payloads.every(row=>validateContentPayload(row.domain,row.payload,aircraftId).length===0);

  const variantKeys=variantRows.filter(row=>row.variant_key!==commonAircraftEquipmentProfileKey).map(row=>row.variant_key);
  const equipmentTags=[...new Set(variantRows.flatMap(row=>stringArray(metadata(row.metadata).equipmentTags)))];
  let applicabilityCurrent=true;
  try{
    for(const row of payloads){
      assertApplicabilityVariantsRegistered(row.payload,variantKeys,aircraftId);
      assertApplicabilityEquipmentRegistered(row.payload,equipmentTags,aircraftId);
    }
  }catch{
    applicabilityCurrent=false;
  }

  const publishedModuleCount=Number(summary.published_module_count);
  const sourceProvenanceComplete=publishedModuleCount>0
    ? await hasCompletePublishedSourceProvenance(aircraftId)
    : false;

  const facts:AircraftPackageReadinessFacts={
    sourceRevisionCount:Number(summary.source_revision_count),
    sourceReferenceCount:Number(summary.source_reference_count),
    publishedModuleCount,
    pendingVersionCount:Number(summary.pending_version_count),
    publishedContractsValid:publishedModuleCount>0&&publishedContractsValid,
    applicabilityCurrent:publishedModuleCount>0&&applicabilityCurrent,
    sourceProvenanceComplete,
    fresh:publishedModuleCount>0&&summary.fresh===true,
  };
  return deriveAircraftPackageReadiness(facts);
}

export async function assertAircraftPackageReadyForCatalogue(aircraftId:string):Promise<AircraftPackageReadiness>{
  const readiness=await getAircraftPackageReadiness(aircraftId);
  if(!readiness.ready){
    throw new Error(`Aircraft package is not ready for catalogue publication: ${readiness.blockers.map(blocker=>blocker.detail).join(" ")}`);
  }
  return readiness;
}

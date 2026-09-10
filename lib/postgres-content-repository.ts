import "server-only";

import type { AircraftAbnormalTraining } from "./abnormal-scenarios";
import type { TrainingAircraft, TrainingManualRevision } from "./aircraft-catalog";
import type { CockpitOrientation } from "./cockpit-orientation";
import type { TrainingContentDomain } from "./content-admin-types";
import type { TrainingContentRepository } from "./content-repository";
import { sql } from "./db";
import type { AircraftLearningContent } from "./learning-content";
import type { AircraftReferenceKnowledge } from "./reference-knowledge";
import type { SimulatorFlightFlow } from "./simulator-checklists";

function asArray(value:unknown):unknown[]{if(Array.isArray(value))return value;if(typeof value==="string"){try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed:[];}catch{return[];}}return[];}
function asObject(value:unknown):Record<string,unknown>{if(value&&typeof value==="object"&&!Array.isArray(value))return value as Record<string,unknown>;if(typeof value==="string"){try{const parsed=JSON.parse(value);return parsed&&typeof parsed==="object"&&!Array.isArray(parsed)?parsed:{};}catch{return{};}}return{};}

type AircraftRow={aircraft_id:string;manufacturer:string;model:string;display_name:string};
type VariantRow={aircraft_id:string;variant_key:string};
type ManualRow={aircraft_id:string;revision_id:string;title:string;publisher:string;revision_code:string;issue_date:string;source_kind:TrainingManualRevision["sourceKind"];authority_note:string;source_metadata:unknown;chapters:unknown};
type DomainRow={domain:TrainingContentDomain};

function mapManual(row:ManualRow):TrainingManualRevision{
  const metadata=asObject(row.source_metadata);
  return{
    id:row.revision_id,
    title:row.title,
    publisher:row.publisher,
    revision:row.revision_code,
    issueDate:row.issue_date,
    sourceKind:row.source_kind,
    authorityNote:row.authority_note,
    sourceReferences:{
      identityPage:Number(metadata.identityPage??0),
      authorityNoticePage:Number(metadata.authorityNoticePage??0),
      revisionPage:Number(metadata.revisionPage??0),
      contentsPage:Number(metadata.contentsPage??0),
    },
    chapters:asArray(row.chapters) as TrainingManualRevision["chapters"],
  };
}

function addGrouped<T>(map:Map<string,T[]>,key:string,value:T){const values=map.get(key);if(values)values.push(value);else map.set(key,[value]);}

export class PostgresTrainingContentRepository implements TrainingContentRepository {
  /** Learner reads intentionally perform SELECTs only. */
  private async publishedPayload<T>(aircraftId:string,domain:TrainingContentDomain,contentKey="bundle"):Promise<T|undefined>{
    const rows=await sql`SELECT v.payload FROM training_content_items i JOIN training_content_publications p ON p.item_id=i.item_id JOIN training_content_versions v ON v.version_id=p.version_id JOIN training_aircraft_types a ON a.aircraft_id=i.aircraft_id WHERE i.aircraft_id=${aircraftId} AND i.domain=${domain} AND i.content_key=${contentKey} AND a.status='published' LIMIT 1` as Array<{payload:unknown}>;
    return rows[0]?.payload as T|undefined;
  }

  async listPublishedModuleDomains(aircraftId:string):Promise<readonly TrainingContentDomain[]>{
    const rows=await sql`SELECT DISTINCT i.domain FROM training_content_items i JOIN training_content_publications p ON p.item_id=i.item_id JOIN training_aircraft_types a ON a.aircraft_id=i.aircraft_id WHERE i.aircraft_id=${aircraftId} AND a.status='published' ORDER BY i.domain` as DomainRow[];
    return rows.map(row=>row.domain);
  }

  getPublishedModule<T>(aircraftId:string,domain:TrainingContentDomain,contentKey="bundle"):Promise<T|undefined>{
    return this.publishedPayload<T>(aircraftId,domain,contentKey);
  }

  async listAircraft():Promise<readonly TrainingAircraft[]>{
    const [aircraftRaw,variantRaw,manualRaw]=await Promise.all([
      sql`SELECT aircraft_id,manufacturer,model,display_name FROM training_aircraft_types WHERE status='published' ORDER BY display_name`,
      sql`SELECT v.aircraft_id,v.variant_key FROM training_aircraft_variants v JOIN training_aircraft_types a ON a.aircraft_id=v.aircraft_id WHERE a.status='published' ORDER BY v.aircraft_id,v.variant_key`,
      sql`SELECT m.aircraft_id,r.revision_id,m.title,m.publisher,r.revision_code,r.issue_date,m.source_kind,r.authority_note,r.source_metadata,r.chapters FROM training_manuals m JOIN training_manual_revisions r ON r.manual_id=m.manual_id JOIN training_aircraft_types a ON a.aircraft_id=m.aircraft_id WHERE a.status='published' ORDER BY m.aircraft_id,r.registered_at DESC`,
    ]);
    const aircraftRows=aircraftRaw as AircraftRow[];
    const variantRows=variantRaw as VariantRow[];
    const manualRows=manualRaw as ManualRow[];

    const variantsByAircraft=new Map<string,string[]>();
    const manualsByAircraft=new Map<string,TrainingManualRevision[]>();
    for(const row of variantRows)addGrouped(variantsByAircraft,row.aircraft_id,row.variant_key);
    for(const row of manualRows)addGrouped(manualsByAircraft,row.aircraft_id,mapManual(row));

    return aircraftRows.map(row=>({
      id:row.aircraft_id,
      manufacturer:row.manufacturer,
      model:row.model,
      displayName:row.display_name,
      variants:variantsByAircraft.get(row.aircraft_id)??[],
      manuals:manualsByAircraft.get(row.aircraft_id)??[],
    }));
  }

  async getAircraft(aircraftId:string):Promise<TrainingAircraft|undefined>{
    const rows=await sql`SELECT aircraft_id,manufacturer,model,display_name FROM training_aircraft_types WHERE aircraft_id=${aircraftId} AND status='published' LIMIT 1` as AircraftRow[];
    const row=rows[0];if(!row)return undefined;
    const [variantRaw,manualRaw]=await Promise.all([
      sql`SELECT aircraft_id,variant_key FROM training_aircraft_variants WHERE aircraft_id=${aircraftId} ORDER BY variant_key`,
      sql`SELECT m.aircraft_id,r.revision_id,m.title,m.publisher,r.revision_code,r.issue_date,m.source_kind,r.authority_note,r.source_metadata,r.chapters FROM training_manuals m JOIN training_manual_revisions r ON r.manual_id=m.manual_id WHERE m.aircraft_id=${aircraftId} ORDER BY r.registered_at DESC`,
    ]);
    const variants=variantRaw as VariantRow[];
    const manuals=manualRaw as ManualRow[];
    return{id:row.aircraft_id,manufacturer:row.manufacturer,model:row.model,displayName:row.display_name,variants:variants.map(v=>v.variant_key),manuals:manuals.map(mapManual)};
  }

  getLearningContent(aircraftId:string){return this.publishedPayload<AircraftLearningContent>(aircraftId,"learning");}
  getNormalFlight(aircraftId:string){return this.publishedPayload<SimulatorFlightFlow>(aircraftId,"normal-flight");}
  getCockpitOrientation(aircraftId:string){return this.publishedPayload<CockpitOrientation>(aircraftId,"orientation");}
  getAbnormalTraining(aircraftId:string){return this.publishedPayload<AircraftAbnormalTraining>(aircraftId,"abnormal");}
  getReferenceKnowledge(aircraftId:string){return this.publishedPayload<AircraftReferenceKnowledge>(aircraftId,"reference-knowledge");}
}

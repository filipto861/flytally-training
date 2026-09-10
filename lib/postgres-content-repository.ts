import "server-only";

import type { AircraftAbnormalTraining } from "./abnormal-scenarios";
import type { TrainingAircraft, TrainingManualRevision } from "./aircraft-catalog";
import type { CockpitOrientation } from "./cockpit-orientation";
import { ensureContentSchema } from "./content-admin-repository";
import type { TrainingContentRepository } from "./content-repository";
import { sql } from "./db";
import type { AircraftLearningContent } from "./learning-content";
import type { AircraftReferenceKnowledge } from "./reference-knowledge";
import type { SimulatorFlightFlow } from "./simulator-checklists";
import type { TrainingContentDomain } from "./content-admin-types";

function asArray(value:unknown):unknown[]{if(Array.isArray(value))return value;if(typeof value==="string"){try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed:[];}catch{return[];}}return[];}
function asObject(value:unknown):Record<string,unknown>{if(value&&typeof value==="object"&&!Array.isArray(value))return value as Record<string,unknown>;if(typeof value==="string"){try{const parsed=JSON.parse(value);return parsed&&typeof parsed==="object"&&!Array.isArray(parsed)?parsed:{};}catch{return{};}}return{};}

export class PostgresTrainingContentRepository implements TrainingContentRepository {
  private async publishedPayload<T>(aircraftId:string,domain:TrainingContentDomain):Promise<T|undefined>{
    await ensureContentSchema();
    const rows=await sql`SELECT v.payload FROM training_content_items i JOIN training_content_publications p ON p.item_id=i.item_id JOIN training_content_versions v ON v.version_id=p.version_id JOIN training_aircraft_types a ON a.aircraft_id=i.aircraft_id WHERE i.aircraft_id=${aircraftId} AND i.domain=${domain} AND i.content_key='bundle' AND a.status='published' LIMIT 1` as Array<{payload:unknown}>;
    return rows[0]?.payload as T|undefined;
  }

  async listAircraft():Promise<readonly TrainingAircraft[]>{
    await ensureContentSchema();
    const rows=await sql`SELECT aircraft_id FROM training_aircraft_types WHERE status='published' ORDER BY display_name` as Array<{aircraft_id:string}>;
    const aircraft=await Promise.all(rows.map(row=>this.getAircraft(row.aircraft_id)));
    return aircraft.filter((item):item is TrainingAircraft=>Boolean(item));
  }

  async getAircraft(aircraftId:string):Promise<TrainingAircraft|undefined>{
    await ensureContentSchema();
    const rows=await sql`SELECT aircraft_id,manufacturer,model,display_name FROM training_aircraft_types WHERE aircraft_id=${aircraftId} AND status='published' LIMIT 1` as Array<{aircraft_id:string;manufacturer:string;model:string;display_name:string}>;
    const row=rows[0];if(!row)return undefined;
    const variants=await sql`SELECT variant_key FROM training_aircraft_variants WHERE aircraft_id=${aircraftId} ORDER BY variant_key` as Array<{variant_key:string}>;
    const manuals=await sql`SELECT r.revision_id,m.title,m.publisher,r.revision_code,r.issue_date,m.source_kind,r.authority_note,r.source_metadata,r.chapters FROM training_manuals m JOIN training_manual_revisions r ON r.manual_id=m.manual_id WHERE m.aircraft_id=${aircraftId} ORDER BY r.registered_at DESC` as Array<{revision_id:string;title:string;publisher:string;revision_code:string;issue_date:string;source_kind:TrainingManualRevision["sourceKind"];authority_note:string;source_metadata:unknown;chapters:unknown}>;
    return {id:row.aircraft_id,manufacturer:row.manufacturer,model:row.model,displayName:row.display_name,variants:variants.map(v=>v.variant_key),manuals:manuals.map((m):TrainingManualRevision=>{const metadata=asObject(m.source_metadata);return{id:m.revision_id,title:m.title,publisher:m.publisher,revision:m.revision_code,issueDate:m.issue_date,sourceKind:m.source_kind,authorityNote:m.authority_note,sourceReferences:{identityPage:Number(metadata.identityPage??0),authorityNoticePage:Number(metadata.authorityNoticePage??0),revisionPage:Number(metadata.revisionPage??0),contentsPage:Number(metadata.contentsPage??0)},chapters:asArray(m.chapters) as TrainingManualRevision["chapters"]};})};
  }

  getLearningContent(aircraftId:string){return this.publishedPayload<AircraftLearningContent>(aircraftId,"learning");}
  getNormalFlight(aircraftId:string){return this.publishedPayload<SimulatorFlightFlow>(aircraftId,"normal-flight");}
  getCockpitOrientation(aircraftId:string){return this.publishedPayload<CockpitOrientation>(aircraftId,"orientation");}
  getAbnormalTraining(aircraftId:string){return this.publishedPayload<AircraftAbnormalTraining>(aircraftId,"abnormal");}
  getReferenceKnowledge(aircraftId:string){return this.publishedPayload<AircraftReferenceKnowledge>(aircraftId,"reference-knowledge");}
}

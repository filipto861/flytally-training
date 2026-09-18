import "server-only";

import type { TrainingContentDomain } from "./content-admin-types";
import { sql } from "./db";

type DomainRow={readonly domain:TrainingContentDomain};

/**
 * A release is source-governed when every effective published training bundle
 * has exact source references tied to immutable, classified source revisions.
 * Safety-critical operational domains are stricter: every linked source must
 * be a CONTROLLING or OPERATING_REFERENCE source. No source document needs to
 * be hosted by FlyTally.
 */
export async function hasCompletePublishedSourceProvenance(aircraftId:string):Promise<boolean>{
  const required=await sql`SELECT DISTINCT ci.domain
    FROM training_content_items ci
    JOIN training_content_publications p ON p.item_id=ci.item_id
    WHERE ci.aircraft_id=${aircraftId}
      AND ci.content_key='bundle'
      AND ci.domain<>'orientation'
    ORDER BY ci.domain` as unknown as DomainRow[];
  if(required.length===0)return false;

  const covered=await sql`SELECT ci.domain
    FROM training_content_items ci
    JOIN training_content_publications p ON p.item_id=ci.item_id
    JOIN training_content_version_sources cvs ON cvs.version_id=p.version_id
    JOIN training_source_references sr ON sr.reference_id=cvs.reference_id
    JOIN training_manual_revisions r ON r.revision_id=sr.revision_id
    JOIN training_manuals m ON m.manual_id=r.manual_id AND m.aircraft_id=ci.aircraft_id
    WHERE ci.aircraft_id=${aircraftId}
      AND ci.content_key='bundle'
      AND ci.domain<>'orientation'
    GROUP BY ci.domain
    HAVING BOOL_AND(r.authority_role<>'UNCLASSIFIED')
      AND BOOL_AND(
        CASE
          WHEN ci.domain IN ('checklists','procedures','performance','weight-balance','limitations','abnormal')
            THEN r.authority_role IN ('CONTROLLING','OPERATING_REFERENCE')
          ELSE TRUE
        END
      )
    ORDER BY ci.domain` as unknown as DomainRow[];
  const coveredDomains=new Set(covered.map(row=>row.domain));
  return required.every(row=>coveredDomains.has(row.domain));
}

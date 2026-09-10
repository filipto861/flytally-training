import "server-only";

import { publishGovernedAircraft } from "./aircraft-publication";
import type { TrainingContentDomain } from "./content-admin-types";
import {
  approveGovernedContentVersion,
  createGovernedDraftVersion,
  publishGovernedContentVersion,
} from "./content-governed-lifecycle";
import { sql } from "./db";
import { staticTrainingContentSeed } from "./static-content-repository";

async function ensureBootstrapReference(
  aircraftId: string,
  manualId: string,
  revision: {
    id: string;
    title: string;
    publisher: string;
    revision: string;
    issueDate: string;
    sourceKind: string;
    authorityNote: string;
    sourceReferences: object;
    chapters: readonly unknown[];
  },
  subject: string,
): Promise<string> {
  await sql`INSERT INTO training_manuals(manual_id,aircraft_id,title,publisher,source_kind)
    VALUES(${manualId},${aircraftId},${revision.title},${revision.publisher},${revision.sourceKind})
    ON CONFLICT(manual_id) DO NOTHING`;

  const manuals = await sql`SELECT aircraft_id FROM training_manuals WHERE manual_id=${manualId} LIMIT 1` as Array<{aircraft_id:string}>;
  if (manuals[0]?.aircraft_id !== aircraftId) throw new Error(`Bootstrap manual ${manualId} belongs to another aircraft.`);

  await sql`INSERT INTO training_manual_revisions(revision_id,manual_id,revision_code,issue_date,authority_note,source_metadata,chapters,registered_by)
    VALUES(${revision.id},${manualId},${revision.revision},${revision.issueDate},${revision.authorityNote},${JSON.stringify(revision.sourceReferences)}::jsonb,${JSON.stringify(revision.chapters)}::jsonb,${subject})
    ON CONFLICT(revision_id) DO NOTHING`;

  const revisions = await sql`SELECT manual_id FROM training_manual_revisions WHERE revision_id=${revision.id} LIMIT 1` as Array<{manual_id:string}>;
  if (revisions[0]?.manual_id !== manualId) throw new Error(`Bootstrap revision ${revision.id} belongs to another manual.`);

  const referenceId = `bootstrap:${revision.id}`;
  await sql`INSERT INTO training_source_references(reference_id,revision_id,chapter,section,page_label,note,created_by)
    VALUES(${referenceId},${revision.id},NULL,'Registered revision','multiple','Bootstrap provenance; detailed page references remain embedded in the migrated content payload.',${subject})
    ON CONFLICT(reference_id) DO NOTHING`;
  return referenceId;
}

/**
 * Import the source-backed static v1 seed through the same governed lifecycle
 * used by ordinary authoring. A newly seeded aircraft remains hidden as draft
 * until the shared aircraft-publication policy confirms its learner catalogue
 * is complete.
 */
export async function bootstrapStaticContentGoverned(subject: string): Promise<void> {
  const referencesByAircraft = new Map<string, string[]>();

  for (const aircraft of staticTrainingContentSeed.aircraft) {
    await sql`INSERT INTO training_aircraft_types(aircraft_id,manufacturer,model,display_name,status)
      VALUES(${aircraft.id},${aircraft.manufacturer},${aircraft.model},${aircraft.displayName},'draft')
      ON CONFLICT(aircraft_id) DO UPDATE
        SET manufacturer=EXCLUDED.manufacturer,model=EXCLUDED.model,display_name=EXCLUDED.display_name`;

    for (const variant of aircraft.variants) {
      await sql`INSERT INTO training_aircraft_variants(aircraft_id,variant_key,display_name)
        VALUES(${aircraft.id},${variant},${variant})
        ON CONFLICT(aircraft_id,variant_key) DO NOTHING`;
    }

    const references: string[] = [];
    for (const revision of aircraft.manuals) {
      references.push(await ensureBootstrapReference(
        aircraft.id,
        revision.id,
        revision as typeof revision & { sourceReferences: object; chapters: readonly unknown[] },
        subject,
      ));
    }
    referencesByAircraft.set(aircraft.id, references);
  }

  const domains: Array<[TrainingContentDomain, readonly {aircraftId:string}[]]> = [
    ["learning", staticTrainingContentSeed.learningContent],
    ["normal-flight", staticTrainingContentSeed.normalFlights],
    ["orientation", staticTrainingContentSeed.cockpitOrientations],
    ["abnormal", staticTrainingContentSeed.abnormalTrainings],
    ["reference-knowledge", staticTrainingContentSeed.referenceKnowledge],
  ];

  for (const [domain, records] of domains) {
    for (const record of records) {
      const published = await sql`SELECT 1
        FROM training_content_items i
        JOIN training_content_publications p ON p.item_id=i.item_id
        WHERE i.aircraft_id=${record.aircraftId} AND i.domain=${domain} AND i.content_key='bundle'
        LIMIT 1` as unknown[];
      if (published[0]) continue;

      const versionId = await createGovernedDraftVersion({
        aircraftId: record.aircraftId,
        domain,
        contentKey: "bundle",
        payload: record,
        origin: "bootstrap-migration",
        sourceReferenceIds: referencesByAircraft.get(record.aircraftId) ?? [],
      }, subject);
      await approveGovernedContentVersion(
        versionId,
        subject,
        "Explicit migration approval of the existing source-backed v1 content.",
      );
      await publishGovernedContentVersion(versionId, subject);
    }
  }

  for (const aircraft of staticTrainingContentSeed.aircraft) {
    await publishGovernedAircraft(aircraft.id);
  }
}

import "server-only";

import { publishGovernedAircraft } from "./aircraft-publication";
import type { TrainingContentDomain } from "./content-admin-types";
import {
  approveGovernedContentVersion,
  createGovernedDraftVersion,
  publishGovernedContentVersion,
} from "./content-governed-lifecycle";
import { selectContentSourceReferenceIds } from "./content-source-binding";
import { sql } from "./db";
import { isSimulatorOnlyAuthority, type SourceAuthorityRole } from "./source-authority";
import { staticTrainingContentSeed, type StaticTrainingModule } from "./static-content-repository";

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
    authorityRole: SourceAuthorityRole;
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

  await sql`INSERT INTO training_manual_revisions(revision_id,manual_id,revision_code,issue_date,authority_role,authority_note,source_metadata,chapters,registered_by)
    VALUES(${revision.id},${manualId},${revision.revision},${revision.issueDate},${revision.authorityRole},${revision.authorityNote},${JSON.stringify(revision.sourceReferences)}::jsonb,${JSON.stringify(revision.chapters)}::jsonb,${subject})
    ON CONFLICT(revision_id) DO NOTHING`;

  const revisions = await sql`SELECT manual_id FROM training_manual_revisions WHERE revision_id=${revision.id} LIMIT 1` as Array<{manual_id:string}>;
  if (revisions[0]?.manual_id !== manualId) throw new Error(`Bootstrap revision ${revision.id} belongs to another manual.`);

  const referenceId = `bootstrap:${revision.id}`;
  await sql`INSERT INTO training_source_references(reference_id,revision_id,chapter,section,page_label,note,created_by)
    VALUES(${referenceId},${revision.id},NULL,'Registered revision','multiple','Bootstrap provenance; detailed page references remain embedded in the migrated content payload.',${subject})
    ON CONFLICT(reference_id) DO NOTHING`;
  return referenceId;
}

type BootstrapContentRecord = {
  readonly aircraftId: string;
  readonly domain: TrainingContentDomain;
  readonly payload: { readonly aircraftId: string };
};

function nativeSeedModules(): readonly StaticTrainingModule[] {
  return staticTrainingContentSeed.nativeModules ?? staticTrainingContentSeed.universalModules ?? [];
}

function bootstrapContentRecords(): BootstrapContentRecord[] {
  const records: BootstrapContentRecord[] = nativeSeedModules().map((module) => ({
    aircraftId: module.aircraftId,
    domain: module.domain,
    payload: module.payload,
  }));

  const legacy: Array<[TrainingContentDomain, readonly {aircraftId:string}[]]> = [
    ["learning", staticTrainingContentSeed.learningContent],
    ["normal-flight", staticTrainingContentSeed.normalFlights],
    ["orientation", staticTrainingContentSeed.cockpitOrientations],
    ["abnormal", staticTrainingContentSeed.abnormalTrainings],
    ["reference-knowledge", staticTrainingContentSeed.referenceKnowledge],
  ];
  for (const [domain, payloads] of legacy) {
    for (const payload of payloads) records.push({ aircraftId: payload.aircraftId, domain, payload });
  }
  return records;
}

async function registeredReferencesForAircraft(aircraftId: string): Promise<{
  referenceByManualId: ReadonlyMap<string, string>;
  legacyFallback: readonly string[];
}> {
  const rows = await sql`SELECT m.manual_id,r.authority_role,sr.reference_id
    FROM training_manuals m
    JOIN training_manual_revisions r ON r.manual_id=m.manual_id
    JOIN training_source_references sr ON sr.revision_id=r.revision_id
    WHERE m.aircraft_id=${aircraftId}
    ORDER BY r.registered_at DESC,sr.created_at DESC` as Array<{manual_id:string;authority_role:SourceAuthorityRole;reference_id:string}>;
  const referenceByManualId = new Map<string, string>();
  const legacyFallback: string[] = [];
  for (const row of rows) {
    if (!referenceByManualId.has(row.manual_id)) referenceByManualId.set(row.manual_id, row.reference_id);
    if (!isSimulatorOnlyAuthority(row.authority_role) && !legacyFallback.includes(row.reference_id)) legacyFallback.push(row.reference_id);
  }
  return { referenceByManualId, legacyFallback };
}

/**
 * Explicitly replace an already-published static/native seed module by creating
 * a new immutable governed version. This is intentionally separate from normal
 * bootstrap: ordinary deploys never rewrite published content.
 */
export async function publishStaticNativeModuleUpgrade(
  aircraftId: string,
  domain: TrainingContentDomain,
  subject: string,
): Promise<string> {
  const module = nativeSeedModules().find((candidate) => candidate.aircraftId === aircraftId && candidate.domain === domain);
  if (!module) throw new Error(`No native static ${domain} module is registered for ${aircraftId}.`);

  const aircraft = staticTrainingContentSeed.aircraft.find((candidate) => candidate.id === aircraftId);
  if (!aircraft) throw new Error(`Static aircraft ${aircraftId} is not registered.`);

  const { referenceByManualId, legacyFallback } = await registeredReferencesForAircraft(aircraftId);
  const sourceReferenceIds = selectContentSourceReferenceIds(module.payload, referenceByManualId, legacyFallback);
  if (sourceReferenceIds.length === 0) throw new Error("Native module upgrade has no registered source provenance.");

  const versionId = await createGovernedDraftVersion({
    aircraftId,
    domain,
    contentKey: "bundle",
    payload: module.payload,
    origin: "bootstrap-migration",
    sourceReferenceIds,
  }, subject);
  await approveGovernedContentVersion(
    versionId,
    subject,
    "Explicit administrator approval of the reviewed native source-backed module upgrade.",
  );
  await publishGovernedContentVersion(versionId, subject);
  return versionId;
}

/**
 * Import the source-backed static seed through the same governed lifecycle used
 * by ordinary authoring. Native modules and legacy migration bundles share one
 * data-driven publication loop; adding an aircraft does not require a new
 * aircraft-specific branch in the bootstrap code.
 */
export async function bootstrapStaticContentGoverned(subject: string): Promise<void> {
  const referencesByAircraft = new Map<string, Map<string, string>>();
  const legacyFallbackByAircraft = new Map<string, string[]>();

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

    const references = new Map<string, string>();
    const legacyFallback: string[] = [];
    for (const revision of aircraft.manuals) {
      const referenceId = await ensureBootstrapReference(
        aircraft.id,
        revision.id,
        revision as typeof revision & { sourceReferences: object; chapters: readonly unknown[] },
        subject,
      );
      references.set(revision.id, referenceId);
      if (!isSimulatorOnlyAuthority(revision.authorityRole)) legacyFallback.push(referenceId);
    }
    referencesByAircraft.set(aircraft.id, references);
    legacyFallbackByAircraft.set(aircraft.id, legacyFallback);
  }

  for (const record of bootstrapContentRecords()) {
    const published = await sql`SELECT 1
      FROM training_content_items i
      JOIN training_content_publications p ON p.item_id=i.item_id
      WHERE i.aircraft_id=${record.aircraftId} AND i.domain=${record.domain} AND i.content_key='bundle'
      LIMIT 1` as unknown[];
    if (published[0]) continue;

    const sourceReferences = referencesByAircraft.get(record.aircraftId) ?? new Map<string, string>();
    const sourceReferenceIds = selectContentSourceReferenceIds(
      record.payload,
      sourceReferences,
      legacyFallbackByAircraft.get(record.aircraftId) ?? [],
    );

    const versionId = await createGovernedDraftVersion({
      aircraftId: record.aircraftId,
      domain: record.domain,
      contentKey: "bundle",
      payload: record.payload,
      origin: "bootstrap-migration",
      sourceReferenceIds,
    }, subject);
    await approveGovernedContentVersion(
      versionId,
      subject,
      "Explicit migration approval of source-backed training content.",
    );
    await publishGovernedContentVersion(versionId, subject);
  }

  for (const aircraft of staticTrainingContentSeed.aircraft) {
    await publishGovernedAircraft(aircraft.id);
  }
}

import "server-only";

import { learjet35aNormalChecklist } from "../aircraft-data/learjet-35a/checklists/normal-checklist.ts";
import { learjet35aChecklistSourceManifest } from "../aircraft-data/learjet-35a/checklists/source-manifest.ts";
import {
  createSourceReference,
  getAdminAircraft,
} from "./content-admin-repository.ts";
import {
  approveGovernedContentVersion,
  createGovernedDraftVersion,
  publishGovernedContentVersion,
} from "./content-governed-lifecycle.ts";
import { registerGovernedManualRevision } from "./governed-manual-registration.ts";
import { sql } from "./db.ts";
import { validateUniversalTrainingContentPayload } from "./universal-aircraft-content.ts";

export type LearjetChecklistReleaseResult = {
  readonly status: "published" | "unchanged";
  readonly versionId: string;
  readonly sourceReferenceId: string;
};

type RegisteredRevisionRow = {
  readonly revision_id: string;
  readonly manual_id: string;
  readonly aircraft_id: string;
  readonly revision_code: string;
  readonly authority_role: string;
  readonly checksum_sha256: string | null;
};

async function registeredRevision(): Promise<RegisteredRevisionRow | undefined> {
  const source = learjet35aChecklistSourceManifest;
  const rows = await sql`
    SELECT
      r.revision_id,
      r.manual_id,
      m.aircraft_id,
      r.revision_code,
      r.authority_role,
      r.checksum_sha256
    FROM training_manual_revisions r
    JOIN training_manuals m ON m.manual_id=r.manual_id
    WHERE r.revision_id=${source.revisionId}
    LIMIT 1
  ` as unknown as RegisteredRevisionRow[];
  return rows[0];
}

function assertRevisionMatchesManifest(revision: RegisteredRevisionRow): void {
  const source = learjet35aChecklistSourceManifest;
  if (
    revision.manual_id !== source.manualId
    || revision.aircraft_id !== source.aircraftId
    || revision.revision_code !== source.revision
    || revision.authority_role !== source.authorityRole
    || revision.checksum_sha256 !== source.checksumSha256
  ) {
    throw new Error(
      "Registered CL-102B source revision does not match the reviewed checklist manifest.",
    );
  }
}

export async function publishLearjetChecklistRelease(
  subject: string,
): Promise<LearjetChecklistReleaseResult> {
  const validationErrors = validateUniversalTrainingContentPayload(
    "checklists",
    learjet35aNormalChecklist,
  );
  if (validationErrors.length) {
    throw new Error(
      `Learjet checklist payload failed validation: ${validationErrors.join("; ")}`,
    );
  }

  let aircraft = await getAdminAircraft(learjet35aChecklistSourceManifest.aircraftId);
  if (!aircraft) {
    throw new Error("Learjet 35A is not registered in the Training database.");
  }

  const source = learjet35aChecklistSourceManifest;
  let revision = await registeredRevision();

  if (!revision) {
    const conflictingFamily = aircraft.manuals.find(
      (candidate) =>
        candidate.manualId === source.manualId
        && candidate.revision === source.revision,
    );
    if (conflictingFamily) {
      throw new Error(
        `CL-102B ${source.revision} already exists with revision id ${conflictingFamily.revisionId}; refusing to create a competing identity.`,
      );
    }

    await registerGovernedManualRevision(
      {
        aircraftId: source.aircraftId,
        manualId: source.manualId,
        revisionId: source.revisionId,
        title: source.title,
        publisher: source.publisher,
        sourceKind: source.sourceKind,
        revision: source.revision,
        issueDate: source.issueDate,
        authorityRole: source.authorityRole,
        authorityNote: source.authorityNote,
        checksumSha256: source.checksumSha256,
        sourceMetadata: source.sourceMetadata,
        chapters: [],
      },
      subject,
    );

    revision = await registeredRevision();
  }

  if (!revision) {
    throw new Error("CL-102B source revision could not be registered.");
  }
  assertRevisionMatchesManifest(revision);

  aircraft = await getAdminAircraft(source.aircraftId);
  let sourceReference = aircraft?.sourceReferences.find(
    (candidate) =>
      candidate.revisionId === source.revisionId
      && candidate.chapter === source.reference.chapter
      && candidate.section === source.reference.section
      && candidate.pageLabel === source.reference.pageLabel,
  );

  if (!sourceReference) {
    const referenceId = await createSourceReference(
      {
        revisionId: source.revisionId,
        chapter: source.reference.chapter,
        section: source.reference.section,
        pageLabel: source.reference.pageLabel,
        note: source.reference.note,
      },
      subject,
    );
    aircraft = await getAdminAircraft(source.aircraftId);
    sourceReference = aircraft?.sourceReferences.find(
      (candidate) => candidate.id === referenceId,
    );
  }

  if (!sourceReference) {
    throw new Error(
      "CL-102B Normal Procedures source reference could not be registered.",
    );
  }

  const payloadJson = JSON.stringify(learjet35aNormalChecklist);
  const identicalPublished = await sql`
    SELECT v.version_id
    FROM training_content_items i
    JOIN training_content_publications p ON p.item_id=i.item_id
    JOIN training_content_versions v ON v.version_id=p.version_id
    WHERE i.aircraft_id=${source.aircraftId}
      AND i.domain='checklists'
      AND i.content_key='bundle'
      AND v.payload=${payloadJson}::jsonb
    LIMIT 1
  ` as unknown as Array<{ version_id: string }>;

  if (identicalPublished[0]) {
    return {
      status: "unchanged",
      versionId: identicalPublished[0].version_id,
      sourceReferenceId: sourceReference.id,
    };
  }

  const versionId = await createGovernedDraftVersion(
    {
      aircraftId: source.aircraftId,
      domain: "checklists",
      contentKey: "bundle",
      payload: learjet35aNormalChecklist,
      origin: "import",
      sourceReferenceIds: [sourceReference.id],
    },
    subject,
  );

  await approveGovernedContentVersion(
    versionId,
    subject,
    "Explicit administrator approval of the reviewed CL-102B Change 2 normal checklist payload.",
  );
  await publishGovernedContentVersion(versionId, subject);

  return {
    status: "published",
    versionId,
    sourceReferenceId: sourceReference.id,
  };
}

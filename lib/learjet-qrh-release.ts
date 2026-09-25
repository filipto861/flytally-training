import "server-only";

import {
  assertLearjet35aQrhPackageComplete,
  learjet35aQrhPackage,
} from "../aircraft-data/learjet-35a/qrh/package.ts";
import { learjet35aQrhSourceManifest } from "../aircraft-data/learjet-35a/qrh/source-manifest.ts";
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
import { validateUniversalAbnormalEmergencyPayload } from "./universal-abnormal-emergency.ts";

export type LearjetQrhReleaseResult = {
  readonly status: "published" | "unchanged";
  readonly versionId: string;
  readonly sourceReferenceIds: readonly string[];
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
  const source = learjet35aQrhSourceManifest;
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
  const source = learjet35aQrhSourceManifest;
  if (
    revision.manual_id !== source.manualId
    || revision.aircraft_id !== source.aircraftId
    || revision.revision_code !== source.revision
    || revision.authority_role !== source.authorityRole
    || revision.checksum_sha256 !== source.checksumSha256
  ) {
    throw new Error(
      "Registered CL-102B source revision does not match the reviewed QRH manifest.",
    );
  }
}

async function ensureReviewedRevision(subject: string): Promise<void> {
  const source = learjet35aQrhSourceManifest;
  let aircraft = await getAdminAircraft(source.aircraftId);
  if (!aircraft) {
    throw new Error("Learjet 35A is not registered in the Training database.");
  }

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
}

async function ensureSourceReferences(subject: string): Promise<readonly string[]> {
  const source = learjet35aQrhSourceManifest;
  let aircraft = await getAdminAircraft(source.aircraftId);
  if (!aircraft) {
    throw new Error("Learjet 35A is not registered in the Training database.");
  }

  const ids: string[] = [];
  for (const reference of source.references) {
    const existing = aircraft.sourceReferences.find(
      (candidate) =>
        candidate.revisionId === source.revisionId
        && candidate.chapter === reference.chapter
        && candidate.section === reference.section
        && candidate.pageLabel === reference.pageLabel,
    );

    if (existing) {
      ids.push(existing.id);
      continue;
    }

    const referenceId = await createSourceReference(
      {
        revisionId: source.revisionId,
        chapter: reference.chapter,
        section: reference.section,
        pageLabel: reference.pageLabel,
        note: reference.note,
      },
      subject,
    );
    ids.push(referenceId);
    aircraft = (await getAdminAircraft(source.aircraftId)) ?? aircraft;
  }

  if (ids.length !== source.references.length) {
    throw new Error("Every reviewed QRH source section must have a governed source reference.");
  }
  return ids;
}

export async function publishLearjetQrhRelease(
  subject: string,
): Promise<LearjetQrhReleaseResult> {
  assertLearjet35aQrhPackageComplete();

  const validationErrors =
    validateUniversalAbnormalEmergencyPayload(learjet35aQrhPackage);
  if (validationErrors.length) {
    throw new Error(
      `Learjet QRH payload failed validation: ${validationErrors.join("; ")}`,
    );
  }

  await ensureReviewedRevision(subject);
  const sourceReferenceIds = await ensureSourceReferences(subject);

  const source = learjet35aQrhSourceManifest;
  const payloadJson = JSON.stringify(learjet35aQrhPackage);
  const identicalPublished = await sql`
    SELECT v.version_id
    FROM training_content_items i
    JOIN training_content_publications p ON p.item_id=i.item_id
    JOIN training_content_versions v ON v.version_id=p.version_id
    WHERE i.aircraft_id=${source.aircraftId}
      AND i.domain='abnormal'
      AND i.content_key='bundle'
      AND v.payload=${payloadJson}::jsonb
    LIMIT 1
  ` as unknown as Array<{ version_id: string }>;

  if (identicalPublished[0]) {
    return {
      status: "unchanged",
      versionId: identicalPublished[0].version_id,
      sourceReferenceIds,
    };
  }

  const versionId = await createGovernedDraftVersion(
    {
      aircraftId: source.aircraftId,
      domain: "abnormal",
      contentKey: "bundle",
      payload: learjet35aQrhPackage,
      origin: "import",
      sourceReferenceIds,
    },
    subject,
  );

  await approveGovernedContentVersion(
    versionId,
    subject,
    "Explicit administrator approval of the complete reviewed CL-102B Change 2 Emergency + Abnormal QRH package.",
  );
  await publishGovernedContentVersion(versionId, subject);

  return {
    status: "published",
    versionId,
    sourceReferenceIds,
  };
}

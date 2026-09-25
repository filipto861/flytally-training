export {};

async function main(): Promise<void> {
  if (process.env.CONFIRM_LEARJET_CHECKLIST_PUBLISH !== "yes") {
    console.error(
      "Set CONFIRM_LEARJET_CHECKLIST_PUBLISH=yes to register/publish the reviewed Learjet checklist.",
    );
    process.exitCode = 2;
    return;
  }

  if (!process.env.TRAINING_DATABASE_URL?.trim()) {
    console.error("TRAINING_DATABASE_URL is required.");
    process.exitCode = 2;
    return;
  }

  process.env.TRAINING_CONTENT_BACKEND = "postgres";

  const [{ learjet35aNormalChecklist }, { learjet35aChecklistSourceManifest }] =
    await Promise.all([
      import("../aircraft-data/learjet-35a/checklists/normal-checklist.ts"),
      import("../aircraft-data/learjet-35a/checklists/source-manifest.ts"),
    ]);

  const [
    { createSourceReference, getAdminAircraft },
    { registerGovernedManualRevision },
    {
      approveGovernedContentVersion,
      createGovernedDraftVersion,
      publishGovernedContentVersion,
    },
    { validateUniversalTrainingContentPayload },
    { sql },
  ] = await Promise.all([
    import("../lib/content-admin-repository.ts"),
    import("../lib/governed-manual-registration.ts"),
    import("../lib/content-governed-lifecycle.ts"),
    import("../lib/universal-aircraft-content.ts"),
    import("../lib/db.ts"),
  ]);

  const subject =
    process.env.TRAINING_PUBLISH_SUBJECT?.trim()
    || "tooling:learjet-checklist-publish";

  const validationErrors = validateUniversalTrainingContentPayload(
    "checklists",
    learjet35aNormalChecklist,
  );
  if (validationErrors.length) {
    console.error("Learjet checklist payload failed validation:");
    validationErrors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  let aircraft = await getAdminAircraft(learjet35aChecklistSourceManifest.aircraftId);
  if (!aircraft) {
    console.error("Learjet 35A is not registered in the Training database.");
    process.exitCode = 1;
    return;
  }

  const source = learjet35aChecklistSourceManifest;
  let revision = aircraft.manuals.find(
    (candidate) => candidate.revisionId === source.revisionId,
  );

  if (!revision) {
    const conflictingFamily = aircraft.manuals.find(
      (candidate) =>
        candidate.manualId === source.manualId
        && candidate.revision === source.revision,
    );
    if (conflictingFamily) {
      console.error(
        `CL-102B ${source.revision} already exists with revision id ${conflictingFamily.revisionId}; refusing to create a competing identity.`,
      );
      process.exitCode = 1;
    return;
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

    aircraft = await getAdminAircraft(source.aircraftId);
    revision = aircraft?.manuals.find(
      (candidate) => candidate.revisionId === source.revisionId,
    );
  }

  if (!revision) {
    console.error("CL-102B source revision could not be registered.");
    process.exitCode = 1;
    return;
  }

  if (
    revision.manualId !== source.manualId
    || revision.authorityRole !== source.authorityRole
  ) {
    console.error(
      "Registered CL-102B source identity/authority does not match the reviewed manifest.",
    );
    process.exitCode = 1;
    return;
  }

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
    console.error("CL-102B Normal Procedures source reference could not be registered.");
    process.exitCode = 1;
    return;
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
    console.log(
      `Learjet checklist already published as ${identicalPublished[0].version_id}; no change required.`,
    );
    return;
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
    "Explicit reviewed import of the CL-102B Change 2 normal checklist payload.",
  );

  await publishGovernedContentVersion(versionId, subject);

  console.log(
    `Learjet checklist published successfully as governed version ${versionId}.`,
  );

}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

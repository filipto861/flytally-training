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

  const { publishLearjetChecklistRelease } =
    await import("../lib/learjet-checklist-release.ts");

  const result = await publishLearjetChecklistRelease(
    process.env.TRAINING_PUBLISH_SUBJECT?.trim()
    || "tooling:learjet-checklist-publish",
  );

  if (result.status === "unchanged") {
    console.log(
      `Learjet checklist already published as ${result.versionId}; no change required.`,
    );
    return;
  }

  console.log(
    `Learjet checklist published successfully as governed version ${result.versionId}.`,
  );
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

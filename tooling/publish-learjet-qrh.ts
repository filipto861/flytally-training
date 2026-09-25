export {};

async function main(): Promise<void> {
  if (process.env.CONFIRM_LEARJET_QRH_PUBLISH !== "yes") {
    console.error(
      "Set CONFIRM_LEARJET_QRH_PUBLISH=yes to register/publish the reviewed Learjet QRH.",
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

  const { publishLearjetQrhRelease } =
    await import("../lib/learjet-qrh-release.ts");

  const result = await publishLearjetQrhRelease(
    process.env.TRAINING_PUBLISH_SUBJECT?.trim()
    || "tooling:learjet-qrh-publish",
  );

  if (result.status === "unchanged") {
    console.log(
      `Learjet QRH already published as ${result.versionId}; no change required.`,
    );
    return;
  }

  console.log(
    `Learjet QRH published successfully as governed version ${result.versionId}.`,
  );
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";

import { learjet35aQrhPackage } from "../aircraft-data/learjet-35a/qrh/package.ts";
import { learjet35aQrhSourceManifest } from "../aircraft-data/learjet-35a/qrh/source-manifest.ts";
import { collectEmbeddedManualIds } from "../lib/content-source-binding.ts";
import { validateUniversalAbnormalEmergencyPayload } from "../lib/universal-abnormal-emergency.ts";

test("QRH.3U complete package is source-bound to the reviewed CL-102B revision", () => {
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(learjet35aQrhPackage), []);
  assert.deepEqual(collectEmbeddedManualIds(learjet35aQrhPackage), ["CL-102B"]);
  assert.equal(learjet35aQrhSourceManifest.revision, "Change 2");
  assert.equal(learjet35aQrhSourceManifest.authorityRole, "OPERATING_REFERENCE");
  assert.equal(
    learjet35aQrhSourceManifest.checksumSha256,
    "6fbddb29b1166f4e2b3093f8fb14c924fd08d0e28cb113ed6de6dd27c98ac049",
  );
  assert.deepEqual(
    learjet35aQrhSourceManifest.references.map((reference) => [
      reference.chapter,
      reference.pageLabel,
    ]),
    [
      ["Emergency Procedures", "E-i–E-35.1"],
      ["Abnormal Procedures", "A-i–A-35.2"],
    ],
  );
});

test("QRH.3U publisher boots under the real CJS/tsx runtime and stops at explicit confirmation", () => {
  const env = { ...process.env };
  delete env.CONFIRM_LEARJET_QRH_PUBLISH;
  delete env.TRAINING_DATABASE_URL;

  const run = spawnSync(
    process.execPath,
    [
      "--env-file-if-exists=.env.local",
      "--conditions=react-server",
      "--import",
      "tsx",
      "tooling/publish-learjet-qrh.ts",
    ],
    {
      cwd: process.cwd(),
      env,
      encoding: "utf8",
    },
  );

  assert.equal(run.status, 2);
  assert.match(run.stderr, /Set CONFIRM_LEARJET_QRH_PUBLISH=yes/);
  assert.doesNotMatch(
    `${run.stdout}\n${run.stderr}`,
    /Top-level await is currently not supported/,
  );
  assert.doesNotMatch(
    `${run.stdout}\n${run.stderr}`,
    /bad option: --env-file-if-exists/,
  );
});

test("QRH.3U publication tooling reuses the governed abnormal-domain lifecycle", () => {
  const tool = fs.readFileSync(
    new URL("../tooling/publish-learjet-qrh.ts", import.meta.url),
    "utf8",
  );
  const release = fs.readFileSync(
    new URL("../lib/learjet-qrh-release.ts", import.meta.url),
    "utf8",
  );

  assert.match(tool, /CONFIRM_LEARJET_QRH_PUBLISH !== "yes"/);
  assert.match(tool, /publishLearjetQrhRelease/);
  assert.doesNotMatch(tool, /createGovernedDraftVersion/);

  assert.match(release, /assertLearjet35aQrhPackageComplete\(\)/);
  assert.ok(
    release.indexOf("assertLearjet35aQrhPackageComplete()")
      < release.indexOf("validateUniversalAbnormalEmergencyPayload"),
  );
  assert.match(release, /validateUniversalAbnormalEmergencyPayload/);
  assert.match(release, /registerGovernedManualRevision/);
  assert.match(release, /createGovernedDraftVersion/);
  assert.match(release, /domain: "abnormal"/);
  assert.match(release, /approveGovernedContentVersion/);
  assert.match(release, /publishGovernedContentVersion/);
  assert.match(release, /status: "unchanged"/);
  assert.match(release, /training_content_publications/);
  assert.doesNotMatch(release, /bootstrapStaticContentGoverned/);
});

test("QRH.3U production release remains admin-authenticated and explicitly confirmed", () => {
  const actions = fs.readFileSync(
    new URL("../app/admin/release-actions.ts", import.meta.url),
    "utf8",
  );
  const page = fs.readFileSync(
    new URL("../app/admin/page.tsx", import.meta.url),
    "utf8",
  );

  const actionStart = actions.indexOf(
    "export async function publishLearjetQrhReleaseAction",
  );
  assert.notEqual(actionStart, -1);
  const action = actions.slice(actionStart);

  assert.ok(
    action.indexOf("await requireTrainingAdmin()")
      < action.indexOf('confirmLearjetQrhRelease") !== "yes"'),
  );
  assert.match(action, /publishLearjetQrhRelease\(session\.subject\)/);
  assert.match(action, /revalidatePath\("\/aircraft\/learjet-35a\/fly"\)/);
  assert.doesNotMatch(action, /TRAINING_DATABASE_URL/);

  assert.match(page, /Publish reviewed Learjet QRH/);
  assert.match(page, /confirmLearjetQrhRelease/);
  assert.match(page, /publishLearjetQrhReleaseAction/);
  assert.match(page, /required/);
});

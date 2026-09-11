import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const repository=fs.readFileSync(new URL("../lib/content-review-repository.ts",import.meta.url),"utf8");
const actions=fs.readFileSync(new URL("../app/admin/actions.ts",import.meta.url),"utf8");
const page=fs.readFileSync(new URL("../app/admin/aircraft/[aircraftId]/content/[versionId]/page.tsx",import.meta.url),"utf8");
const deployment=fs.readFileSync(new URL("../DEPLOYMENT.md",import.meta.url),"utf8");

test("re-source accepts only fingerprint-backed source records",()=>{
  assert.match(repository,/r\.checksum_sha256 IS NOT NULL/);
  assert.match(repository,/Selected source references are not backed by fingerprinted source records/);
  assert.match(repository,/payload:current\.payload/);
  assert.match(repository,/origin:"human"/);
  assert.doesNotMatch(repository,/training_manual_assets|UPDATE training_content_versions SET payload/);
});

test("fingerprint re-source is authenticated, server-owned and redirects to a new immutable version",()=>{
  const start=actions.indexOf("export async function reSourceVersionAction");
  const end=actions.indexOf("export async function approveVersionAction",start);
  const action=actions.slice(start,end);
  assert.ok(start>=0&&end>start);
  assert.match(action,/requireTrainingAdmin/);
  assert.match(action,/reSourceContentVersion/);
  assert.doesNotMatch(action,/payload\(form/);
  assert.match(action,/result\.aircraftId/);
  assert.match(action,/result\.versionId/);
});

test("review UI makes fingerprint provenance replacement explicit without auto-publication",()=>{
  assert.match(page,/Re-source this payload without rewriting it/);
  assert.match(page,/fingerprintSourceReferenceId/);
  assert.match(page,/Create fingerprint-backed human draft/);
  assert.match(page,/No source PDF is stored or served by FlyTally/);
  assert.match(page,/approval and publication are still separate administrator actions/);
  assert.match(page,/listFingerprintSourceReferencesForAircraft/);
});

test("deployment runbook preserves exact-payload re-source without document hosting",()=>{
  assert.match(deployment,/Re-source this payload without rewriting it/);
  assert.match(deployment,/exact existing payload/);
  assert.match(deployment,/does not auto-approve or auto-publish/);
  assert.match(deployment,/does not host source documents/i);
});

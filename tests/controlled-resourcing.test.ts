import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const repository=fs.readFileSync(new URL("../lib/content-review-repository.ts",import.meta.url),"utf8");
const actions=fs.readFileSync(new URL("../app/admin/actions.ts",import.meta.url),"utf8");
const page=fs.readFileSync(new URL("../app/admin/aircraft/[aircraftId]/content/[versionId]/page.tsx",import.meta.url),"utf8");
const deployment=fs.readFileSync(new URL("../DEPLOYMENT.md",import.meta.url),"utf8");

test("controlled re-source accepts only references backed by attached manual assets",()=>{
  assert.match(repository,/JOIN training_manual_assets a ON a\.attached_revision_id=r\.revision_id AND a\.status='attached'/);
  assert.match(repository,/Selected source references are not backed by an attached controlled manual/);
  assert.match(repository,/payload:current\.payload/);
  assert.match(repository,/origin:"human"/);
  assert.doesNotMatch(repository,/UPDATE training_content_versions SET payload/);
});

test("controlled re-source is authenticated, server-owned and redirects to the new immutable version",()=>{
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

test("review UI makes controlled provenance replacement explicit without auto-publication",()=>{
  assert.match(page,/Re-source this payload without rewriting it/);
  assert.match(page,/controlledSourceReferenceId/);
  assert.match(page,/Create controlled-source human draft/);
  assert.match(page,/approval and publication are still separate administrator actions/);
  assert.match(page,/listControlledSourceReferencesForAircraft/);
});

test("deployment runbook uses the re-source workflow instead of manual JSON copying",()=>{
  assert.match(deployment,/Re-source this payload without rewriting it/);
  assert.match(deployment,/exact existing payload/);
  assert.match(deployment,/does not auto-approve or auto-publish/);
});

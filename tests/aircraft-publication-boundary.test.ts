import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const publication=fs.readFileSync(new URL("../lib/aircraft-publication.ts",import.meta.url),"utf8");
const actions=fs.readFileSync(new URL("../app/admin/actions.ts",import.meta.url),"utf8");

test("learner catalogue publication requires source governance and at least one actual training module",()=>{
  assert.match(publication,/EXISTS\([\s\S]*training_manual_revisions/);
  assert.match(publication,/AS has_training_content/);
  assert.match(publication,/i\.content_key='bundle'/);
  assert.match(publication,/i\.domain<>'orientation'/);
  assert.match(publication,/AND e\.has_training_content/);
  assert.match(publication,/SET status='published',updated_at=NOW\(\)/);
  assert.doesNotMatch(publication,/published_domains=\$\{trainingContentDomains\.length\}/);
  assert.doesNotMatch(publication,/'learning','normal-flight','orientation','abnormal','reference-knowledge'/);
});

test("catalogue publication refuses unresolved stale flags on effective published training modules",()=>{
  assert.match(publication,/JOIN training_content_stale_flags sf ON sf\.version_id=p\.version_id/);
  assert.match(publication,/sf\.resolved_at IS NULL/);
  assert.match(publication,/AS current_content_fresh/);
  assert.match(publication,/AND e\.current_content_fresh/);
});

test("interactive aircraft publication uses the governed publication gate",()=>{
  assert.match(actions,/publishGovernedAircraft/);
  assert.match(actions,/await publishGovernedAircraft\(aircraftId\)/);
  assert.doesNotMatch(actions,/\bawait publishAircraft\(aircraftId\)/);
});

test("catalogue gate stays distinct from the stronger source-provenance release profile",()=>{
  assert.match(publication,/Stronger source-provenance release status is checked separately/);
  assert.match(publication,/does not\s*\n \* depend on hosting the underlying source documents/);
  assert.doesNotMatch(publication,/training_manual_assets|Controlled-Blob/);
});


test("catalogue publication re-evaluates the complete v3.1 package readiness gate",()=>{
  assert.match(publication,/assertAircraftPackageReadyForCatalogue/);
  assert.match(publication,/await assertAircraftPackageReadyForCatalogue\(id\)/);
});

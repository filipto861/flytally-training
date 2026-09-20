import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const helper=fs.readFileSync(new URL("../lib/source-provenance-readiness.ts",import.meta.url),"utf8");
const readiness=fs.readFileSync(new URL("../app/api/readiness/route.ts",import.meta.url),"utf8");

test("source-governed readiness evaluates each effective publication with its payload source policy",()=>{
  assert.match(helper,/SELECT ci\.domain,p\.version_id,v\.payload/);
  assert.match(helper,/JOIN training_content_publications/);
  assert.match(helper,/JOIN training_content_versions v ON v\.version_id=p\.version_id/);
  assert.match(helper,/JOIN training_content_version_sources/);
  assert.match(helper,/JOIN training_source_references/);
  assert.match(helper,/rolesByVersion/);
  assert.match(helper,/publications\.every\(publication=>/);
  assert.match(helper,/roles\.some\(role=>role==="UNCLASSIFIED"\)/);
  assert.match(helper,/requiresOperationalSourceAuthority\(publication\.domain\)/);
  assert.match(helper,/resolveContentSourcePolicy\(record\.sourcePolicy\)/);
  assert.match(helper,/sourcePolicyAllowsAuthority\(sourcePolicy,role\)/);
  assert.doesNotMatch(helper,/BOOL_AND|THEN r\.authority_role IN \('CONTROLLING','OPERATING_REFERENCE'\)/);
  assert.doesNotMatch(helper,/training_manual_assets|@vercel\/blob|head\(/);
});

test("source provenance remains fail-closed by delegating missing policy to the canonical faa-approved resolver",()=>{
  assert.match(helper,/return resolveContentSourcePolicy\(record\.sourcePolicy\)/);
  assert.match(helper,/roles\.length===0/);
  assert.match(helper,/role==="UNCLASSIFIED"/);
});

test("source provenance is aircraft-agnostic and based only on modules actually published",()=>{
  assert.match(helper,/ci\.aircraft_id=\$\{aircraftId\}/);
  assert.match(helper,/ci\.content_key='bundle'/);
  assert.match(helper,/ci\.domain<>'orientation'/);
  assert.doesNotMatch(helper,/trainingContentDomains\.every|learjet-35-36/i);
});

test("HTTP readiness reports a source-governed release profile without hosted documents",()=>{
  assert.match(readiness,/hasCompletePublishedSourceProvenance\(item\.id\)/);
  assert.match(readiness,/sourceProvenanceCoverage = true/);
  assert.match(readiness,/sourceGovernedRelease: ready && sourceGovernedRelease/);
  assert.doesNotMatch(readiness,/controlledDocumentRelease|controlledManualCoverage|training_manual_assets/);
});

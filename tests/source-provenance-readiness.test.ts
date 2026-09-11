import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const helper=fs.readFileSync(new URL("../lib/source-provenance-readiness.ts",import.meta.url),"utf8");
const readiness=fs.readFileSync(new URL("../app/api/readiness/route.ts",import.meta.url),"utf8");

test("source-governed readiness follows current published modules and classified source references",()=>{
  assert.match(helper,/SELECT DISTINCT ci\.domain/);
  assert.match(helper,/JOIN training_content_publications/);
  assert.match(helper,/JOIN training_content_version_sources/);
  assert.match(helper,/JOIN training_source_references/);
  assert.match(helper,/r\.authority_role<>'UNCLASSIFIED'/);
  assert.match(helper,/required\.every\(row=>coveredDomains\.has\(row\.domain\)\)/);
  assert.doesNotMatch(helper,/training_manual_assets|@vercel\/blob|head\(/);
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

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const readiness=fs.readFileSync(new URL("../app/api/readiness/route.ts",import.meta.url),"utf8");
const releaseConfiguration=fs.readFileSync(new URL("../lib/release-readiness.ts",import.meta.url),"utf8");

test("readiness includes active Training persistence boundaries without document storage",()=>{
  assert.match(readiness,/training_progress_events/);
  assert.match(readiness,/training_aircraft_state/);
  assert.match(readiness,/training_ai_draft_runs/);
  assert.match(readiness,/training_identity_assertions/);
  assert.match(readiness,/sourceProvenanceCoverage/);
  assert.doesNotMatch(readiness,/training_manual_assets|controlledManualPersistence|@vercel\/blob/);
  assert.doesNotMatch(readiness,/CREATE\s+TABLE|CREATE\s+INDEX/i);
});

test("production readiness exposes operational and source-governed profiles",()=>{
  assert.match(readiness,/publishedAircraft/);
  assert.match(readiness,/modularAircraftContent/);
  assert.match(readiness,/hasCompletePublishedSourceProvenance/);
  assert.match(readiness,/operational: ready/);
  assert.match(readiness,/sourceGovernedRelease/);
  assert.doesNotMatch(readiness,/controlledDocumentRelease|learjet-35-36/i);
});

test("release configuration has no Blob or document-storage credential",()=>{
  assert.doesNotMatch(releaseConfiguration,/VERCEL_OIDC_TOKEN|BLOB_READ_WRITE_TOKEN|controlled-manual-storage|controlledManualStorageReady/);
  assert.match(releaseConfiguration,/checks\.every\(check => check\.ok\)/);
});

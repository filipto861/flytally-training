import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { controlledManualMetadataMatches } from "../lib/controlled-manual-metadata.ts";

const helper = fs.readFileSync(new URL("../lib/controlled-manual-readiness.ts", import.meta.url), "utf8");
const readiness = fs.readFileSync(new URL("../app/api/readiness/route.ts", import.meta.url), "utf8");

test("controlled manual Blob metadata must match the verified database record", () => {
  const expected = { pathname:"manuals/a/r1.pdf", size_bytes:1234, content_type:"application/pdf" };
  assert.equal(controlledManualMetadataMatches(expected,{size:1234,contentType:"application/pdf"}),true);
  assert.equal(controlledManualMetadataMatches(expected,{size:1235,contentType:"application/pdf"}),false);
  assert.equal(controlledManualMetadataMatches(expected,{size:1234,contentType:"text/plain"}),false);
});

test("live manual readiness is scoped to attached sources used by current published bundles", () => {
  assert.match(helper,/a\.status='attached'/);
  assert.match(helper,/JOIN training_content_publications p ON p\.version_id=cvs\.version_id/);
  assert.match(helper,/ci\.aircraft_id=m\.aircraft_id/);
  assert.match(helper,/ci\.content_key='bundle'/);
  assert.match(helper,/ROW_NUMBER\(\) OVER \(PARTITION BY domain/);
  assert.match(helper,/candidate_rank<=3/);
  assert.match(helper,/await head\(candidate\.pathname\)/);
});

test("M9 requires controlled provenance only for modules the aircraft actually publishes", () => {
  assert.match(helper,/SELECT DISTINCT ci\.domain/);
  assert.match(helper,/requiredDomains = new Set/);
  assert.match(helper,/requiredDomains\.size === 0/);
  assert.match(helper,/\[\.\.\.requiredDomains\]\.every\(domain => covered\.has\(domain\)\)/);
  assert.doesNotMatch(helper,/trainingContentDomains\.every/);
  assert.doesNotMatch(helper,/IN \('learning','normal-flight','orientation','abnormal','reference-knowledge'\)/);
  assert.match(helper,/ci\.domain<>'orientation'/);
});

test("HTTP readiness still measures complete controlled-source coverage without using it as the operational gate", () => {
  assert.match(readiness,/hasCompletePublishedControlledManualCoverage\(item\.id\)/);
  assert.match(readiness,/controlledManualCoverage = true/);
  assert.match(readiness,/const controlledDocumentRelease/);
  assert.match(readiness,/&& controlledManualCoverage/);
  assert.match(readiness,/controlledManualCoverage,/);
  assert.match(readiness,/operational: ready/);
  assert.doesNotMatch(readiness,/const ready[\s\S]*&& controlledManualCoverage[\s\S]*const controlledDocumentRelease/);
  assert.doesNotMatch(readiness,/hasAvailablePublishedControlledManual/);
  assert.doesNotMatch(readiness,/learjet-35-36/i);
});

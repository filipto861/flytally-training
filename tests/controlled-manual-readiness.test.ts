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

test("live manual readiness is scoped to attached sources used by current published content", () => {
  assert.match(helper,/a\.status='attached'/);
  assert.match(helper,/JOIN training_content_publications p ON p\.version_id=cvs\.version_id/);
  assert.match(helper,/ci\.aircraft_id=m\.aircraft_id/);
  assert.match(helper,/await head\(candidate\.pathname\)/);
  assert.match(helper,/LIMIT 3/);
});

test("HTTP readiness requires reachable controlled storage for a complete aircraft", () => {
  assert.match(readiness,/hasAvailablePublishedControlledManual\(item\.id\)/);
  assert.match(readiness,/controlledManualStorage = true/);
  assert.match(readiness,/&& controlledManualStorage/);
  assert.match(readiness,/controlledManualStorage,/);
  assert.doesNotMatch(readiness,/learjet-35-36/i);
});

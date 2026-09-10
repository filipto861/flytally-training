import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const readiness=fs.readFileSync(new URL("../app/api/readiness/route.ts",import.meta.url),"utf8");
const workflow=fs.readFileSync(new URL("../lib/ai-draft-workflow.ts",import.meta.url),"utf8");

test("release readiness requires AI audit persistence without provisioning schema",()=>{
  assert.match(readiness,/SELECT 1 FROM training_ai_draft_runs LIMIT 0/);
  assert.match(readiness,/aiDraftAuditPersistence/);
  assert.match(readiness,/&& aiDraftAuditPersistence/);
  assert.doesNotMatch(readiness,/CREATE TABLE|CREATE INDEX|ALTER TABLE/);
});

test("AI audit lookup no longer hides persistence failures",()=>{
  assert.match(workflow,/getAiDraftRunForVersion/);
  assert.doesNotMatch(workflow,/catch\s*\{\s*return undefined/);
});

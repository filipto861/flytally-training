import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { parseContentVersionOrigin, trainingContentDomains } from "../lib/content-admin-types.ts";

const adminRepo=fs.readFileSync(new URL("../lib/content-admin-repository.ts",import.meta.url),"utf8");
const pgRepo=fs.readFileSync(new URL("../lib/postgres-content-repository.ts",import.meta.url),"utf8");
const readSchema=fs.readFileSync(new URL("../lib/content-read-schema.ts",import.meta.url),"utf8");
const store=fs.readFileSync(new URL("../lib/content-store.ts",import.meta.url),"utf8");

test("M8 content domains are aircraft-agnostic product domains",()=>{
  assert.deepEqual(trainingContentDomains,["learning","normal-flight","orientation","abnormal","reference-knowledge"]);
  assert.doesNotMatch(pgRepo,/learjet-35-36/i);
});

test("learner PostgreSQL reads are isolated from admin/bootstrap/static seed imports",()=>{
  assert.doesNotMatch(pgRepo,/content-admin-repository|static-content-repository/);
  assert.doesNotMatch(readSchema,/content-admin-repository|static-content-repository|learjet-35-36/);
  assert.match(pgRepo,/content-read-schema/);
});

test("publication is structurally gated by explicit approval",()=>{
  assert.match(adminRepo,/Explicit human approval is required before publication/);
  assert.match(adminRepo,/training_content_approvals/);
  assert.match(adminRepo,/decision='approved'/);
});

test("manual revisions are immutable and revision changes create stale review flags",()=>{
  assert.match(adminRepo,/Manual revision already exists\. Revisions are immutable/);
  assert.match(adminRepo,/training_content_stale_flags/);
  assert.match(adminRepo,/newer_revision_id/);
});

test("content-version origin is an explicit allow-list",()=>{
  assert.equal(parseContentVersionOrigin("ai-assisted"),"ai-assisted");
  assert.throws(()=>parseContentVersionOrigin("browser-supplied-random-value"),/Unsupported content version origin/);
});

test("learner content storage can switch behind the repository boundary",()=>{
  assert.match(store,/TRAINING_CONTENT_BACKEND/);
  assert.match(store,/PostgresTrainingContentRepository/);
  assert.match(store,/StaticTrainingContentRepository/);
});

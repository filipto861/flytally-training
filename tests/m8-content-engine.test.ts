import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { parseContentVersionOrigin, trainingContentDomains } from "../lib/content-admin-types.ts";

const governedLifecycle=fs.readFileSync(new URL("../lib/content-governed-lifecycle.ts",import.meta.url),"utf8");
const governedManuals=fs.readFileSync(new URL("../lib/governed-manual-registration.ts",import.meta.url),"utf8");
const pgRepo=fs.readFileSync(new URL("../lib/postgres-content-repository.ts",import.meta.url),"utf8");
const store=fs.readFileSync(new URL("../lib/content-store.ts",import.meta.url),"utf8");

test("M8 content domains are aircraft-agnostic product domains",()=>{
  assert.deepEqual(trainingContentDomains,["learning","normal-flight","orientation","abnormal","reference-knowledge"]);
  assert.doesNotMatch(pgRepo,/learjet-35-36/i);
});

test("learner PostgreSQL reads are isolated from admin/bootstrap/static seed and perform no DDL",()=>{
  assert.doesNotMatch(pgRepo,/content-admin-repository|static-content-repository|content-read-schema/);
  assert.doesNotMatch(pgRepo,/CREATE\s+(TABLE|INDEX)|ALTER\s+TABLE/i);
  assert.match(pgRepo,/Learner reads intentionally perform SELECTs only/);
});

test("aircraft-library read avoids per-aircraft N+1 hydration",()=>{
  assert.doesNotMatch(pgRepo,/rows\.map\(.*this\.getAircraft/s);
  assert.match(pgRepo,/Promise\.all\(\[/);
  assert.match(pgRepo,/variantsByAircraft/);
  assert.match(pgRepo,/manualsByAircraft/);
});

test("publication is structurally gated by explicit approval and provenance",()=>{
  assert.match(governedLifecycle,/training_content_approvals/);
  assert.match(governedLifecycle,/decision='approved'/);
  assert.match(governedLifecycle,/Explicit human approval and required provenance audit are required before publication/);
  assert.match(governedLifecycle,/sql\.transaction/);
});

test("manual revisions are immutable inserts and revision changes create stale review flags transactionally",()=>{
  assert.match(governedManuals,/INSERT INTO training_manual_revisions/);
  assert.match(governedManuals,/training_content_stale_flags/);
  assert.match(governedManuals,/newer_revision_id/);
  assert.match(governedManuals,/sql\.transaction/);
  assert.doesNotMatch(governedManuals,/UPDATE training_manual_revisions/);
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

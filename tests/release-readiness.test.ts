import assert from "node:assert/strict";
import test from "node:test";
import { inspectReleaseConfiguration } from "../lib/release-readiness.ts";

const valid={TRAINING_CONTENT_BACKEND:"postgres",TRAINING_DATABASE_URL:"postgresql://user:pass@db.example.invalid/training",TRAINING_SESSION_SECRET:"s".repeat(48),FLYTALLY_IDENTITY_SECRET:"i".repeat(48),FLYTALLY_LOGBOOK_URL:"https://app.fly-tally.com"};

test("operational readiness accepts the production architecture contract",()=>{
  const report=inspectReleaseConfiguration(valid);
  assert.equal(report.ready,true);
  assert.ok(report.checks.every(check=>check.ok));
});

test("release configuration contains no source-document storage requirement",()=>{
  const report=inspectReleaseConfiguration(valid);
  assert.equal(report.checks.some(check=>/storage|blob|manual/i.test(check.id)),false);
});

test("operational readiness rejects static content, weak secrets and non-HTTPS identity providers",()=>{
  const report=inspectReleaseConfiguration({...valid,TRAINING_CONTENT_BACKEND:"static",TRAINING_SESSION_SECRET:"short",FLYTALLY_LOGBOOK_URL:"http://localhost:3000"});
  assert.equal(report.ready,false);
  assert.equal(report.checks.find(check=>check.id==="postgres-content-backend")?.ok,false);
  assert.equal(report.checks.find(check=>check.id==="training-session-secret")?.ok,false);
  assert.equal(report.checks.find(check=>check.id==="identity-provider")?.ok,false);
});

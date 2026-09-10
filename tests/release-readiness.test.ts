import assert from "node:assert/strict";
import test from "node:test";

import { inspectReleaseConfiguration } from "../lib/release-readiness.ts";

const valid = {
  TRAINING_CONTENT_BACKEND: "postgres",
  TRAINING_DATABASE_URL: "postgresql://training:secret@example.invalid/training?sslmode=require",
  TRAINING_SESSION_SECRET: "s".repeat(48),
  FLYTALLY_IDENTITY_SECRET: "i".repeat(48),
  FLYTALLY_LOGBOOK_URL: "https://app.fly-tally.com",
  BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_" + "b".repeat(48),
};

test("release readiness accepts the complete production architecture contract", () => {
  const report = inspectReleaseConfiguration(valid);
  assert.equal(report.ready, true);
  assert.ok(report.checks.every(check => check.ok));
  assert.equal(report.checks.find(check=>check.id==="controlled-manual-storage")?.ok, true);
});

test("release readiness rejects static content, weak secrets and non-HTTPS identity providers", () => {
  const report = inspectReleaseConfiguration({
    ...valid,
    TRAINING_CONTENT_BACKEND: "static",
    TRAINING_SESSION_SECRET: "short",
    FLYTALLY_LOGBOOK_URL: "http://localhost:3000",
  });
  assert.equal(report.ready, false);
  assert.equal(report.checks.find(check=>check.id==="postgres-content-backend")?.ok, false);
  assert.equal(report.checks.find(check=>check.id==="training-session-secret")?.ok, false);
  assert.equal(report.checks.find(check=>check.id==="identity-provider")?.ok, false);
});

test("release readiness rejects a deployment without controlled manual Blob credentials", () => {
  const report = inspectReleaseConfiguration({ ...valid, BLOB_READ_WRITE_TOKEN: "" });
  assert.equal(report.ready, false);
  assert.equal(report.checks.find(check=>check.id==="controlled-manual-storage")?.ok, false);
});

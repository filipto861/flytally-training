import assert from "node:assert/strict";
import test from "node:test";

import { hasControlledManualStorageCredential, inspectReleaseConfiguration } from "../lib/release-readiness.ts";

const valid = {
  TRAINING_CONTENT_BACKEND: "postgres",
  TRAINING_DATABASE_URL: "postgresql://training:secret@example.invalid/training?sslmode=require",
  TRAINING_SESSION_SECRET: "s".repeat(48),
  FLYTALLY_IDENTITY_SECRET: "i".repeat(48),
  FLYTALLY_LOGBOOK_URL: "https://app.fly-tally.com",
  BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_" + "b".repeat(48),
};

test("operational readiness accepts the complete production architecture contract", () => {
  const report = inspectReleaseConfiguration(valid);
  assert.equal(report.ready, true);
  assert.equal(report.controlledManualStorageReady, true);
  assert.ok(report.checks.every(check => check.ok));
  assert.equal(report.checks.find(check=>check.id==="controlled-manual-storage")?.requiredForOperationalReadiness, false);
});

test("controlled document storage accepts Vercel OIDC as the preferred private Blob credential", () => {
  const report = inspectReleaseConfiguration({
    ...valid,
    BLOB_READ_WRITE_TOKEN: "",
    VERCEL_OIDC_TOKEN: "eyJhbGciOiJSUzI1NiJ9." + "o".repeat(96),
  });
  assert.equal(report.ready, true);
  assert.equal(report.controlledManualStorageReady, true);
  assert.equal(report.checks.find(check=>check.id==="controlled-manual-storage")?.ok, true);
});

test("explicit Blob token remains a valid local or non-Vercel fallback", () => {
  assert.equal(hasControlledManualStorageCredential(valid), true);
  assert.equal(hasControlledManualStorageCredential({ BLOB_READ_WRITE_TOKEN:"vercel_blob_rw_"+"x".repeat(32) }), true);
});

test("operational readiness rejects static content, weak secrets and non-HTTPS identity providers", () => {
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

test("missing controlled-document Blob credentials do not make the learner application operationally unavailable", () => {
  const report = inspectReleaseConfiguration({ ...valid, BLOB_READ_WRITE_TOKEN: "", VERCEL_OIDC_TOKEN:"" });
  assert.equal(report.ready, true);
  assert.equal(report.controlledManualStorageReady, false);
  assert.equal(report.checks.find(check=>check.id==="controlled-manual-storage")?.ok, false);
});

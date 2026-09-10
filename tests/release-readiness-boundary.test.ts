import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const readiness = fs.readFileSync(new URL("../app/api/readiness/route.ts", import.meta.url), "utf8");
const releaseConfiguration = fs.readFileSync(new URL("../lib/release-readiness.ts", import.meta.url), "utf8");

test("readiness includes all Training-owned persistence boundaries without creating schema", () => {
  assert.match(readiness, /training_progress_events/);
  assert.match(readiness, /training_aircraft_state/);
  assert.match(readiness, /training_manual_assets/);
  assert.match(readiness, /training_ai_draft_runs/);
  assert.match(readiness, /training_identity_assertions/);
  assert.match(readiness, /controlledManualPersistence/);
  assert.match(readiness, /aiDraftAuditPersistence/);
  assert.match(readiness, /identityReplayProtection/);
  assert.doesNotMatch(readiness, /CREATE\s+TABLE|CREATE\s+INDEX/i);
});

test("readiness distinguishes a published catalog from a complete v1 learner aircraft", () => {
  assert.match(readiness, /publishedAircraft/);
  assert.match(readiness, /completeV1Aircraft/);
  assert.match(readiness, /getAircraftContentBundle/);
  assert.match(readiness, /hasCompleteV1AircraftCapabilities/);
  assert.match(readiness, /&& completeV1Aircraft/);
  assert.doesNotMatch(readiness, /learjet-35-36/i);
});

test("production configuration accepts either rotated Vercel OIDC or explicit Blob credentials", () => {
  assert.match(releaseConfiguration, /VERCEL_OIDC_TOKEN/);
  assert.match(releaseConfiguration, /BLOB_READ_WRITE_TOKEN/);
  assert.match(releaseConfiguration, /controlled-manual-storage/);
  assert.match(releaseConfiguration, /\|\| configured\(env\.BLOB_READ_WRITE_TOKEN/);
});

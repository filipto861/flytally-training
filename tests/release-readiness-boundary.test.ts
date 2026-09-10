import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const readiness = fs.readFileSync(new URL("../app/api/readiness/route.ts", import.meta.url), "utf8");
const releaseConfiguration = fs.readFileSync(new URL("../lib/release-readiness.ts", import.meta.url), "utf8");

test("readiness includes all Training-owned persistence boundaries without creating schema", () => {
  assert.match(readiness, /training_progress_events/);
  assert.match(readiness, /training_aircraft_state/);
  assert.match(readiness, /training_manual_assets/);
  assert.match(readiness, /training_identity_assertions/);
  assert.match(readiness, /controlledManualPersistence/);
  assert.match(readiness, /identityReplayProtection/);
  assert.doesNotMatch(readiness, /CREATE\s+TABLE|CREATE\s+INDEX/i);
});

test("production configuration requires the controlled-manual Blob credential", () => {
  assert.match(releaseConfiguration, /BLOB_READ_WRITE_TOKEN/);
  assert.match(releaseConfiguration, /controlled-manual-storage/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { isPersistedTrainingProgressEvent } from "../lib/progress-events.ts";

const progressRepository = fs.readFileSync(new URL("../lib/progress-repository.ts", import.meta.url), "utf8");
const progressRoute = fs.readFileSync(new URL("../app/api/progress/route.ts", import.meta.url), "utf8");
const identityDoc = fs.readFileSync(new URL("../TECHNICAL_DOCUMENTATION.md", import.meta.url), "utf8");

test("persisted progress events require stable ids for idempotent cross-device sync", () => {
  assert.equal(isPersistedTrainingProgressEvent({ eventId: "event-123", aircraftId: "a", kind: "scenario", contentId: "engine-fire", occurredAt: "2026-09-10T04:00:00Z", completed: true }), true);
  assert.equal(isPersistedTrainingProgressEvent({ aircraftId: "a", kind: "scenario", contentId: "engine-fire", occurredAt: "2026-09-10T04:00:00Z", completed: true }), false);
});

test("Training progress derives account subject from server session rather than client payload", () => {
  assert.match(progressRoute, /getTrainingSession/);
  assert.match(progressRoute, /session\.subject/);
  assert.doesNotMatch(progressRoute, /body\.subject|body\.userId/);
});

test("Training persistence stays separate from Logbook database internals", () => {
  assert.match(progressRepository, /TRAINING_DATABASE_URL|\.\/db/);
  assert.doesNotMatch(progressRepository, /auth_sessions|FROM users|JOIN users|flytally-logbook/);
  assert.match(identityDoc, /share identity, not persistence/i);
});

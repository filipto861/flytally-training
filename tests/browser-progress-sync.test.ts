import assert from "node:assert/strict";
import test from "node:test";

import { mergeProgressEvents, normalizeProgressEvents } from "../lib/browser-progress.ts";
import type { PersistedTrainingProgressEvent } from "../lib/progress-events.ts";

function event(index: number, overrides: Partial<PersistedTrainingProgressEvent> = {}): PersistedTrainingProgressEvent {
  return {
    eventId: `event-${String(index).padStart(6, "0")}`,
    aircraftId: "learjet-35-36",
    kind: "knowledge",
    contentId: `question-${index}`,
    occurredAt: new Date(Date.UTC(2026, 8, 10, 5, 0, index)).toISOString(),
    completed: true,
    ...overrides,
  };
}

test("local progress normalization is deterministic, deduplicated and newest-retained", () => {
  const events = Array.from({ length: 1005 }, (_, index) => event(index));
  const duplicate = event(1004, { contentId: "canonical-latest" });
  const normalized = normalizeProgressEvents([...events.reverse(), duplicate]);

  assert.equal(normalized.length, 1000);
  assert.equal(normalized[0].eventId, "event-000005");
  assert.equal(normalized.at(-1)?.eventId, "event-001004");
  assert.equal(normalized.at(-1)?.contentId, "canonical-latest");
});

test("remote account copy wins duplicate event ids while local-only events survive", () => {
  const localOnly = event(1, { contentId: "local-only" });
  const localDuplicate = event(2, { contentId: "local-version" });
  const remoteDuplicate = event(2, { contentId: "server-version" });
  const remoteOnly = event(3, { contentId: "remote-only" });

  const merged = mergeProgressEvents([localOnly, localDuplicate], [remoteDuplicate, remoteOnly]);
  assert.deepEqual(merged.map((item) => item.eventId), [localOnly.eventId, localDuplicate.eventId, remoteOnly.eventId]);
  assert.equal(merged.find((item) => item.eventId === localDuplicate.eventId)?.contentId, "server-version");
  assert.equal(merged.find((item) => item.eventId === localOnly.eventId)?.contentId, "local-only");
});

import assert from "node:assert/strict";
import test from "node:test";

import { MAX_PROGRESS_FUTURE_SKEW_MS, isServerAcceptableProgressEvent, progressStorageKey, summarizeProgress, trainingActivityKinds, type TrainingProgressEvent } from "../lib/progress-events.ts";

const events: TrainingProgressEvent[] = [
  { aircraftId: "a", kind: "knowledge", contentId: "bank", occurredAt: "2026-09-09T10:00:00Z", completed: true, scorePercent: 80, weakAreas: ["Fuel"] },
  { aircraftId: "a", kind: "scenario", contentId: "engine-fire", occurredAt: "2026-09-09T11:00:00Z", completed: true, weakAreas: ["Fuel", "Fire"] },
  { aircraftId: "b", kind: "knowledge", contentId: "bank", occurredAt: "2026-09-09T12:00:00Z", completed: true },
];

test("progress summary stays scoped to one aircraft", () => {
  const summary = summarizeProgress("a", events);
  assert.equal(summary.attempts, 2);
  assert.equal(summary.completedActivities, 2);
  assert.equal(summary.latestActivityAt, "2026-09-09T11:00:00Z");
  assert.deepEqual([...summary.weakAreas].sort(), ["Fire", "Fuel"]);
});

test("v1 progress activity contract includes the complete learner path", () => {
  assert.deepEqual(trainingActivityKinds, [
    "quick-start",
    "systems",
    "orientation",
    "normal-flight",
    "checklist-phase",
    "scenario",
    "knowledge",
  ]);
});

test("server ingestion accepts offline history and bounded clock skew but rejects future state poisoning", () => {
  const nowMs = Date.parse("2026-09-10T06:10:00Z");
  const event = (occurredAt: string) => ({
    eventId: "event-123456",
    aircraftId: "a",
    kind: "scenario" as const,
    contentId: "engine-fire",
    occurredAt,
    completed: true,
  });

  assert.equal(isServerAcceptableProgressEvent(event("2025-01-01T00:00:00Z"), nowMs), true);
  assert.equal(isServerAcceptableProgressEvent(event(new Date(nowMs + MAX_PROGRESS_FUTURE_SKEW_MS).toISOString()), nowMs), true);
  assert.equal(isServerAcceptableProgressEvent(event(new Date(nowMs + MAX_PROGRESS_FUTURE_SKEW_MS + 1).toISOString()), nowMs), false);
});

test("progress storage keys are aircraft-specific", () => {
  assert.notEqual(progressStorageKey("a"), progressStorageKey("b"));
});

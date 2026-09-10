import assert from "node:assert/strict";
import test from "node:test";

import { progressStorageKey, summarizeProgress, trainingActivityKinds, type TrainingProgressEvent } from "../lib/progress-events.ts";

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

test("cockpit orientation is a first-class aircraft progress activity", () => {
  assert.equal(trainingActivityKinds.includes("orientation"), true);
});

test("progress storage keys are aircraft-specific", () => {
  assert.notEqual(progressStorageKey("a"), progressStorageKey("b"));
});

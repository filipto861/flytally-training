import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  launchTrainingDestination,
  loadLatestLaunchTrainingEvent,
} from "../lib/launch/progress.ts";
import type { PersistedTrainingProgressEvent } from "../lib/progress-events.ts";
import type { TrainingProgressRepository } from "../lib/progress-repository.ts";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

const latestEvent: PersistedTrainingProgressEvent = {
  eventId: "event-latest-001",
  aircraftId: "test-aircraft",
  kind: "systems",
  contentId: "electrical-system",
  occurredAt: "2026-09-21T12:00:00.000Z",
  completed: false,
};

function progressRepository(events: readonly PersistedTrainingProgressEvent[]) {
  const calls: Array<{ accountSubject: string; aircraftId: string }> = [];
  const repository: TrainingProgressRepository = {
    async listEvents(accountSubject: string, aircraftId: string) {
      calls.push({ accountSubject, aircraftId });
      return events;
    },
    async appendEvents() {},
    async getAircraftState(_accountSubject: string, aircraftId: string) {
      return { aircraftId };
    },
  };
  return { repository, calls };
}

test("P0 Continue Training reads the latest event through the progress repository contract", async () => {
  const { repository, calls } = progressRepository([latestEvent]);
  const result = await loadLatestLaunchTrainingEvent(
    repository,
    "account-123",
    "test-aircraft",
  );

  assert.equal(result, latestEvent);
  assert.deepEqual(calls, [
    { accountSubject: "account-123", aircraftId: "test-aircraft" },
  ]);
});

test("P0 Continue Training maps persisted activity to its canonical training route", () => {
  assert.deepEqual(launchTrainingDestination(latestEvent), {
    route: "systems",
    label: "Systems",
  });
  assert.deepEqual(
    launchTrainingDestination({ ...latestEvent, kind: "quick-start", completed: true }),
    { route: "checklists", label: "Checklist training" },
  );
});

test("P0 launch surface styling consumes frozen workspace tokens without hardcoded color or spacing values", () => {
  const css = read("components/ft-launch/ft-launch.module.css");

  for (const token of [
    "--ft-bg-shell",
    "--ft-bg-inset",
    "--ft-bg-operational",
    "--ft-text-primary",
    "--ft-text-secondary",
    "--ft-text-metadata",
    "--ft-space-4",
    "--ft-space-5",
    "--ft-space-6",
    "--ft-touch-target-min",
    "--ft-rule-default",
    "--ft-rule-strong",
  ]) {
    assert.match(css, new RegExp(`var\\(${token.replaceAll("-", "\\-")}\\)`));
  }

  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
  assert.doesNotMatch(css.replaceAll("1180px", ""), /\b\d+(?:\.\d+)?px\b/);
});

test("P1.1 mode chooser keeps Active Flight context inside the EFB choice", () => {
  const surface = read("components/ft-launch/FtLaunchSurface.tsx");
  const page = read("app/aircraft/[aircraftId]/page.tsx");

  assert.match(surface, /useActiveFlightState\(aircraftId, activeFlight\)/);
  assert.match(surface, /currentFlight = flight\?\.lifecycle === "ACTIVE"/);
  assert.match(surface, /aria-label="EFB mode"/);
  assert.match(surface, /currentFlight\.departure\.icao/);
  assert.match(surface, /currentFlight\.destination\.icao/);
  assert.match(surface, /Open Flight Brief/);
  assert.match(page, /getActiveFlight/);
  assert.match(page, /activeFlight=\{activeFlight\}/);
});

test("P1.1 aircraft launch surface is an explicit Learn\/EFB chooser", () => {
  const surface = read("components/ft-launch/FtLaunchSurface.tsx");
  const recent = read("components/ft-launch/FtRecent.tsx");

  assert.match(surface, /aria-label="Aircraft mode chooser"/);
  assert.match(surface, /aria-label="Learn mode"/);
  assert.match(surface, /aria-label="EFB mode"/);
  assert.match(surface, /Learn the aircraft/);
  assert.match(surface, /Operate the flight/);
  assert.match(surface, /\/learn/);
  assert.match(surface, /\/efb/);
  assert.match(surface, /FtRecent/);
  assert.doesNotMatch(surface, /FtContinueTraining|FtFlightSection|pilot-command/);
  assert.match(recent, /Nothing recent\./);
});

test("P1.1 page remains feature-gated and the mode chooser is not a metric dashboard", () => {
  const page = read("app/aircraft/[aircraftId]/page.tsx");
  const surface = read("components/ft-launch/FtLaunchSurface.tsx");

  assert.match(page, /if \(!isNewShellEnabled\(\)\)/);
  assert.match(page, /LegacyAircraftHome/);
  assert.match(page, /FtLaunchSurface/);
  assert.match(page, /recentItems=\{\[\]\}/);
  assert.doesNotMatch(surface, /FtMetric|FtStat|FtDashboard|FtWidget|data-metric|data-stat|data-dashboard/i);
  assert.doesNotMatch(surface, /FtFastPath|Operational fast path|Quick Access|>\s*(?:CHECKLIST|QRH|PERF)\s*</i);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  canTransitionActiveFlight,
  transitionActiveFlight,
  type ActiveFlight,
} from "../lib/active-flight/types.ts";
import {
  activeFlightMirrorKey,
  clearActiveFlightMirror,
  readActiveFlightMirror,
  reconcileActiveFlightMirror,
  writeActiveFlightMirror,
  type ActiveFlightMirrorStorage,
} from "../lib/active-flight/mirror.ts";
import { activeFlightDependencyReference } from "../lib/active-flight/validation.ts";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

const active: ActiveFlight = {
  id: "flight-001",
  aircraftId: "browser-ci-aircraft",
  accountSubject: "account-1",
  lifecycle: "ACTIVE",
  departure: { icao: "LKPR" },
  destination: { icao: "LOWW" },
  runway: { identifier: "24" },
  weight: { value: 12000, unit: "lb" },
  configuration: { flaps: "8", antiIce: false },
  weather: null,
  performanceDependency: { snapshotId: "afd1:test" },
  brief: null,
  createdAt: "2026-09-21T18:00:00.000Z",
  updatedAt: "2026-09-21T18:00:00.000Z",
  activatedAt: "2026-09-21T18:00:00.000Z",
  deactivatedAt: null,
  archivedAt: null,
};

function memoryStorage(): ActiveFlightMirrorStorage {
  const values = new Map<string, string>();
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); },
  };
}

test("D0 lifecycle permits only explicit ACTIVE to PREVIOUS to ARCHIVED transitions", () => {
  assert.equal(canTransitionActiveFlight("ACTIVE", "PREVIOUS"), true);
  assert.equal(canTransitionActiveFlight("PREVIOUS", "ARCHIVED"), true);
  assert.equal(canTransitionActiveFlight("ACTIVE", "ARCHIVED"), false);
  assert.equal(canTransitionActiveFlight("PREVIOUS", "ACTIVE"), false);
  assert.equal(canTransitionActiveFlight("ARCHIVED", "ACTIVE"), false);

  const previous = transitionActiveFlight(active, "PREVIOUS", "2026-09-21T19:00:00.000Z");
  assert.equal(previous.lifecycle, "PREVIOUS");
  assert.equal(previous.deactivatedAt, "2026-09-21T19:00:00.000Z");

  const archived = transitionActiveFlight(previous, "ARCHIVED", "2026-09-21T20:00:00.000Z");
  assert.equal(archived.lifecycle, "ARCHIVED");
  assert.equal(archived.archivedAt, "2026-09-21T20:00:00.000Z");
  assert.throws(() => transitionActiveFlight(active, "ARCHIVED", "2026-09-21T20:00:00.000Z"));
});

test("D0 lifecycle contains no timer-based or age-based transition path", () => {
  const source = read("lib/active-flight/types.ts");
  assert.doesNotMatch(source, /setTimeout|setInterval|Date\.now\(\).*lifecycle|stale|expiry|expires/i);
  assert.match(source, /canTransitionActiveFlight/);
  assert.match(source, /transitionActiveFlight/);
});

test("D0 migration and bootstrap enforce one ACTIVE flight per account and aircraft", () => {
  const migration = read("migrations/20260921_training_active_flights.sql");
  const schema = read("lib/active-flight/schema.ts");
  const bootstrap = read("lib/database-bootstrap.ts");
  const readiness = read("app/api/readiness/route.ts");

  for (const source of [migration, schema]) {
    assert.match(source, /training_active_flights/);
    assert.match(source, /lifecycle IN \('ACTIVE'.*'PREVIOUS'.*'ARCHIVED'\)/s);
    assert.match(source, /CREATE UNIQUE INDEX IF NOT EXISTS ux_training_active_flights_one_active/);
    assert.match(source, /account_subject, aircraft_id/);
    assert.match(source, /WHERE lifecycle = 'ACTIVE'/);
  }
  assert.match(bootstrap, /ensureTrainingActiveFlightSchema/);
  assert.match(bootstrap, /"training_active_flights"/);
  assert.match(readiness, /activeFlightPersistence/);
  assert.match(
    readiness,
    /SELECT prefill_provenance FROM training_active_flights LIMIT 0/,
  );
});

test("D0 mirror reconciliation is server-canonical and retains local state only when server is unavailable", () => {
  const local: ActiveFlight = { ...active, accountSubject: "local", id: "local-1" };
  const server: ActiveFlight = { ...active, id: "server-1" };

  assert.equal(reconcileActiveFlightMirror(server, local), server);
  assert.equal(reconcileActiveFlightMirror(null, local), null);
  assert.equal(reconcileActiveFlightMirror(undefined, local), local);
});

test("D0 local mirror round-trips by aircraft and removes malformed state", () => {
  const storage = memoryStorage();
  writeActiveFlightMirror(storage, active);
  assert.deepEqual(readActiveFlightMirror(storage, active.aircraftId), active);

  storage.setItem(activeFlightMirrorKey(active.aircraftId), "{broken");
  assert.equal(readActiveFlightMirror(storage, active.aircraftId), null);
  assert.equal(storage.getItem(activeFlightMirrorKey(active.aircraftId)), null);

  writeActiveFlightMirror(storage, active);
  clearActiveFlightMirror(storage, active.aircraftId);
  assert.equal(readActiveFlightMirror(storage, active.aircraftId), null);
});

test("D0 API routes expose CRUD transitions and fail closed behind FT_NEW_SHELL before session work", () => {
  const main = read("app/api/active-flight/route.ts");
  for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
    assert.match(main, new RegExp("export async function " + method + "\\("));
  }

  for (const file of [
    "app/api/active-flight/route.ts",
    "app/api/active-flight/deactivate/route.ts",
    "app/api/active-flight/archive/route.ts",
  ]) {
    const source = read(file);
    const gate = source.indexOf("!isNewShellEnabled()");
    const session = source.indexOf("getTrainingSession()");
    assert.ok(gate >= 0, file + " must contain the feature gate");
    assert.ok(session > gate, file + " must gate before session access");
    assert.match(source, /feature_disabled/);
    assert.match(source, /status:\s*404/);
  }
});

test("D0 Active Flight runtime store is DML-only and explicitly rejects a second ACTIVE flight", () => {
  const store = read("lib/active-flight/store.ts");
  assert.doesNotMatch(store, /CREATE\s+(TABLE|INDEX)|ALTER\s+TABLE|ensureTrainingActiveFlightSchema/i);
  assert.match(store, /pg_advisory_xact_lock/);
  assert.match(store, /NOT EXISTS[\s\S]*lifecycle='ACTIVE'/);
  assert.match(store, /ActiveFlightConflictError/);
  assert.match(store, /lifecycle='PREVIOUS'/);
  assert.match(store, /lifecycle='ARCHIVED'/);
});

test("D0 performance dependency reference is deterministic and changes when dependencies change", () => {
  const input = {
    departure: active.departure,
    destination: active.destination,
    runway: active.runway,
    weight: active.weight,
    configuration: active.configuration,
  };
  const first = activeFlightDependencyReference(input);
  assert.equal(activeFlightDependencyReference(input), first);
  assert.notEqual(
    activeFlightDependencyReference({ ...input, weight: { value: 12100, unit: "lb" } }),
    first,
  );
  assert.match(first, /^afd1:[0-9a-f]{8}$/);
});

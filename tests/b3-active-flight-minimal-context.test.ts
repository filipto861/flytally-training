import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  activeFlightDependencyReference,
  isActiveFlight,
  parseActiveFlightInput,
  parseActiveFlightPatch,
} from "../lib/active-flight/validation.ts";

const minimalInput = {
  aircraftId: "learjet-35a",
  departure: { icao: "LKPR" },
  destination: { icao: "LKTB" },
  weight: { value: 15000, unit: "lb" as const },
};

test("B3 Active Flight creation accepts route and planning weight without runway/configuration", () => {
  const parsed = parseActiveFlightInput(minimalInput);
  assert.ok(parsed);
  assert.equal(parsed.runway, null);
  assert.equal(parsed.configuration, null);
  assert.deepEqual(parsed.weight, { value: 15000, unit: "lb" });
});

test("B3 dependency reference remains deterministic for minimal Active Flight", () => {
  const parsed = parseActiveFlightInput(minimalInput);
  assert.ok(parsed);
  const first = activeFlightDependencyReference(parsed);
  assert.equal(activeFlightDependencyReference(parsed), first);
  assert.match(first, /^afd1:[0-9a-f]{8}$/);
});

test("B3 preserves legacy configured Active Flight compatibility", () => {
  const parsed = parseActiveFlightInput({
    ...minimalInput,
    runway: { identifier: "24" },
    configuration: { flaps: "8", antiIce: false },
  });
  assert.ok(parsed);
  assert.deepEqual(parsed.runway, { identifier: "24" });
  assert.deepEqual(parsed.configuration, { flaps: "8", antiIce: false });
});

test("B3 patch can explicitly clear legacy runway/configuration", () => {
  const patch = parseActiveFlightPatch({ runway: null, configuration: null });
  assert.deepEqual(patch, { runway: null, configuration: null });
});

test("B3 Active Flight validator accepts persisted minimal context", () => {
  assert.equal(isActiveFlight({
    id: "flight-1",
    aircraftId: "learjet-35a",
    accountSubject: "local",
    lifecycle: "ACTIVE",
    departure: { icao: "LKPR" },
    destination: { icao: "LKTB" },
    runway: null,
    weight: { value: 15000, unit: "lb" },
    configuration: null,
    weather: null,
    performanceDependency: { snapshotId: "afd1:test" },
    brief: null,
    createdAt: "2026-09-23T08:00:00.000Z",
    updatedAt: "2026-09-23T08:00:00.000Z",
    activatedAt: "2026-09-23T08:00:00.000Z",
    deactivatedAt: null,
    archivedAt: null,
  }), true);
});

test("B3 Active Flight setup UI no longer asks for runway or flaps", () => {
  const source = fs.readFileSync(
    new URL("../components/ft-flight/FtActiveFlight.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /name="runway"/);
  assert.doesNotMatch(source, /name="flaps"/);
  assert.doesNotMatch(source, /name="antiIce"/);
  assert.match(source, /select in Performance/);
});

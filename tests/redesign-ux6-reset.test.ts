import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getAircraftContentIa } from "../lib/aircraft-content-ia.ts";
import { ftFastPathDestinations } from "../components/ft-shell/navigation.ts";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("P1.1 replaces the old five-destination IA with explicit Learn and EFB modes", () => {
  assert.deepEqual(
    getAircraftContentIa("mode-aircraft", "learn").map((destination) => destination.label),
    ["LEARN", "SYSTEMS", "PROCEDURES", "LIMITATIONS", "REFERENCE"],
  );
  assert.deepEqual(
    getAircraftContentIa("mode-aircraft", "efb").map((destination) => destination.label),
    ["FLIGHT BRIEF", "PERFORMANCE", "CHECKLIST", "QRH"],
  );
});

test("P1.1 preserves W3 fast-path semantics inside EFB", () => {
  assert.deepEqual(
    ftFastPathDestinations("mode-aircraft").map((destination) => destination.label),
    ["CHECKLIST", "QRH", "PERF", "REF"],
  );
});

test("ROADMAP is the single authoritative phase plan", () => {
  const roadmap = read("ROADMAP.md");
  assert.match(roadmap, /single authoritative implementation roadmap/i);
  assert.match(roadmap, /P1\.1/);
  assert.match(roadmap, /P1\.2/);
  assert.match(roadmap, /P1\.3/);
  assert.match(roadmap, /P1\.4/);
});

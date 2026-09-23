import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getAircraftContentIa } from "../lib/aircraft-content-ia.ts";
import { ftFastPathDestinations } from "../components/ft-shell/navigation.ts";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("UX6 reset preserves the frozen five-destination top-level IA", () => {
  const ia = getAircraftContentIa("ux6-aircraft");

  assert.deepEqual(
    ia.map((destination) => destination.label),
    ["AIRCRAFT", "PROCEDURES", "PERFORMANCE", "TRAINING", "FLIGHT"],
  );

  assert.ok(
    ia.find((destination) => destination.key === "aircraft")?.subs.some(
      (destination) => destination.key === "systems",
    ),
  );
  assert.ok(
    ia.find((destination) => destination.key === "flight")?.subs.some(
      (destination) => destination.key === "reference",
    ),
  );
});

test("UX6 reset preserves W3 fast-path semantics", () => {
  assert.deepEqual(
    ftFastPathDestinations("ux6-aircraft").map((destination) => destination.label),
    ["CHECKLIST", "QRH", "PERF", "REF"],
  );
});

test("P1.1 ROADMAP is the single authoritative active implementation roadmap", () => {
  const roadmap = read("ROADMAP.md");

  assert.match(roadmap, /single authoritative product\/implementation roadmap/i);
  assert.match(roadmap, /P1\.1 — LEARN \/ EFB product mode split — IN PROGRESS/i);
  assert.match(roadmap, /P1\.2 — Versioned Performance Snapshot V2/i);
  assert.match(roadmap, /P1\.3 — Canonical Performance operation controller/i);
  assert.match(roadmap, /P1\.4 — Flight Brief becomes EFB home/i);
});

test("UX6 inventory identifies the current desktop width constraint as presentation debt", () => {
  const inventory = read("UX6_0_INVENTORY.md");

  assert.match(inventory, /content > \*/i);
  assert.match(inventory, /under-filled desktop composition/i);
  assert.match(inventory, /development scaffold/i);
});

test("UX6.1 records owner Gate A approval before production design work", () => {
  const concept = read("UX6_1_SHELL_IA.md");

  assert.match(concept, /APPROVED — PRODUCT OWNER GATE A PASSED/i);
  assert.match(concept, /five top-level destinations/i);
  assert.match(concept, /Systems and Reference must appear through contextual\/sub-navigation/i);
  assert.match(concept, /bottom sheet/i);
});

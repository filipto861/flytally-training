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

test("UX6 docs classify UX5 visual approval as rejected and C0 as held", () => {
  const roadmap = read("REDESIGN.md");
  const brief = read("UX6_FOUNDATIONAL_REDESIGN.md");

  assert.match(roadmap, /VISUAL APPROVAL REJECTED/i);
  assert.match(roadmap, /C0 is on HOLD/i);
  assert.match(roadmap, /UX6 foundational redesign/i);

  assert.match(brief, /UX5\s+VISUAL APPROVAL REJECTED/i);
  assert.match(brief, /C0\s+HOLD/i);
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

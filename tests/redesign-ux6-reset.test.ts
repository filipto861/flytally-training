import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getAircraftModeDestinations } from "../lib/aircraft-product-mode.ts";
import { ftFastPathDestinations } from "../components/ft-shell/navigation.ts";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("P1.1 replaces the mixed five-destination shell with explicit Learn and EFB modes", () => {
  assert.deepEqual(
    getAircraftModeDestinations("ux6-aircraft", "learn").map((destination) => destination.label),
    ["Learn", "Systems", "Procedures", "Limitations", "Reference"],
  );
  assert.deepEqual(
    getAircraftModeDestinations("ux6-aircraft", "efb").map((destination) => destination.label),
    ["Flight Brief", "Performance", "Checklist"],
  );
});

test("UX6 reset preserves W3 fast-path semantics", () => {
  assert.deepEqual(
    ftFastPathDestinations("ux6-aircraft").map((destination) => destination.label),
    ["CHECKLIST", "QRH", "PERF", "REF"],
  );
});

test("current ROADMAP owns forward execution while preserving the LEARN/EFB architecture", () => {
  const roadmap = read("ROADMAP.md");

  assert.match(roadmap, /canonical execution plan for `flytally-training`/i);
  assert.match(roadmap, /LEARN.*aircraft knowledge/i);
  assert.match(roadmap, /EFB.*Active Flight.*Flight Brief.*Performance/i);
  assert.match(roadmap, /R1 — EFB Safety & Foundation Closure/i);
  assert.match(roadmap, /R2 — Cockpit Workflow \/ Digital Binder/i);
  assert.doesNotMatch(roadmap, /## Active implementation order/);
});

test("current technical documentation keeps the shell responsive across cockpit form factors", () => {
  const docs = read("TECHNICAL_DOCUMENTATION.md");
  assert.match(docs, /cockpit\/tablet use first/i);
  assert.match(docs, /desktop and mobile/i);
  assert.match(docs, /touch targets and safe-area handling support iPad\/mobile use/i);
});

test("current technical documentation records the live LEARN/EFB information architecture", () => {
  const docs = read("TECHNICAL_DOCUMENTATION.md");
  assert.match(docs, /LEARN and EFB are explicit product modes/i);
  assert.match(docs, /fast-path CHECKLIST\/QRH\/PERF\/REF remains persistent/i);
  assert.match(docs, /shared across production routes/i);
});

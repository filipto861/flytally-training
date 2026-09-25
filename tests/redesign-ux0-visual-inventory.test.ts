import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("UX0 inventory preserves the frozen five-destination IA", () => {
  const inventory = read("TECHNICAL_DOCUMENTATION.md");

  assert.match(
    inventory,
    /AIRCRAFT \/ PROCEDURES \/ PERFORMANCE \/ TRAINING \/ FLIGHT/,
  );
  assert.match(
    inventory,
    /CHECKLIST \/ QRH \/ PERF \/ REF/,
  );
});

test("UX0 explicitly classifies the current shell as a development scaffold", () => {
  const inventory = read("TECHNICAL_DOCUMENTATION.md");

  assert.match(inventory, /functional\s+development scaffold/i);
  assert.match(inventory, /technical wireframe/i);
  assert.doesNotMatch(inventory, /current UI is final/i);
});

test("UX0 audits all four browser acceptance classes", () => {
  const inventory = read("TECHNICAL_DOCUMENTATION.md");

  for (const viewport of [
    "Desktop Chromium",
    "iPad landscape",
    "iPad portrait",
    "Narrow mobile",
  ]) {
    assert.match(inventory, new RegExp(viewport, "i"));
  }
});

test("UX0 identifies shell-level composition before page polish", () => {
  const inventory = read("TECHNICAL_DOCUMENTATION.md");

  assert.match(inventory, /content frame\/max-width/i);
  assert.match(inventory, /sidebar width/i);
  assert.match(inventory, /top bar/i);
  assert.match(inventory, /fast-path dominance/i);
  assert.match(inventory, /UX1 must not redesign P0–P7 page internals/i);
});

test("UX0 keeps operational semantics separate from visual emphasis", () => {
  const inventory = read("TECHNICAL_DOCUMENTATION.md");

  assert.match(inventory, /No fake authority cues/i);
  assert.match(inventory, /must not imply source validity, recency or safety state/i);
});

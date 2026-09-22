import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("UX5 requires the complete production visual review matrix", () => {
  const doc = read("UX5_FINAL_VISUAL_ACCEPTANCE.md");

  for (const route of [
    "/aircraft/learjet-35a",
    "/aircraft/learjet-35a/procedures",
    "/aircraft/learjet-35a/performance",
    "/aircraft/learjet-35a/training",
    "/aircraft/learjet-35a/reference",
    "/aircraft/learjet-35a/fly",
    "/aircraft/learjet-35a/systems",
  ]) {
    assert.match(doc, new RegExp(route.replaceAll("/", "\\/")));
  }

  for (const viewport of [
    "Desktop Chromium",
    "iPad landscape",
    "iPad portrait",
    "Narrow mobile",
  ]) {
    assert.match(doc, new RegExp(viewport, "i"));
  }
});

test("UX5 cannot complete from automated tests without product-owner approval", () => {
  const doc = read("UX5_FINAL_VISUAL_ACCEPTANCE.md");

  assert.match(doc, /explicitly approve/i);
  assert.match(doc, /Do not mark UX5 complete from automated tests alone/i);
  assert.match(doc, /Status: \*\*IN PROGRESS\*\*/);
});

test("UX5 capture targets production and records screenshots plus diagnostic timing", () => {
  const script = read("scripts/capture-ux5-visuals.mjs");

  assert.match(script, /https:\/\/training\.fly-tally\.com/);
  assert.match(script, /page\.screenshot/);
  assert.match(script, /manifest\.json/);
  assert.match(script, /PerformanceNavigationTiming/);
  assert.match(script, /1664/);
  assert.match(script, /1112/);
  assert.match(script, /834/);
  assert.match(script, /390/);
});

test("UX5 screenshot artifacts stay out of source control", () => {
  const ignore = read(".gitignore");
  assert.match(ignore, /^ux5-screenshots\/$/m);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getAircraftContentIa,
  getAircraftContentSectionForPathname,
} from "../lib/aircraft-content-ia.ts";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("UX5 requires the complete production visual review matrix", () => {
  const doc = read("UX5_FINAL_VISUAL_ACCEPTANCE.md");

  for (const route of [
    "/",
    "/aircraft/learjet-35a",
    "/aircraft/learjet-35a/procedures",
    "/aircraft/learjet-35a/performance",
    "/aircraft/learjet-35a/training",
    "/aircraft/learjet-35a/reference",
    "/aircraft/learjet-35a/flight",
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

  assert.match(doc, /light and dark workspace themes/i);
});

test("UX5 canonical FLIGHT destination enters P1 while legacy fly remains classified", () => {
  const aircraftId = "test-aircraft";
  const flight = getAircraftContentIa(aircraftId).find(
    (destination) => destination.key === "flight",
  );

  assert.equal(flight?.href, `/aircraft/${aircraftId}/flight`);
  assert.equal(
    getAircraftContentSectionForPathname(
      `/aircraft/${aircraftId}/fly`,
      aircraftId,
    ),
    "flight",
  );
});

test("UX5 removes website footer chrome inside the new aircraft application shell", () => {
  const theme = read("app/ft-workspace/theme.css");
  assert.match(
    theme,
    /body:has\(\.ft-workspace \[data-ft-shell="true"\]\) \.app-footer[\s\S]*display:\s*none/,
  );
});

test("UX5 performance source explanation is progressively disclosed", () => {
  const explanation = read("components/ft-performance/FtPerformanceExplanation.tsx");
  assert.match(explanation, /<details/);
  assert.match(explanation, /Calculation context &amp; sources/);
  assert.doesNotMatch(explanation, /<section/);
});

test("UX5 shell Active Flight status is derived from the real lifecycle", () => {
  const topBar = read("components/ft-shell/FtTopBar.tsx");
  const shell = read("components/ft-shell/FtShell.tsx");

  assert.match(topBar, /activeFlight\?\.lifecycle === "ACTIVE"/);
  assert.match(topBar, /current\.departure\.icao/);
  assert.match(topBar, /current\.destination\.icao/);
  assert.match(shell, /activeFlight=\{activeFlight\}/);
});

test("UX5 cannot complete from automated tests without product-owner approval", () => {
  const doc = read("UX5_FINAL_VISUAL_ACCEPTANCE.md");

  assert.match(doc, /explicitly approve/i);
  assert.match(doc, /Do not mark UX5 complete from automated tests alone/i);
  assert.match(doc, /Status: \*\*IN PROGRESS\*\*/);
});

test("UX5 capture targets production, both themes, and diagnostic unavailable states", () => {
  const script = read("scripts/capture-ux5-visuals.mjs");

  assert.match(script, /https:\/\/training\.fly-tally\.com/);
  assert.match(script, /page\.screenshot/);
  assert.match(script, /manifest\.json/);
  assert.match(script, /PerformanceNavigationTiming/);
  assert.match(script, /const themes = \["light", "dark"\]/);
  assert.match(script, /colorScheme:\s*theme/);
  assert.match(script, /unavailable/);
  assert.match(script, /\/aircraft\/learjet-35a\/flight/);
  assert.doesNotMatch(script, /\["flight", "\/aircraft\/learjet-35a\/fly"\]/);
  assert.match(script, /1664/);
  assert.match(script, /1112/);
  assert.match(script, /834/);
  assert.match(script, /390/);
});

test("UX5 screenshot artifacts stay out of source control", () => {
  const ignore = read(".gitignore");
  assert.match(ignore, /^ux5-screenshots\/$/m);
});

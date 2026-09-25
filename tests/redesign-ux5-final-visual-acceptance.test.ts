import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getAircraftContentIa,
  getAircraftContentSectionForPathname,
} from "../lib/aircraft-content-ia.ts";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("current technical documentation keeps responsive browser acceptance in the release strategy", () => {
  const doc = read("TECHNICAL_DOCUMENTATION.md");
  assert.match(doc, /Browser acceptance uses Playwright across desktop, mobile and iPad projects/i);
  assert.match(doc, /production readiness\/manual smoke where required/i);
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
  const presentation = read("app/v300-u6-acceptance.css");
  const theme = read("app/ft-workspace/theme.css");

  assert.match(
    presentation,
    /body:has\(\.ft-workspace \[data-ft-shell="true"\]\) \.app-footer[\s\S]*display:\s*none/,
  );
  assert.doesNotMatch(theme, /\.app-footer|display:\s*none/);
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

  assert.match(topBar, /useActiveFlightState\(aircraftId, activeFlight\)/);
  assert.match(topBar, /flight\?\.lifecycle === "ACTIVE"/);
  assert.match(topBar, /current\.departure\.icao/);
  assert.match(topBar, /current\.destination\.icao/);
  assert.match(shell, /activeFlight=\{activeFlight\}/);
});

test("visual acceptance remains layered rather than build-only", () => {
  const doc = read("TECHNICAL_DOCUMENTATION.md");
  assert.match(doc, /production readiness\/manual smoke where required/i);
  assert.match(doc, /A green application build is not sufficient by itself/i);
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

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getAircraftContentIa,
  getAircraftContentSectionForPathname,
} from "../lib/aircraft-content-ia.ts";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("P1.1 EFB FLIGHT BRIEF destination enters the P1 flight workspace and /fly is Checklist", () => {
  const aircraftId = "test-aircraft";
  const flight = getAircraftContentIa(aircraftId, "efb").find(
    (destination) => destination.key === "flight",
  );

  assert.equal(flight?.href, `/aircraft/${aircraftId}/flight`);
  assert.equal(
    getAircraftContentSectionForPathname(
      `/aircraft/${aircraftId}/fly`,
      aircraftId,
    ),
    "checklist",
  );
});

test("new aircraft application shell removes website footer chrome", () => {
  const presentation = read("app/v300-u6-acceptance.css");
  const theme = read("app/ft-workspace/theme.css");

  assert.match(
    presentation,
    /body:has\(\.ft-workspace \[data-ft-shell="true"\]\) \.app-footer[\s\S]*display:\s*none/,
  );
  assert.doesNotMatch(theme, /\.app-footer|display:\s*none/);
});

test("performance source explanation remains progressively disclosed", () => {
  const explanation = read("components/ft-performance/FtPerformanceExplanation.tsx");
  assert.match(explanation, /<details/);
  assert.match(explanation, /Calculation context &amp; sources/);
  assert.doesNotMatch(explanation, /<section/);
});

test("EFB top bar Active Flight status is derived from the real lifecycle", () => {
  const topBar = read("components/ft-shell/FtTopBar.tsx");
  const shell = read("components/ft-shell/FtShell.tsx");

  assert.match(topBar, /activeFlight\?\.lifecycle === "ACTIVE"/);
  assert.match(topBar, /mode === "efb"/);
  assert.match(topBar, /current\.departure\.icao/);
  assert.match(topBar, /current\.destination\.icao/);
  assert.match(shell, /activeFlight=\{activeFlight\}/);
});

test("visual capture targets production, both themes, and diagnostic unavailable states", () => {
  const script = read("scripts/capture-ux5-visuals.mjs");

  assert.match(script, /https:\/\/training\.fly-tally\.com/);
  assert.match(script, /page\.screenshot/);
  assert.match(script, /manifest\.json/);
  assert.match(script, /const themes = \["light", "dark"\]/);
  assert.match(script, /1664/);
  assert.match(script, /1112/);
  assert.match(script, /834/);
  assert.match(script, /390/);
});

test("visual screenshot artifacts stay out of source control", () => {
  const ignore = read(".gitignore");
  assert.match(ignore, /^ux5-screenshots\/$/m);
});

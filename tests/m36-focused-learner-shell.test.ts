import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const nav = fs.readFileSync(new URL("../components/aircraft-workspace-nav.tsx", import.meta.url), "utf8");
const navCss = fs.readFileSync(new URL("../components/aircraft-workspace-nav.module.css", import.meta.url), "utf8");
const shellCss = fs.readFileSync(new URL("../app/learner-shell.css", import.meta.url), "utf8");
const aircraftHome = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/page.tsx", import.meta.url), "utf8");

test("focused learner shell keeps one aircraft navigator with stable primary destinations", () => {
  assert.match(nav, /learner-pilot-nav/);
  assert.match(nav, /primaryDestinations/);
  assert.match(nav, /primaryNav/);
  assert.doesNotMatch(nav, /areaNav|collapsedGroup|expandedGroup|activeGroup/);
});

test("module detail is moved into dedicated hub pages instead of a persistent second menu row", () => {
  const trainingHub = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/training/page.tsx", import.meta.url), "utf8");
  const referenceHub = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/reference/page.tsx", import.meta.url), "utf8");
  assert.match(trainingHub, /Learn the aircraft/);
  assert.match(referenceHub, /Flight reference/);
  assert.match(trainingHub, /capabilities\.systems/);
  assert.match(referenceHub, /capabilities\.performance/);
});

test("learner pages use an EFB rail on desktop and a bottom tab bar on mobile", () => {
  assert.match(navCss, /position:sticky/);
  assert.match(navCss, /position:fixed/);
  assert.match(navCss, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(shellCss, /grid-template-columns:220px minmax\(0,1fr\)/);
  assert.match(shellCss, /workspace-section-hero/);
});

test("aircraft home is a command surface rather than a module catalogue", () => {
  assert.match(aircraftHome, /pilot-command-grid/);
  assert.match(aircraftHome, /Quick actions/);
  assert.match(aircraftHome, /Open training/);
  assert.doesNotMatch(aircraftHome, /workspace-overview|workspace-card|focused-choice-grid|Training references/);
});

test("focused learner shell remains aircraft-agnostic and capability-driven", () => {
  assert.match(nav, /listPublishedModuleDomains/);
  assert.match(aircraftHome, /capabilities\.systems/);
  assert.doesNotMatch(nav + aircraftHome, /learjet-35-36|Learjet|Boeing|Cessna|DA40/i);
});

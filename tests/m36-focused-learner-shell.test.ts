import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const nav = fs.readFileSync(new URL("../components/aircraft-workspace-nav.tsx", import.meta.url), "utf8");
const navCss = fs.readFileSync(new URL("../components/aircraft-workspace-nav.module.css", import.meta.url), "utf8");
const shellCss = fs.readFileSync(new URL("../app/learner-shell.css", import.meta.url), "utf8");
const aircraftHome = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/page.tsx", import.meta.url), "utf8");

test("M36 simplification evolves into one compact aircraft task navigator", () => {
  assert.match(nav, /learner-pilot-nav/);
  assert.match(nav, /primaryNav/);
  assert.match(nav, /areaNav/);
  assert.doesNotMatch(nav, /learner-sidebar|collapsedGroup|expandedGroup|activeGroup/);
});

test("only the active pilot area exposes its module-level navigation", () => {
  assert.match(nav, /const currentArea = visibleAreas\.find/);
  assert.match(nav, /currentArea && currentArea\.entries\.length > 1/);
  assert.match(nav, /currentArea\.entries\.map/);
  assert.match(nav, /aria-label=\{`\$\{currentArea\.label\} sections`\}/);
});

test("learner pages return to a single content column with a compact sticky navigator", () => {
  assert.match(navCss, /position:sticky/);
  assert.match(shellCss, /\.shell:has\(> \.learner-pilot-nav\)/);
  assert.doesNotMatch(shellCss, /grid-template-columns:220px minmax\(0,1fr\)/);
  assert.doesNotMatch(shellCss, /learner-sidebar/);
  assert.match(shellCss, /workspace-section-hero/);
});

test("aircraft home is an action surface rather than a module catalogue", () => {
  assert.match(aircraftHome, /pilot-home-layout/);
  assert.match(aircraftHome, /pilot-primary-card/);
  assert.match(aircraftHome, /Quick access/);
  assert.doesNotMatch(aircraftHome, /workspace-overview|workspace-card|focused-choice-grid|Training references/);
});

test("focused learner shell remains aircraft-agnostic and capability-driven", () => {
  assert.match(nav, /listPublishedModuleDomains/);
  assert.match(aircraftHome, /capabilities\.systems/);
  assert.doesNotMatch(nav + aircraftHome, /learjet-35-36|Learjet|Boeing|Cessna|DA40/i);
});

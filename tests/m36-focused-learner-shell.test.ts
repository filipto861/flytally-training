import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const nav = fs.readFileSync(new URL("../components/aircraft-workspace-nav.tsx", import.meta.url), "utf8");
const navCss = fs.readFileSync(new URL("../components/aircraft-workspace-nav.module.css", import.meta.url), "utf8");
const shellCss = fs.readFileSync(new URL("../app/learner-shell.css", import.meta.url), "utf8");
const aircraftHome = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/page.tsx", import.meta.url), "utf8");

test("M36 exposes one contextual aircraft navigation surface", () => {
  assert.match(nav, /<aside className=\{`\$\{styles\.navigator\} learner-sidebar`\}/);
  assert.match(nav, /activeGroup !== group/);
  assert.match(nav, /collapsedGroup/);
  assert.match(nav, /expandedGroup/);
  assert.doesNotMatch(nav, /workspace-nav-primary|workspace-nav-secondary|utilityRow|groups/);
});

test("only the active FLY or LEARN group expands into module links", () => {
  assert.match(nav, /renderGroup\("fly", "FLY", flyLinks\)/);
  assert.match(nav, /renderGroup\("learn", "LEARN", learn\)/);
  assert.match(nav, /activeGroup !== group/);
  assert.match(nav, /entries\[0\]\.href/);
  assert.match(nav, /aria-current=\{entry\.key === active \? "page" : undefined\}/);
});

test("desktop learner pages use a sticky sidebar and one content column", () => {
  assert.match(navCss, /position:sticky/);
  assert.match(shellCss, /grid-template-columns:220px minmax\(0,1fr\)/);
  assert.match(shellCss, />\.learner-sidebar\{grid-column:1/);
  assert.match(shellCss, />:not\(\.learner-sidebar\)\{grid-column:2/);
  assert.match(shellCss, /@media\(max-width:860px\)/);
});

test("aircraft home no longer repeats the whole module catalogue", () => {
  assert.match(aircraftHome, /focused-choice-grid/);
  assert.match(aircraftHome, /Cockpit tools/);
  assert.match(aircraftHome, /Study & practice/);
  assert.match(aircraftHome, /<details className="focused-reference">/);
  assert.doesNotMatch(aircraftHome, /workspace-overview|workspace-card|availableFly\.map|availableLearn\.map/);
});

test("focused shell remains aircraft-agnostic and publication-driven", () => {
  assert.match(nav, /listPublishedModuleDomains/);
  assert.match(nav, /aircraftWorkspaceSections\(aircraftId, publishedDomains\)/);
  assert.doesNotMatch(nav + aircraftHome, /learjet-35-36|Learjet|Boeing|Cessna|DA40/i);
});

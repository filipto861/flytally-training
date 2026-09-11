import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const nav = fs.readFileSync(new URL("../components/aircraft-workspace-nav.tsx", import.meta.url), "utf8");
const navCss = fs.readFileSync(new URL("../components/aircraft-workspace-nav.module.css", import.meta.url), "utf8");
const shellCss = fs.readFileSync(new URL("../app/learner-shell.css", import.meta.url), "utf8");
const aircraftHome = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/page.tsx", import.meta.url), "utf8");
const library = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const productShell = fs.readFileSync(new URL("../components/product-shell.tsx", import.meta.url), "utf8");

test("M37 groups learner content by pilot tasks instead of internal domain taxonomy", () => {
  assert.match(nav, /type PilotArea = "training" \| "checklists" \| "reference"/);
  assert.match(nav, /label: "Training"/);
  assert.match(nav, /label: "Checklists"/);
  assert.match(nav, /label: "Reference"/);
  assert.doesNotMatch(nav, /"FLY"|"LEARN"/);
});

test("M37 keeps domain detail contextual and hidden until the area is active", () => {
  assert.match(nav, /const currentArea = visibleAreas\.find/);
  assert.match(nav, /currentArea && currentArea\.entries\.length > 1/);
  assert.match(nav, /currentArea\.entries\.map/);
  assert.match(navCss, /\.areaNav/);
  assert.doesNotMatch(navCss, /\.expandedGroup|\.collapsedGroup/);
});

test("pilot home emphasizes the next action and only a small quick-access set", () => {
  assert.match(aircraftHome, /const primary = trainingStart/);
  assert.match(aircraftHome, /pilot-primary-card/);
  assert.match(aircraftHome, /Quick access/);
  assert.match(aircraftHome, /Normal checklist/);
  assert.match(aircraftHome, /Abnormal \/ Emergency/);
  assert.doesNotMatch(aircraftHome, /Training references|workspaceProfile|publisher|revision/);
});

test("aircraft library is a pilot selection screen rather than a content-governance dashboard", () => {
  assert.match(library, /Select an aircraft to start training/);
  assert.match(library, /pilot-aircraft-row/);
  assert.doesNotMatch(library, /Module-driven|governed training content|content repository|manual\.publisher|manual\.revision/);
});

test("global and aircraft chrome remove redundant navigation layers", () => {
  assert.doesNotMatch(productShell, /global-nav/);
  assert.match(shellCss, /learner-pilot-nav/);
  assert.doesNotMatch(shellCss, /learner-sidebar|grid-template-columns:220px/);
  assert.match(nav, /className=\{styles\.progressLink\}/);
});

test("pilot-first navigation is aircraft-agnostic and still publication-driven", () => {
  assert.match(nav, /listPublishedModuleDomains/);
  assert.match(nav, /aircraftWorkspaceSections\(aircraftId, publishedDomains\)/);
  assert.doesNotMatch(nav + aircraftHome + library, /learjet-35-36|Learjet|Boeing|Cessna|DA40|Rotax/i);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const nav = fs.readFileSync(new URL("../components/aircraft-workspace-nav.tsx", import.meta.url), "utf8");
const navCss = fs.readFileSync(new URL("../components/aircraft-workspace-nav.module.css", import.meta.url), "utf8");
const shellCss = fs.readFileSync(new URL("../app/learner-shell.css", import.meta.url), "utf8");
const aircraftHome = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/page.tsx", import.meta.url), "utf8");
const library = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const productShell = fs.readFileSync(new URL("../components/product-shell.tsx", import.meta.url), "utf8");

test("pilot-first grouping evolves into explicit Fly, Learn and Reference areas", () => {
  assert.match(nav, /type PilotArea = "fly" \| "learn" \| "reference"/);
  assert.match(nav, /label: "Fly"/);
  assert.match(nav, /label: "Learn"/);
  assert.match(nav, /label: "Reference"/);
  assert.match(nav, /\/fly/);
});

test("persistent module-level submenu is removed in favor of dedicated area hubs", () => {
  assert.doesNotMatch(nav, /areaNav|currentArea\.entries\.map/);
  assert.doesNotMatch(navCss, /\.areaNav|\.expandedGroup|\.collapsedGroup/);
  assert.match(nav, /\/training/);
  assert.match(nav, /\/reference/);
});

test("pilot home emphasizes operational, learning and reference tasks instead of content taxonomy", () => {
  assert.match(aircraftHome, /pilot-command-panel-primary/);
  assert.match(aircraftHome, /<h2>Fly<\/h2>/);
  assert.match(aircraftHome, /Open Fly/);
  assert.match(aircraftHome, /<h2>Learn<\/h2>/);
  assert.match(aircraftHome, /<h2>Reference<\/h2>/);
  assert.match(aircraftHome, /Abnormal & Emergency/);
  assert.doesNotMatch(aircraftHome, /Training references|workspaceProfile|publisher|revision/);
});

test("aircraft library remains a pilot selection screen rather than a governance dashboard", () => {
  assert.match(library, /Select an aircraft to open its training workspace/);
  assert.match(library, /pilot-aircraft-row/);
  assert.doesNotMatch(library, /Module-driven|governed training content|content repository|manual\.publisher|manual\.revision/);
});

test("global chrome stays minimal while aircraft navigation becomes app-like", () => {
  assert.doesNotMatch(productShell, /global-nav/);
  assert.match(shellCss, /learner-pilot-nav/);
  assert.match(navCss, /primaryNav/);
  assert.match(nav, /className=\{styles\.progressLink\}/);
});

test("pilot-first navigation is aircraft-agnostic and still publication-driven", () => {
  assert.match(nav, /listPublishedModuleDomains/);
  assert.match(nav, /getBundledPerformancePackage/);
  assert.match(nav, /bundledPerformance && !publishedDomains\.includes\("performance"\)/);
  assert.match(nav, /aircraftWorkspaceSections\(aircraftId, effectiveDomains\)/);
  assert.doesNotMatch(nav + aircraftHome + library, /learjet-35-36|Learjet|Boeing|Cessna|DA40|Rotax/i);
});

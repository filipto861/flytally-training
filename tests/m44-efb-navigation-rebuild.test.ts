import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const nav=read("components/aircraft-workspace-nav.tsx");
const navCss=read("components/aircraft-workspace-nav.module.css");
const learnerCss=read("app/learner-shell.css");
const home=read("app/aircraft/[aircraftId]/page.tsx");
const training=read("app/aircraft/[aircraftId]/training/page.tsx");
const reference=read("app/aircraft/[aircraftId]/reference/page.tsx");
const admin=read("components/admin-aircraft-workspace.tsx");
const adminCss=read("components/admin-aircraft-workspace.module.css");

test("M44 replaces stacked learner menus with a stable EFB navigation rail",()=>{
  assert.match(nav,/primaryDestinations/);
  assert.match(nav,/\/training/);
  assert.match(nav,/\/reference/);
  assert.doesNotMatch(nav,/areaNav|currentArea/);
  assert.match(navCss,/min-height:calc\(100vh - 112px\)/);
  assert.match(learnerCss,/grid-template-columns:220px minmax\(0,1fr\)/);
});

test("M44 mobile navigation is a four-destination bottom tab bar",()=>{
  assert.match(navCss,/position:fixed/);
  assert.match(navCss,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  for(const label of ["Home","Training","Checklists","Reference"])assert.match(nav,new RegExp(`label: \"${label}\"`));
});

test("M44 moves detail into capability-driven training and reference hubs",()=>{
  assert.match(training,/capabilities\.systems/);
  assert.match(training,/capabilities\.procedures/);
  assert.match(training,/capabilities\.knowledge/);
  assert.match(reference,/capabilities\.performance/);
  assert.match(reference,/capabilities\.weightBalance/);
  assert.match(reference,/capabilities\.abnormalEmergency/);
  assert.doesNotMatch(training+reference,/bristell|learjet|cessna|boeing/i);
});

test("M44 aircraft home becomes a command center with direct operational actions",()=>{
  assert.match(home,/pilot-command-grid/);
  assert.match(home,/Open training/);
  assert.match(home,/Normal checklist/);
  assert.match(home,/Performance/);
  assert.match(home,/Weight & Balance/);
});

test("M44 simplifies the admin aircraft shell into one sticky task tab row",()=>{
  assert.match(admin,/className=\{styles\.tabs\}/);
  assert.doesNotMatch(admin,/className=\{styles\.sidebar\}/);
  assert.match(adminCss,/\.tabs\{position:sticky/);
  assert.doesNotMatch(adminCss,/grid-template-columns:220px/);
});

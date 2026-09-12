import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const home=read("app/aircraft/[aircraftId]/page.tsx");
const training=read("app/aircraft/[aircraftId]/training/page.tsx");
const reference=read("app/aircraft/[aircraftId]/reference/page.tsx");
const nav=read("components/aircraft-workspace-nav.tsx");
const navCss=read("components/aircraft-workspace-nav.module.css");
const learnerCss=read("app/learner-shell.css");
const systems=read("components/systems-browser.tsx");
const systemsCss=read("components/systems-browser.module.css");
const procedures=read("components/procedure-browser.tsx");
const proceduresCss=read("components/procedure-browser.module.css");
const systemPage=read("app/aircraft/[aircraftId]/systems/page.tsx");
const procedurePage=read("app/aircraft/[aircraftId]/procedures/page.tsx");
const checklistPage=read("app/aircraft/[aircraftId]/checklists/page.tsx");

test("M47 home exposes Fly, Learn and Reference as independent pilot destinations",()=>{
  assert.match(home,/h2>Fly</);
  assert.match(home,/h2>Learn</);
  assert.match(home,/h2>Reference</);
  assert.match(home,/capabilities\.performance \|\| capabilities\.weightBalance/);
  assert.doesNotMatch(home,/hasTraining \?[^]*: hasReference \?/);
});

test("M47 removes navigation chrome that competes with pilot content",()=>{
  assert.doesNotMatch(nav,/Published, source-backed aircraft content/);
  assert.match(nav,/All configurations/);
  assert.match(navCss,/background:rgba\(255,255,255,.94\)/);
  assert.match(learnerCss,/grid-template-columns:196px minmax\(0,1fr\)/);
  assert.match(learnerCss,/pilot-command-grid\{display:grid;grid-template-columns:repeat\(3/);
});

test("M47 hub copy is short and task-oriented",()=>{
  assert.match(training,/>Learn<\/h1>/);
  assert.match(reference,/>Reference<\/h1>/);
  assert.doesNotMatch(training,/The Fly section stays operational and distraction-free/);
  assert.doesNotMatch(reference,/Operational numbers and quick-reference material/);
});

test("systems and procedures use a single mobile topic picker instead of a second scrolling index",()=>{
  assert.match(systems,/mobilePicker/);
  assert.match(systems,/selectSystem\(event\.target\.value\)/);
  assert.match(systemsCss,/\.index\{display:none\}/);
  assert.match(procedures,/mobilePicker/);
  assert.match(procedures,/selectProcedure\(event\.target\.value\)/);
  assert.match(proceduresCss,/\.index\{display:none\}/);
});

test("learning source metadata remains available without dominating the page",()=>{
  assert.match(systemPage,/details className="pilot-source-details"/);
  assert.match(procedurePage,/details className="pilot-source-details"/);
  assert.match(checklistPage,/details className="pilot-source-details"/);
  assert.match(learnerCss,/pilot-source-details/);
});

test("M47 learner UI stays aircraft agnostic",()=>{
  assert.doesNotMatch(home+training+reference+nav+systems+procedures,/bristell|learjet|cessna|boeing|rotax/i);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const operational=read("components/operational-checklist.tsx");
const operationalCss=read("components/operational-checklist.module.css");
const systems=read("app/aircraft/[aircraftId]/systems/page.tsx");
const procedures=read("app/aircraft/[aircraftId]/procedures/page.tsx");
const checklists=read("app/aircraft/[aircraftId]/checklists/page.tsx");

test("M48 replaces the dense Fly phase-chip strip with one explicit phase control",()=>{
  assert.match(operational,/aria-label="Checklist phase"/);
  assert.match(operational,/Phase \{phaseIndex \+ 1\} of \{checklist\.phases\.length\}/);
  assert.match(operational,/phaseDone \? "✓ " : ""/);
  assert.doesNotMatch(operational,/<nav className=\{styles\.phases\}/);
  assert.doesNotMatch(operationalCss,/\.phases\{/);
});

test("phase jumping remains compatible with progress persistence, reset protection and previous-next flow",()=>{
  assert.match(operational,/choosePhase\(event\.target\.value\)/);
  assert.match(operational,/localStorage/);
  assert.match(operational,/resetArmed/);
  assert.match(operational,/previous\.id/);
  assert.match(operational,/next\.id/);
});

test("the compact phase control stays touch-first on mobile",()=>{
  assert.match(operationalCss,/phaseBar/);
  assert.match(operationalCss,/position:sticky/);
  assert.match(operationalCss,/min-height:50px/);
  assert.match(operationalCss,/font-size:16px/);
});

test("deep Learn pages stop repeating aircraft-specific document titles as the primary heading",()=>{
  assert.match(systems,/<h1>Systems<\/h1>/);
  assert.match(procedures,/<h1>Procedures<\/h1>/);
  assert.match(checklists,/<h1>Checklist training<\/h1>/);
  assert.doesNotMatch(systems,/configuredUniversal\?\.title/);
  assert.doesNotMatch(procedures,/configuredUniversal\?\.title/);
  assert.doesNotMatch(checklists,/<h1>\{checklist\.title\}<\/h1>/);
});

test("M48 remains aircraft agnostic",()=>{
  assert.doesNotMatch(operational+systems+procedures+checklists,/bristell|learjet|cessna|boeing|rotax/i);
});

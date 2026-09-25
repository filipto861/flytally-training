import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const emergency=read("components/operational-emergency.tsx");
const css=read("components/operational-emergency.module.css");

test("M54 builds emergency categories from published operational data instead of aircraft-specific UI",()=>{
  assert.match(emergency,/new Set\(emergency\.scenarios\.map\(\(scenario\) => scenario\.category\)\)/);
  assert.match(emergency,/candidate\.category === category/);
  assert.match(emergency,/QRH categories/);
  assert.doesNotMatch(emergency,/\[\s*["']Engine["']|\[\s*["']Fire["']|\[\s*["']Landing["']/);
});

test("M54 supports a two-level quick index while preserving the native procedure selector",()=>{
  assert.match(emergency,/Quick access/);
  assert.match(emergency,/aria-pressed=\{category === item\}/);
  assert.match(emergency,/category !== ALL_CATEGORIES/);
  assert.match(emergency,/className=\{styles\.quickProcedures\}/);
  assert.match(emergency,/candidate\.phase/);
  assert.match(emergency,/aria-label="QRH procedure"/);
});

test("changing category keeps the current scenario when valid and otherwise selects the first published match",()=>{
  assert.match(emergency,/current\?\.category === nextCategory/);
  assert.match(emergency,/emergency\.scenarios\.find\(\(candidate\) => candidate\.category === nextCategory\)/);
  assert.match(emergency,/if \(first\) setScenarioId\(first\.id\)/);
});

test("M54 emergency index is cockpit touch-first and sticky on mobile",()=>{
  assert.match(css,/\.categories button\{[^}]*min-height:42px/);
  assert.match(css,/\.quickProcedures button\{[^}]*min-height:50px/);
  assert.match(css,/@media\(max-width:700px\)\{\.index\{position:sticky;top:72px/);
  assert.match(css,/\.selector select\{min-height:52px;font-size:16px\}/);
});

test("M54 keeps QRH content operational-only",()=>{
  assert.match(emergency,/<Steps steps=\{stage\.steps\} \/>/);
  assert.match(emergency,/step\.text/);
  assert.match(emergency,/Source &amp; authority/);
  assert.doesNotMatch(emergency,/scenario\.setup|scenario\.objectives|scenario\.debrief|stage\.prompt|stage\.explanation|scenario\.minutes|scenario\.difficulty/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("UX6 capture records overflow errors and governed Systems state",()=>{
  const script=read("scripts/capture-ux6-visuals.mjs");

  assert.match(script,/horizontalOverflowPx/);
  assert.match(script,/consoleErrors/);
  assert.match(script,/pageErrors/);
  assert.match(script,/No published Systems package/);
  assert.match(script,/legacyUnavailable/);
  assert.match(script,/procedurePickerVisible/);
  assert.match(script,/firstOperateTop/);
});

test("current roadmap keeps responsive acceptance as a global engineering rule",()=>{
  const roadmap=read("ROADMAP.md");
  assert.match(roadmap,/desktop\/iPad\/mobile acceptance remains mandatory/i);
  assert.match(roadmap,/UX6 visual language remains the production design baseline/i);
});

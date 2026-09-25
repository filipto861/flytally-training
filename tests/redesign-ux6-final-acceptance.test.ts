import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("UX6.9 defines the complete 64-screen acceptance matrix",()=>{
  const doc=read("TECHNICAL_DOCUMENTATION.md");
  for(const route of [
    "/",
    "/aircraft/learjet-35a",
    "/aircraft/learjet-35a/procedures",
    "/aircraft/learjet-35a/performance",
    "/aircraft/learjet-35a/training",
    "/aircraft/learjet-35a/reference",
    "/aircraft/learjet-35a/flight",
    "/aircraft/learjet-35a/systems",
  ]) assert.match(doc,new RegExp(route.replaceAll("/","\\/")));

  for(const viewport of ["1664 × 930","1112 × 834","834 × 1112","390 × 844"]){
    assert.match(doc,new RegExp(viewport));
  }

  assert.match(doc,/64 screenshots/);
  assert.match(doc,/light/);
  assert.match(doc,/dark/);
});

test("UX6.9 capture records overflow errors and governed Systems state",()=>{
  const script=read("scripts/capture-ux6-visuals.mjs");

  assert.match(script,/horizontalOverflowPx/);
  assert.match(script,/consoleErrors/);
  assert.match(script,/pageErrors/);
  assert.match(script,/No published Systems package/);
  assert.match(script,/legacyUnavailable/);
  assert.match(script,/procedurePickerVisible/);
  assert.match(script,/firstOperateTop/);
});

test("UX6.9 keeps explicit product-owner approval as the final visual gate",()=>{
  const doc=read("TECHNICAL_DOCUMENTATION.md");

  assert.match(doc,/Filip explicitly approves/i);
  assert.match(doc,/may not infer product-owner visual approval/i);
  assert.match(doc,/C0 HOLD/);
  assert.match(doc,/C0 UNBLOCKED/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("current documentation keeps responsive Playwright plus production smoke as acceptance layers",()=>{
  const doc=read("TECHNICAL_DOCUMENTATION.md");
  assert.match(doc,/Browser acceptance uses Playwright across desktop, mobile and iPad projects/i);
  assert.match(doc,/production readiness\/manual smoke where required/i);
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

test("current release documentation does not treat a green build as sufficient acceptance",()=>{
  const doc=read("TECHNICAL_DOCUMENTATION.md");
  assert.match(doc,/A green application build is not sufficient by itself/i);
  assert.match(doc,/production readiness\/manual smoke where required/i);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root=path.resolve(import.meta.dirname,"..");
const read=(file:string)=>fs.readFileSync(path.join(root,file),"utf8");

test("v3.2 U2 gives learner surfaces one shared spacing language",()=>{
  const css=read("app/ui-system.css");
  assert.match(css,/--ui-page-gap:24px/);
  assert.match(css,/--ui-card-padding:20px/);
  assert.match(css,/pilot-library-header/);
  assert.match(css,/pilot-command-panel/);
  assert.match(css,/training-continue-card/);
});

test("v3.2 U2 removes ad-hoc inline layout from persistent Training chrome",()=>{
  const shell=read("components/product-shell.tsx");
  const data=read("components/training-data-controls.tsx");
  assert.doesNotMatch(shell,/style=\{\{/);
  assert.doesNotMatch(data,/style=\{\{/);
  assert.match(data,/training-data-controls[.]module[.]css/);
});

test("v3.2 U2 gives sign-out and destructive Training controls visible busy states",()=>{
  const account=read("components/account-actions.tsx");
  const data=read("components/training-data-controls.tsx");
  assert.match(account,/signingOut/);
  assert.match(account,/aria-busy=\{signingOut\|\|undefined\}/);
  assert.match(account,/data-loading=\{signingOut\?"true":undefined\}/);
  assert.match(data,/data-loading=\{busy\?"true":undefined\}/);
  assert.match(data,/Working…/);
});

test("v3.2 U2 routes CSS modules through shared spacing tokens",()=>{
  for(const file of [
    "components/flight-deck.module.css",
    "components/aircraft-workspace-nav.module.css",
    "app/aircraft/[aircraftId]/learning.module.css",
  ]){
    const css=read(file);
    assert.match(css,/var\(--ui-(?:space|radius|card|section)/,file);
  }
});

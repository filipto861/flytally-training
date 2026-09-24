import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root=path.resolve(import.meta.dirname,"..");
const read=(file:string)=>fs.readFileSync(path.join(root,file),"utf8");

test("v3.0 U6 provides a keyboard skip target around the Training product shell",()=>{
  const shell=read("components/product-shell.tsx");
  assert.match(shell,/className="skip-link" href="#main-content"/);
  assert.match(shell,/id="main-content"/);
  assert.match(shell,/tabIndex=\{-1\}/);
});

test("v3.0 U6 hardens narrow and touch layouts without changing the four-area navigation",()=>{
  const css=read("app/v300-u6-acceptance.css");
  const nav=read("components/aircraft-workspace-nav.tsx");
  assert.match(css,/safe-area-inset-top/);
  assert.match(css,/safe-area-inset-bottom/);
  assert.match(css,/pointer:coarse/);
  assert.match(css,/min-height:44px/);
  assert.match(css,/font-size:16px/);
  assert.match(css,/overflow-x:clip/);
  for(const label of ["Home","Fly","Learn","Reference"])assert.ok(nav.includes(`label: "${label}"`));
});

test("v3.0 U6 supports reduced motion and forced colors",()=>{
  const css=read("app/v300-u6-acceptance.css");
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/forced-colors:active/);
  assert.match(css,/aria-current="page"/);
});

test("v3.0 U6 remains loaded after U5 while ROADMAP tracks only current implementation work",()=>{
  const layout=read("app/layout.tsx");
  const roadmap=read("ROADMAP.md");
  assert.ok(layout.indexOf('import "./v300-u6-acceptance.css"')>layout.indexOf('import "./v300-u5-training.css"'));
  assert.match(roadmap,/single authoritative product\/implementation roadmap/i);
  assert.match(roadmap,/P1\.1 — LEARN \/ EFB product mode split — MERGED/);
  assert.match(roadmap,/P1\.1 production follow-up — EFB top-bar Active Flight reconciliation.*IN PROGRESS.*PR #213/);
});

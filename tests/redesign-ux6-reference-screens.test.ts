import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("UX6.3 exposes the approved reference screen set",()=>{
  const doc=read("TECHNICAL_DOCUMENTATION.md");
  for(const route of [
    "/ux6-preview",
    "/ux6-preview/performance",
    "/ux6-preview/flight",
    "/ux6-preview/library",
    "/ux6-preview/systems",
  ]) assert.match(doc,new RegExp(route.replaceAll("/","\\/")));
});

test("UX6.3 Performance gives result output higher visual priority",()=>{
  const page=read("app/ux6-preview/performance/page.tsx");
  assert.match(page,/Takeoff performance/);
  assert.match(page,/RESULT/);
  assert.match(page,/94\.2/);
  assert.match(page,/121/);
  assert.match(page,/Sources, assumptions/);
});

test("UX6.3 Flight is lifecycle and dependency oriented",()=>{
  const page=read("app/ux6-preview/flight/page.tsx");
  assert.match(page,/ACTIVE FLIGHT/);
  assert.match(page,/LKPR/);
  assert.match(page,/LOWW/);
  assert.match(page,/Dependencies/);
  assert.match(page,/Performance/);
});

test("UX6.3 Systems unavailable stays explicit and fail closed",()=>{
  const page=read("app/ux6-preview/systems/page.tsx");
  assert.match(page,/No published Systems package/);
  assert.match(page,/Nothing is inferred or substituted/);
});

test("UX6.3 Library shares the UX6 visual system",()=>{
  const page=read("app/ux6-preview/library/page.tsx");
  const css=read("app/ux6-preview/ux6-preview.module.css");
  assert.match(page,/Your aircraft/);
  assert.match(page,/Learjet 35A/);
  assert.match(css,/\.libraryPreview/);
  assert.match(css,/--accent:#2f6bff/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root=path.resolve(import.meta.dirname,"..");
const read=(file:string)=>fs.readFileSync(path.join(root,file),"utf8");

const unsafe=[
  /\bFlyTally®/i,
  /\bFlyTally\b[^.\n]{0,80}\b(?:EASA|ÚCL|UCL|Czech CAA|LAA(?: ČR| CZ)?)\b[^.\n]{0,40}\b(?:approved|certified|endorsed|official|compliant)\b/i,
  /\bFlyTally\b[^.\n]{0,60}\b(?:approved|certified|endorsed|official|compliant)\b[^.\n]{0,60}\b(?:EASA|ÚCL|UCL|Czech CAA|LAA(?: ČR| CZ)?)\b/i,
  /\bFlyTally\b[^.\n]{0,80}\bregistered trademark\b/i,
  /\bFlyTally\b[^.\n]{0,80}\b(?:QES|qualified electronic signature|AES|advanced electronic signature)\b/i,
];

test("C5 Training links to the canonical FlyTally claims policy",()=>{
  const links=read("components/legal-links.tsx");
  assert.match(links,/\["Claims", "brand-claims"\]/);
  assert.match(links,/NEXT_PUBLIC_FLYTALLY_LEGAL_URL/);
});

test("C5 Training public product surfaces avoid unsupported high-risk claims",()=>{
  for(const file of [
    "app/layout.tsx",
    "app/page.tsx",
    "components/product-shell.tsx",
  ]){
    const content=read(file);
    for(const pattern of unsafe)assert.doesNotMatch(content,pattern,file);
  }
});

test("C5 Training keeps source-backed wording scoped rather than authority/manufacturer approved",()=>{
  const layout=read("app/layout.tsx");
  const docs=read("TECHNICAL_DOCUMENTATION.md");
  assert.match(layout,/Source-backed aircraft training/);
  assert.match(docs,/do not mean manufacturer, operator or aviation-authority approval/i);
  assert.match(docs,/must not market a technically published aircraft package as manufacturer-approved/i);
  assert.match(docs,/must not add a registered-trademark claim or the .* symbol/i);
});

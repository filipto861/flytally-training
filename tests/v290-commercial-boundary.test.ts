import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root=path.resolve(import.meta.dirname,"..");
const read=(file:string)=>fs.readFileSync(path.join(root,file),"utf8");

test("v2.9 Training keeps one canonical cross-product legal and launch boundary",()=>{
  const links=read("components/legal-links.tsx");
  const env=read(".env.example");
  const docs=read("TECHNICAL_DOCUMENTATION.md");

  assert.match(links,/NEXT_PUBLIC_FLYTALLY_LEGAL_URL/);
  assert.match(links,/https:\/\/fly-tally\.com\/legal/);
  assert.doesNotMatch(env,/FLYTALLY_LAUNCH_STAGE/);
  assert.match(docs,/canonical v2\.9 commercial-readiness contract lives in FlyTally Logbook/i);
  assert.match(docs,/must not claim EASA, ÚCL, LAA ČR, manufacturer or operator approval/i);
});

test("v2.9 Training separates technical publication from publication rights",()=>{
  const docs=read("TECHNICAL_DOCUMENTATION.md");
  assert.match(docs,/neither one proves copyright, NDA, licence or derivative-publication rights/i);
  assert.match(docs,/must therefore not be treated as commercially publishable/i);
  assert.match(docs,/QES is a reviewed strategy decision, not a presumed requirement/i);
  assert.match(docs,/must not be relabelled as advanced or qualified electronic signatures/i);
});

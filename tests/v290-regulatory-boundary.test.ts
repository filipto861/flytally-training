import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root=path.resolve(import.meta.dirname,"..");
const read=(file:string)=>fs.readFileSync(path.join(root,file),"utf8");

test("C4 Training keeps one canonical regulatory approval boundary",()=>{
  const docs=read("TECHNICAL_DOCUMENTATION.md");
  assert.match(docs,/canonical C4 assurance taxonomy and authority-validation state live in FlyTally Logbook/i);
  assert.match(docs,/must not claim EASA, ÚCL, LAA ČR, manufacturer or operator approval/i);
  assert.match(docs,/must not be relabelled as advanced or qualified electronic signatures/i);
});

test("C4 Training separates manufacturer review from authority acceptance",()=>{
  const docs=read("TECHNICAL_DOCUMENTATION.md");
  assert.match(docs,/manufacturer review of aircraft training content would not automatically make FlyTally an authority-approved training organisation or approved logbook/i);
  assert.match(docs,/external validation evidence remains pending/i);
});

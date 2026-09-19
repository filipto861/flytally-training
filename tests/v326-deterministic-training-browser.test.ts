import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root=path.resolve(import.meta.dirname,"..");
const read=(file:string)=>fs.readFileSync(path.join(root,file),"utf8");

test("v3.2 U7 browser fixture is CI-only and excluded from Vercel",()=>{
  const fixture=read("lib/browser-training-fixture.ts");
  assert.match(fixture,/FLYTALLY_TRAINING_BROWSER_FIXTURE===\"1\"/);
  assert.match(fixture,/process[.]env[.]CI===\"true\"/);
  assert.match(fixture,/process[.]env[.]VERCEL!==\"1\"/);
  assert.match(fixture,/Browser CI Aircraft/);
});

test("v3.2 U7 deterministic fixture carries checklist and performance modules",()=>{
  const fixture=read("lib/browser-training-fixture.ts");
  assert.match(fixture,/domain:\"checklists\"/);
  assert.match(fixture,/domain:\"performance\"/);
  assert.match(fixture,/kind:\"runway-distance-grid\"/);
  assert.match(fixture,/distance_50ft_m:500/);
});

test("v3.2 U7 browser workflow enables fixture and no longer skips aircraft detail",()=>{
  const workflow=read(".github/workflows/browser-smoke.yml");
  const smoke=read("e2e/public-shell.spec.mjs");
  assert.match(workflow,/FLYTALLY_TRAINING_BROWSER_FIXTURE: \"1\"/);
  assert.doesNotMatch(smoke,/Local browser CI has no published Training content/);
  assert.match(smoke,/Browser CI Aircraft/);
  assert.match(smoke,/Declarative operational performance/);
  assert.match(smoke,/500 m/);
});

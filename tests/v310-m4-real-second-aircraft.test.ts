import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("v3.1 M4 keeps real second-aircraft identity out of learner/core code",()=>{
  const core=[
    "lib/aircraft-catalog.ts",
    "lib/aircraft-applicability.ts",
    "lib/postgres-content-repository.ts",
    "lib/content-repository.ts",
    "lib/performance-calculator.ts",
    "lib/weight-balance-calculator.ts",
    "components/declarative-performance-workspace.tsx",
    "components/performance-calculator.tsx",
    "components/operational-performance.tsx",
  ].map(read).join("\n");
  assert.doesNotMatch(core,/bristell|ok-eui|sn809|rotax|kw-21|brm aero/i);
});

test("v3.1 M4 static aircraft catalogue remains empty",()=>{
  const catalog=read("lib/aircraft-catalog.ts");
  assert.match(catalog,/trainingAircraft:\s*readonly TrainingAircraft\[\]\s*=\s*\[\]/);
  assert.doesNotMatch(catalog,/BRISTELL|Learjet|Bristell|Rotax/i);
});

test("v3.1 M4 learner content discovery remains database and route parameter driven",()=>{
  const repository=read("lib/postgres-content-repository.ts");
  const contentRepository=read("lib/content-repository.ts");
  assert.match(repository,/listAircraft\(\)/);
  assert.match(repository,/listPublishedModuleDomains/);
  assert.match(repository,/getPublishedModule/);
  assert.doesNotMatch(repository,/bristell|sn809|rotax|kw-21/i);
  assert.doesNotMatch(contentRepository,/bristell|sn809|rotax|kw-21/i);
});

test("v3.1 M4 evidence document records the governed real-aircraft boundary",()=>{
  const evidence=read("V31_M4_REAL_SECOND_AIRCRAFT.md");
  assert.match(evidence,/M4 acceptance: PASS/);
  assert.match(evidence,/controlled source revisions: \*\*3\*\*/);
  assert.match(evidence,/exact registered source references: \*\*42\*\*/);
  assert.match(evidence,/effective published learner modules: \*\*8\*\*/);
  assert.match(evidence,/unresolved stale-source flags: \*\*0\*\*/);
});

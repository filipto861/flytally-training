import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root=path.resolve(import.meta.dirname,"..");
const read=(file:string)=>fs.readFileSync(path.join(root,file),"utf8");

test("v3.2 U8 Training browser reports exact overflow offenders",()=>{
  const smoke=read("e2e/public-shell.spec.mjs");
  assert.match(smoke,/const offenders=/);
  assert.match(smoke,/scrollWidth:document[.]documentElement[.]scrollWidth/);
  assert.match(smoke,/expect\(state[.]overflow,JSON[.]stringify\(state,null,2\)\)/);
});

test("v3.2 U8 Fly checklist state is verified across reload",()=>{
  const smoke=read("e2e/public-shell.spec.mjs");
  assert.match(smoke,/flytally:flight-checklist:v1:browser-ci-aircraft:Standard:/);
  assert.match(smoke,/completedIds[?][.]includes\("battery"\)/);
  assert.match(smoke,/await page[.]reload\(\)/);
  assert.match(smoke,/name:\/Battery\//);
});

test("v3.2 U8 performance inputs and result are verified across reload",()=>{
  const smoke=read("e2e/public-shell.spec.mjs");
  assert.match(smoke,/flytally:flight-performance:v2:browser-ci-aircraft:Standard/);
  assert.match(smoke,/Object[.]values\(/);
  assert.match(smoke,/toHaveValue\("1000"\)/);
  assert.match(smoke,/50 ft distance500 m/);
});

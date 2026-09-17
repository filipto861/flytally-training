import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root=new URL("../",import.meta.url);
const read=(path:string)=>fs.readFileSync(new URL(path,root),"utf8");

test("v2.8 Training Vercel policy disables automatic preview deployments",()=>{
  const config=JSON.parse(read("vercel.json")) as {git?:{deploymentEnabled?:Record<string,boolean>};ignoreCommand?:string};
  assert.equal(config.git?.deploymentEnabled?.["*"],false);
  assert.equal(config.git?.deploymentEnabled?.main,true);
  assert.equal(config.ignoreCommand,"node tooling/vercel-ignore-build.mjs");
});

test("v2.8 Training Vercel guard treats feature branches as GitHub-Actions-only",()=>{
  const guard=read("tooling/vercel-ignore-build.mjs");
  assert.match(guard,/Skipping Vercel preview build/);
  assert.match(guard,/Feature branches are validated by GitHub Actions/);
  assert.match(guard,/VERCEL_GIT_COMMIT_REF/);
  assert.match(guard,/PRODUCTION_BRANCH = "main"/);
});

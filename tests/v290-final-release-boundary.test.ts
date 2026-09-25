import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root=path.resolve(import.meta.dirname,"..");
const read=(file:string)=>fs.readFileSync(path.join(root,file),"utf8");

test("C6 Training consumes canonical release status without duplicate launch state",()=>{
  const links=read("components/legal-links.tsx");
  const env=read(".env.example");
  const docs=read("TECHNICAL_DOCUMENTATION.md");

  assert.match(links,/\["Release status", "release-status"\]/);
  assert.doesNotMatch(env,/FLYTALLY_LAUNCH_STAGE/);
  assert.doesNotMatch(env,/COMMERCIAL_FINAL_RELEASE_STATUS/);
  assert.match(docs,/canonical C6 commercial-release audit lives in FlyTally Logbook/i);
  assert.match(docs,/does not introduce a second launch flag/i);
});

test("C6 Training keeps operational readiness separate from commercial clearance",()=>{
  const docs=read("TECHNICAL_DOCUMENTATION.md");
  const readiness=read("app/api/readiness/route.ts");

  assert.match(docs,/must not interpret a healthy .*readiness.* response as commercial, legal, regulator, trademark or source-rights clearance/i);
  assert.match(docs,/current commercial launch remains blocked/i);
  assert.match(readiness,/profiles:/);
  assert.doesNotMatch(readiness,/commercialLaunch|commercialEnabled|FLYTALLY_LAUNCH_STAGE/);
});

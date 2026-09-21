import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const adminRepo=fs.readFileSync(new URL("../lib/content-admin-repository.ts",import.meta.url),"utf8");
const lifecycle=fs.readFileSync(new URL("../lib/content-governed-lifecycle.ts",import.meta.url),"utf8");
const manualRegistration=fs.readFileSync(new URL("../lib/governed-manual-registration.ts",import.meta.url),"utf8");
const bootstrap=fs.readFileSync(new URL("../lib/database-bootstrap.ts",import.meta.url),"utf8");
const progress=fs.readFileSync(new URL("../lib/progress-repository.ts",import.meta.url),"utf8");
const identity=fs.readFileSync(new URL("../lib/identity-replay.ts",import.meta.url),"utf8");
const learner=fs.readFileSync(new URL("../lib/postgres-content-repository.ts",import.meta.url),"utf8");
const activeFlight=fs.readFileSync(new URL("../lib/active-flight/store.ts",import.meta.url),"utf8");

function ddl(text:string):boolean{return /CREATE\s+(TABLE|INDEX)|ALTER\s+TABLE/i.test(text);}

test("ordinary content administration never invokes content schema provisioning",()=>{
  assert.equal((adminRepo.match(/await\s+ensureContentSchema\s*\(/g)??[]).length,0);
  assert.match(adminRepo,/export async function ensureContentSchema/);
  assert.ok(ddl(adminRepo));
});

test("governed authoring and source registration are DML-only at runtime",()=>{
  assert.doesNotMatch(lifecycle,/ensureContentSchema|CREATE\s+(TABLE|INDEX)|ALTER\s+TABLE/i);
  assert.doesNotMatch(manualRegistration,/ensureContentSchema|CREATE\s+(TABLE|INDEX)|ALTER\s+TABLE/i);
  assert.doesNotMatch(manualRegistration,/manual_assets|@vercel\/blob/i);
});

test("deployment bootstrap remains the explicit schema orchestration boundary",()=>{
  for(const fn of ["ensureContentSchema","ensureTrainingProgressSchema","ensureTrainingIdentitySchema","ensureTrainingAiDraftSchema","ensureTrainingActiveFlightSchema"])assert.match(bootstrap,new RegExp(`\\b${fn}\\s*\\(`));
  assert.doesNotMatch(bootstrap,/ensureManualAssetSchema|training_manual_assets/);
});

test("learner, progress and identity runtime repositories remain schema-DDL free",()=>{
  for(const source of [learner,progress,identity,activeFlight]){
    assert.equal(ddl(source),false);
    assert.doesNotMatch(source,/ensure(?:Content|TrainingProgress|TrainingIdentity|TrainingAiDraft|TrainingActiveFlight)Schema/);
  }
});

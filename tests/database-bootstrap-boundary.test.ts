import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const bootstrap = fs.readFileSync(new URL("../lib/database-bootstrap.ts", import.meta.url), "utf8");
const cli = fs.readFileSync(new URL("../tooling/init-training-database.ts", import.meta.url), "utf8");
const runner = fs.readFileSync(new URL("../tooling/run-no-code-aircraft-acceptance.mjs", import.meta.url), "utf8");
const acceptanceWorkflow = fs.readFileSync(new URL("../.github/workflows/no-code-aircraft-acceptance.yml", import.meta.url), "utf8");
const adminActions = fs.readFileSync(new URL("../app/admin/actions.ts", import.meta.url), "utf8");
const acceptance = fs.readFileSync(new URL("./no-code-postgres-acceptance.test.ts", import.meta.url), "utf8");
const packageJson = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {scripts:Record<string,string>;dependencies:Record<string,string>;devDependencies:Record<string,string>};

test("deployment bootstrap owns every active Training persistence boundary and verifies relations", () => {
  for (const fn of ["ensureContentSchema","ensureTrainingProgressSchema","ensureTrainingIdentitySchema","ensureTrainingAiDraftSchema","ensureTrainingActiveFlightSchema"]) assert.match(bootstrap,new RegExp(fn));
  for (const table of ["training_aircraft_types","training_progress_events","training_aircraft_state","training_identity_assertions","training_ai_draft_runs","training_active_flights"]) assert.match(bootstrap,new RegExp(table));
  assert.doesNotMatch(bootstrap,/ensureManualAssetSchema|training_manual_assets/);
  assert.match(bootstrap,/to_regclass/);
  assert.match(bootstrap,/verifyTrainingDatabaseSchema/);
  assert.doesNotMatch(bootstrap,/bootstrapStaticContent/);
});

test("first-deploy CLI requires an explicit Training database and preserves server-only semantics", () => {
  assert.match(cli, /TRAINING_DATABASE_URL is required/);
  assert.match(cli, /initializeTrainingDatabase/);
  assert.equal(packageJson.dependencies["server-only"], "0.0.1");
  assert.ok(packageJson.devDependencies.tsx);
  assert.match(packageJson.scripts["db:init"], /--conditions=react-server/);
  assert.match(packageJson.scripts["db:init"], /--import tsx/);
});

test("no-code PostgreSQL acceptance runs through the same bootstrap in a React Server Node process", () => {
  assert.match(runner, /--conditions=react-server/);
  assert.match(runner, /--import",\s*"tsx/);
  const bootstrapCall = acceptance.indexOf("await initializeTrainingDatabase()");
  const firstWrite = acceptance.indexOf("await createAircraft(");
  assert.ok(bootstrapCall >= 0 && firstWrite > bootstrapCall);
});

test("database-writing no-code acceptance requires an explicit disposable-target acknowledgement", () => {
  assert.match(runner, /TRAINING_ACCEPTANCE_CONFIRM_DISPOSABLE/);
  assert.match(runner, /I_UNDERSTAND_THIS_IS_DISPOSABLE/);
  assert.match(runner, /productionUrl\s*&&\s*productionUrl\s*===\s*acceptanceUrl/);
  assert.match(acceptanceWorkflow, /confirm_disposable:/);
  assert.match(acceptanceWorkflow, /type:\s*boolean/);
  assert.match(acceptanceWorkflow, /TRAINING_ACCEPTANCE_CONFIRM_DISPOSABLE:\s*I_UNDERSTAND_THIS_IS_DISPOSABLE/);
  assert.match(acceptanceWorkflow, /npm ci --no-audit --no-fund/);
});

test("authenticated admin initialization reuses deployment bootstrap", () => {
  assert.match(adminActions, /initializeTrainingDatabase/);
  assert.doesNotMatch(adminActions, /ensureTrainingProgressSchema|ensureManualAssetSchema|ensureTrainingIdentitySchema|ensureTrainingAiDraftSchema|ensureContentSchema/);
});

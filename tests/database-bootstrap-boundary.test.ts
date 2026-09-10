import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const bootstrap = fs.readFileSync(new URL("../lib/database-bootstrap.ts", import.meta.url), "utf8");
const cli = fs.readFileSync(new URL("../tooling/init-training-database.ts", import.meta.url), "utf8");
const runner = fs.readFileSync(new URL("../tooling/run-no-code-aircraft-acceptance.mjs", import.meta.url), "utf8");
const adminActions = fs.readFileSync(new URL("../app/admin/actions.ts", import.meta.url), "utf8");
const acceptance = fs.readFileSync(new URL("./no-code-postgres-acceptance.test.ts", import.meta.url), "utf8");
const packageJson = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts: Record<string,string>;
  dependencies: Record<string,string>;
  devDependencies: Record<string,string>;
};

test("deployment bootstrap owns every Training persistence boundary and verifies relations", () => {
  for (const fn of ["ensureContentSchema","ensureTrainingProgressSchema","ensureManualAssetSchema","ensureTrainingIdentitySchema","ensureTrainingAiDraftSchema"]) {
    assert.match(bootstrap, new RegExp(fn));
  }
  for (const table of ["training_aircraft_types","training_progress_events","training_aircraft_state","training_manual_assets","training_identity_assertions","training_ai_draft_runs"]) {
    assert.match(bootstrap, new RegExp(table));
  }
  assert.match(bootstrap, /to_regclass/);
  assert.match(bootstrap, /verifyTrainingDatabaseSchema/);
  assert.doesNotMatch(bootstrap, /bootstrapStaticContent/);
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
  assert.match(runner, /--import","tsx/);
  const bootstrapCall = acceptance.indexOf("await initializeTrainingDatabase()");
  const firstWrite = acceptance.indexOf("await createAircraft(");
  assert.ok(bootstrapCall >= 0 && firstWrite > bootstrapCall, "schema bootstrap must complete before the synthetic aircraft write");
});

test("authenticated admin initialization reuses the deployment bootstrap instead of duplicating schema orchestration", () => {
  assert.match(adminActions, /initializeTrainingDatabase/);
  assert.doesNotMatch(adminActions, /ensureTrainingProgressSchema|ensureManualAssetSchema|ensureTrainingIdentitySchema|ensureTrainingAiDraftSchema|ensureContentSchema/);
});

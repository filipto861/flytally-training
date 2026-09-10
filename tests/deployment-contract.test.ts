import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { engines?: { node?: string } };
const verify = fs.readFileSync(new URL("../.github/workflows/verify.yml", import.meta.url), "utf8");
const acceptance = fs.readFileSync(new URL("../.github/workflows/no-code-aircraft-acceptance.yml", import.meta.url), "utf8");
const envExample = fs.readFileSync(new URL("../.env.example", import.meta.url), "utf8");
const readme = fs.readFileSync(new URL("../README.md", import.meta.url), "utf8");
const deployment = fs.readFileSync(new URL("../DEPLOYMENT.md", import.meta.url), "utf8");

test("development, verification and deployment share the Node 24 runtime contract", () => {
  assert.equal(packageJson.engines?.node, "24.x");
  assert.match(verify, /node-version:\s*24/);
  assert.match(acceptance, /node-version:\s*24/);
  assert.match(readme, /targets Node\.js 24/);
});

test("repository setup uses the committed dependency graph", () => {
  assert.match(verify, /npm ci --no-audit --no-fund/);
  assert.match(acceptance, /npm ci --no-audit --no-fund/);
  assert.match(readme, /npm ci/);
  assert.doesNotMatch(readme, /npm install/);
});

test("documented destructive acceptance environment matches the runner safety contract", () => {
  assert.match(envExample, /TRAINING_ACCEPTANCE_CONFIRM_DISPOSABLE=/);
  assert.match(envExample, /I_UNDERSTAND_THIS_IS_DISPOSABLE/);
  assert.match(deployment, /TRAINING_ACCEPTANCE_DATABASE_URL/);
  assert.match(deployment, /disposable\/preview PostgreSQL database/);
});

test("deployment runbook captures both sides of the FlyTally identity contract and readiness gate", () => {
  assert.match(deployment, /TRAINING_APP_URL=https:\/\/training\.fly-tally\.com/);
  assert.match(deployment, /FLYTALLY_IDENTITY_SECRET/);
  assert.match(deployment, /TRAINING_CONTENT_BACKEND=postgres/);
  assert.match(deployment, /npm run db:init/);
  assert.match(deployment, /\/api\/readiness/);
  assert.match(deployment, /HTTP 200/);
});

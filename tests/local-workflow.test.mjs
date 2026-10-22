import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertLocalFixtureUrl, isLocalDockerEndpoint } from "../tooling/local-workflow.mjs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const isLogbook = pkg.name === "pilot-logbook-web";
const database = isLogbook ? "flytally_logbook_test" : "flytally_training_acceptance_test";
const port = isLogbook ? "55439" : "55440";
const fixture = "postgresql://flytally_local:testpassword@127.0.0.1:" + port + "/" + database;

test("reserved local PostgreSQL URL format is recognized but does not certify Training HTTP compatibility", () => {
  assert.equal(assertLocalFixtureUrl(fixture), true);
});

test("remote production, Docker-host aliases and the other FlyTally repo are rejected", () => {
  const wrongDatabase = isLogbook ? "flytally_training_acceptance_test" : "flytally_logbook_test";
  const invalid = [
    fixture.replace("127.0.0.1", "remote.neon.tech"),
    fixture.replace("127.0.0.1", "localhost"),
    fixture.replace("127.0.0.1", "host.docker.internal"),
    fixture.replace(database, wrongDatabase),
    fixture.replace(port, "5432"),
    fixture.replace("flytally_local", "postgres"),
    fixture.replace("testpassword@", "@"),
    fixture.replace("postgresql:", "https:"),
    fixture + "?sslmode=require",
    "not-a-url",
  ];
  for (const value of invalid) {
    assert.throws(() => assertLocalFixtureUrl(value), { message: /local disposable|Invalid URL/ });
  }
});

test("one-command scripts exist without replacing canonical product release gates", () => {
  for (const key of ["doctor", "setup:local", "setup:db", "test:quick", "test:full", "test:db:local", "test:browser:local"]) {
    assert.match(pkg.scripts[key], /tooling\/local-workflow\.mjs/);
  }
  assert.ok(pkg.scripts.verify);
  if (isLogbook) assert.ok(pkg.scripts["verify:release:risk"]);
  else assert.ok(pkg.scripts["test:no-code-aircraft"]);
});

test("Training database automation refuses plain PostgreSQL TCP before any Docker call", () => {
  const script = fileURLToPath(new URL("../tooling/local-workflow.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [script, "db"], { encoding: "utf8", timeout: 5000 });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Neon HTTP SQL/);
});

test("remote Docker contexts are not accepted as localhost-owned test fixtures", () => {
  assert.equal(isLocalDockerEndpoint("unix:///var/run/docker.sock"), true);
  assert.equal(isLocalDockerEndpoint("npipe:////./pipe/docker_engine"), true);
  assert.equal(isLocalDockerEndpoint("ssh://remote.example"), false);
  assert.equal(isLocalDockerEndpoint("tcp://10.0.0.20:2375"), false);
  assert.equal(isLocalDockerEndpoint("tcp://127.0.0.1:2375"), false);
});

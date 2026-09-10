import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const callback = fs.readFileSync(new URL("../app/api/auth/flytally/callback/route.ts", import.meta.url), "utf8");
const start = fs.readFileSync(new URL("../app/api/auth/flytally/start/route.ts", import.meta.url), "utf8");
const replay = fs.readFileSync(new URL("../lib/identity-replay.ts", import.meta.url), "utf8");
const schema = fs.readFileSync(new URL("../lib/identity-schema.ts", import.meta.url), "utf8");
const bootstrap = fs.readFileSync(new URL("../lib/database-bootstrap.ts", import.meta.url), "utf8");
const admin = fs.readFileSync(new URL("../app/admin/actions.ts", import.meta.url), "utf8");

test("FlyTally identity assertions are consumed once before a Training session cookie is issued", () => {
  assert.match(callback, /consumeFlyTallyIdentityAssertion\(claims\.jti, claims\.exp\)/);
  assert.match(callback, /identity_assertion_replayed/);
  assert.ok(
    callback.indexOf("consumeFlyTallyIdentityAssertion(claims.jti, claims.exp)") < callback.indexOf("response.cookies.set"),
  );
});

test("replay protection is DML-only at runtime and schema provisioning stays explicit", () => {
  assert.match(replay, /ON CONFLICT\(jti\) DO NOTHING/);
  assert.doesNotMatch(replay, /CREATE\s+TABLE|CREATE\s+INDEX/i);
  assert.doesNotMatch(callback, /CREATE\s+TABLE|CREATE\s+INDEX|ensureTrainingIdentitySchema/i);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS training_identity_assertions/);
  assert.match(bootstrap, /ensureTrainingIdentitySchema/);
  assert.match(admin, /initializeTrainingDatabase/);
});

test("both Training SSO entry and callback use strict local target parsing and suppress referrers", () => {
  assert.match(start, /safeLocalPath/);
  assert.match(callback, /safeLocalPath/);
  assert.doesNotMatch(start, /function localPath/);
  assert.doesNotMatch(callback, /function localPath/);
  assert.match(start, /referrer-policy/);
  assert.match(callback, /referrer-policy/);
  assert.match(start, /no-store/);
  assert.match(callback, /no-store/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  ADMIN_TRAINING_SESSION_SECONDS,
  USER_TRAINING_SESSION_SECONDS,
  isTrainingSessionLifetimeAllowed,
  trainingSessionSeconds,
} from "../lib/training-session-policy.ts";

const sessionSource = fs.readFileSync(new URL("../lib/training-session.ts", import.meta.url), "utf8");
const callbackSource = fs.readFileSync(new URL("../app/api/auth/flytally/callback/route.ts", import.meta.url), "utf8");

test("learner convenience and administrative privilege use different session lifetimes", () => {
  assert.equal(USER_TRAINING_SESSION_SECONDS, 7 * 24 * 60 * 60);
  assert.equal(ADMIN_TRAINING_SESSION_SECONDS, 12 * 60 * 60);
  assert.equal(trainingSessionSeconds("user"), USER_TRAINING_SESSION_SECONDS);
  assert.equal(trainingSessionSeconds("admin"), ADMIN_TRAINING_SESSION_SECONDS);
});

test("the reader lifetime policy rejects legacy seven-day admin cookies immediately", () => {
  const iat = 1_000_000;
  assert.equal(isTrainingSessionLifetimeAllowed("user", iat, iat + USER_TRAINING_SESSION_SECONDS), true);
  assert.equal(isTrainingSessionLifetimeAllowed("admin", iat, iat + ADMIN_TRAINING_SESSION_SECONDS), true);
  assert.equal(isTrainingSessionLifetimeAllowed("admin", iat, iat + ADMIN_TRAINING_SESSION_SECONDS + 1), false);
  assert.equal(isTrainingSessionLifetimeAllowed("admin", iat, iat + USER_TRAINING_SESSION_SECONDS), false);
  assert.equal(isTrainingSessionLifetimeAllowed("admin", iat, iat), false);
});

test("session issuance and cookie lifetime both use the role-specific policy", () => {
  assert.match(sessionSource, /const lifetime = trainingSessionSeconds\(role\)/);
  assert.match(sessionSource, /isTrainingSessionLifetimeAllowed\(claims\.role, claims\.iat!, claims\.exp!\)/);
  assert.match(callbackSource, /maxAge: trainingSessionSeconds\(claims\.role\)/);
  assert.doesNotMatch(callbackSource, /TRAINING_SESSION_SECONDS/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { isTrustedMutationRequest } from "../lib/request-security.ts";

const logoutRoute = readFileSync(new URL("../app/api/auth/logout/route.ts", import.meta.url), "utf8");

test("logout is a POST-only state-changing operation", () => {
  assert.match(logoutRoute, /export async function POST/);
  assert.doesNotMatch(logoutRoute, /export async function GET/);
});


test("state-changing requests reject cross-site or mismatched origins", () => {
  assert.equal(isTrustedMutationRequest(new Request("https://training.fly-tally.com/api/progress", {
    method:"POST",
    headers:{origin:"https://evil.example"},
  })), false);
  assert.equal(isTrustedMutationRequest(new Request("https://training.fly-tally.com/api/progress", {
    method:"POST",
    headers:{"sec-fetch-site":"cross-site"},
  })), false);
  assert.equal(isTrustedMutationRequest(new Request("https://training.fly-tally.com/api/progress", {
    method:"POST",
    headers:{origin:"https://training.fly-tally.com","sec-fetch-site":"same-origin"},
  })), true);
  assert.equal(isTrustedMutationRequest(new Request("https://training.fly-tally.com/api/progress", {
    method:"POST",
    headers:{"sec-fetch-site":"same-origin"},
  })), true);
  assert.equal(isTrustedMutationRequest(new Request("https://training.fly-tally.com/api/progress", {
    method:"POST",
  })), false);
  assert.equal(isTrustedMutationRequest(new Request("https://training.fly-tally.com/api/progress", {
    method:"POST",
    headers:{"sec-fetch-site":"same-site"},
  })), false);
});

test("progress and logout enforce the shared mutation-origin guard", () => {
  const progressRoute=readFileSync(new URL("../app/api/progress/route.ts",import.meta.url),"utf8");
  assert.match(progressRoute,/isTrustedMutationRequest\(request\)/);
  assert.match(logoutRoute,/isTrustedMutationRequest\(request\)/);
  assert.match(progressRoute,/cache-control.*private, no-store/);
  assert.match(logoutRoute,/cache-control.*private, no-store/);
  assert.match(progressRoute,/\^\[a-zA-Z0-9\]\[a-zA-Z0-9\._:-\]\*\$/);
});

test("global Training headers include a production CSP and cross-origin isolation guards", () => {
  const config=readFileSync(new URL("../next.config.ts",import.meta.url),"utf8");
  assert.match(config,/Content-Security-Policy/);
  assert.match(config,/default-src 'self'/);
  assert.match(config,/frame-ancestors 'none'/);
  assert.match(config,/object-src 'none'/);
  assert.match(config,/form-action 'self'/);
  assert.match(config,/Cross-Origin-Opener-Policy/);
  assert.match(config,/Cross-Origin-Resource-Policy/);
});

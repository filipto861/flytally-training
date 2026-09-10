import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const logoutRoute = readFileSync(new URL("../app/api/auth/logout/route.ts", import.meta.url), "utf8");

test("logout is a POST-only state-changing operation", () => {
  assert.match(logoutRoute, /export async function POST/);
  assert.doesNotMatch(logoutRoute, /export async function GET/);
});

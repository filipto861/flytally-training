import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const route = fs.readFileSync(new URL("../app/api/progress/route.ts", import.meta.url), "utf8");
const events = fs.readFileSync(new URL("../lib/progress-events.ts", import.meta.url), "utf8");

test("progress POST canonicalizes the whole batch against one server-time snapshot", () => {
  assert.match(route, /const nowMs = Date\.now\(\)/);
  assert.match(route, /events\.map\(event => normalizeServerProgressEvent\(event, nowMs\)\)/);
  assert.match(route, /normalized\.some\(event => event === null\)/);
  assert.doesNotMatch(route, /isServerAcceptableProgressEvent/);
});

test("timestamp integrity preserves offline history and clamps only excessive future skew", () => {
  assert.match(events, /MAX_PROGRESS_FUTURE_SKEW_MS/);
  assert.match(events, /parsed > nowMs \+ MAX_PROGRESS_FUTURE_SKEW_MS \? nowMs : parsed/);
  assert.match(events, /new Date\(canonicalMs\)\.toISOString\(\)/);
  assert.doesNotMatch(events, /nowMs\s*-\s*MAX_PROGRESS/);
});

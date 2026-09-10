import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const route = fs.readFileSync(new URL("../app/api/progress/route.ts", import.meta.url), "utf8");
const events = fs.readFileSync(new URL("../lib/progress-events.ts", import.meta.url), "utf8");

test("progress POST applies the server timestamp boundary to the whole batch", () => {
  assert.match(route, /const nowMs = Date\.now\(\)/);
  assert.match(route, /events\.every\(event => isServerAcceptableProgressEvent\(event, nowMs\)\)/);
  assert.doesNotMatch(route, /events\.every\(isPersistedTrainingProgressEvent\)/);
});

test("timestamp integrity preserves offline history and only bounds future skew", () => {
  assert.match(events, /MAX_PROGRESS_FUTURE_SKEW_MS/);
  assert.match(events, /Date\.parse\(value\.occurredAt\) <= nowMs \+ MAX_PROGRESS_FUTURE_SKEW_MS/);
  assert.doesNotMatch(events, /nowMs\s*-\s*MAX_PROGRESS/);
});

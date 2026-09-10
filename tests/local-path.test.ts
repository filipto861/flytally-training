import assert from "node:assert/strict";
import test from "node:test";

import { safeLocalPath } from "../lib/local-path.ts";

test("safeLocalPath preserves normalized same-origin Training targets", () => {
  assert.equal(safeLocalPath("/aircraft/test/progress-overview?tab=recent#top"), "/aircraft/test/progress-overview?tab=recent#top");
  assert.equal(safeLocalPath("  /quick-start  "), "/quick-start");
});

test("safeLocalPath rejects absolute, protocol-relative and backslash origin escapes", () => {
  for (const value of [
    "https://evil.example/",
    "//evil.example/",
    "///evil.example/",
    "/\\evil.example/",
    "not-a-path",
    "",
  ]) {
    assert.equal(safeLocalPath(value), "/", value);
  }
});

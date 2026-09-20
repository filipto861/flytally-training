import assert from "node:assert/strict";
import test from "node:test";

import {
  formatThousands,
  formatThousandsWithUnit,
} from "../lib/format/numbers.ts";

test("UX polish formats five-digit display values with thousands separators", () => {
  assert.equal(formatThousands(12189), "12,189");
});

test("UX polish leaves sub-thousand display values compact", () => {
  assert.equal(formatThousands(999), "999");
});

test("UX polish formats display values with their unit", () => {
  assert.equal(formatThousandsWithUnit(15000, "lb"), "15,000 lb");
});

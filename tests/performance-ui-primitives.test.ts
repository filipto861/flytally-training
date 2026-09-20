import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const source = fs.readFileSync(path.join(root, "components", "pilot-takeoff-calculator.tsx"), "utf8");

test("pilot calculator consumes the shared performance UI primitives", () => {
  assert.match(source, /from "\.\/performance-ui"/);
  for (const symbol of ["FieldRow", "InputWithUnit", "SourceBadge", "MetricCard", "MetricGrid"]) {
    assert.match(source, new RegExp(`<${symbol}\\b`));
  }
  assert.doesNotMatch(source, /function Metric\(/);
});

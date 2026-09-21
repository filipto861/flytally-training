import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../components/pilot-takeoff-calculator.tsx", import.meta.url), "utf8");

test("Round 3.7 takeoff inputs no longer render a duplicate read-only runway surface length box", () => {
  assert.doesNotMatch(source, /className=\{styles\.runwaySurface\}/);
  assert.doesNotMatch(source, /className=\{styles\.readOnlyControl\}/);
  assert.equal((source.match(/ariaLabel="Available takeoff length"/g) ?? []).length, 1);
});

test("Round 3.7 available takeoff length keeps runway surface provenance and reset behavior", () => {
  assert.match(source, /Source: runway surface length \{formatThousandsWithUnit\(runwayContext\.surfaceLengthFt, "ft"\)\}/);
  assert.match(source, /Reset to surface length/);
  assert.match(source, /setAvailableTakeoffLengthFt\(String\(runwayContext\.surfaceLengthFt\)\)/);
});

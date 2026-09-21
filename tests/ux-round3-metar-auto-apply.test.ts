import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("UX Round 3 METAR exposes fetched snapshots separately from manual apply", () => {
  const source = fs.readFileSync(new URL("../components/metar-status.tsx", import.meta.url), "utf8");
  assert.match(source, /onSnapshot\?: \(snapshot: MetarSnapshot\) => void/);
  assert.match(source, /onSnapshot\?\.\(view\.snapshot\)/);
});

test("UX Round 3 METAR manual action uses the concise Apply METAR label", () => {
  const source = fs.readFileSync(new URL("../components/metar-status.tsx", import.meta.url), "utf8");
  assert.match(source, />Apply METAR</);
  assert.match(source, />Apply cached METAR</);
  assert.doesNotMatch(source, /Apply to inputs/);
});

test("UX Round 3 takeoff tracks the last airport that received automatic METAR application", () => {
  const source = fs.readFileSync(new URL("../components/pilot-takeoff-calculator.tsx", import.meta.url), "utf8");
  assert.match(source, /lastAppliedIcao/);
  assert.match(source, /setLastAppliedIcao\(selectedIcao\)/);
});

test("UX Round 3 takeoff receives live or cached METAR snapshots without a button click", () => {
  const source = fs.readFileSync(new URL("../components/pilot-takeoff-calculator.tsx", import.meta.url), "utf8");
  assert.match(source, /onSnapshot=\{setInternalMetarSnapshot\}/);
});

test("UX Round 3 takeoff auto-applies a snapshot once for each selected airport", () => {
  const source = fs.readFileSync(new URL("../components/pilot-takeoff-calculator.tsx", import.meta.url), "utf8");
  assert.match(source, /lastAppliedIcao === selectedIcao/);
  assert.match(source, /handleMetarApply\(metarSnapshot\)/);
});

test("UX Round 3 airport changes reset the METAR auto-apply gate", () => {
  const source = fs.readFileSync(new URL("../components/pilot-takeoff-calculator.tsx", import.meta.url), "utf8");
  assert.match(source, /setLastAppliedIcao\(null\)/);
});

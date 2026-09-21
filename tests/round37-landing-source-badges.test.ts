import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../components/pilot-landing-calculator.tsx", import.meta.url), "utf8");

test("Round 3.7 landing PA and OAT badges follow shared METAR provenance in workspace mode", () => {
  assert.match(source, /pressureAltitudeBadgeSource = pressureAltitude\.dirty[\s\S]*?runwayContext && metarSnapshot\?\.qnhHpa !== undefined[\s\S]*?"metar"/);
  assert.match(source, /oatBadgeSource = oat\.dirty[\s\S]*?metarSnapshot\?\.temperatureC !== undefined[\s\S]*?"metar"/);
  assert.match(source, /source=\{pressureAltitudeBadgeSource\}/);
  assert.match(source, /source=\{oatBadgeSource\}/);
  assert.match(source, /setPressureAltitude\(\(current\) => metarAutoFill\(current, String\(calculated\)\)\)/);
  assert.match(source, /setOat\(\(current\) => metarAutoFill\(current, String\(metarSnapshot\.temperatureC\)\)\)/);
});

test("Round 3.7 manual landing PA and OAT edits change provenance back to MANUAL", () => {
  assert.match(source, /onChange=\{\(value\) => setPressureAltitude\(manualSourcedValue\(value\)\)\}/);
  assert.match(source, /onChange=\{\(value\) => setOat\(manualSourcedValue\(value\)\)\}/);
  assert.match(source, /pressureAltitude\.dirty\s*\? "manual"/);
  assert.match(source, /oat\.dirty\s*\? "manual"/);
});

test("Round 3.7 standalone landing inputs start with MANUAL provenance", () => {
  assert.match(source, /const \[pressureAltitude, setPressureAltitude\] = useState<SourcedValue<string>>\(\{[\s\S]*?source: "manual"/);
  assert.match(source, /const \[oat, setOat\] = useState<SourcedValue<string>>\(\{[\s\S]*?source: "manual"/);
  assert.match(source, /const runwayContext = externalEnvironment\?\.runwayContext/);
  assert.match(source, /const metarSnapshot = externalEnvironment\?\.metarSnapshot \?\? null/);
});

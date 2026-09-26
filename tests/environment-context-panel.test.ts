import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const panel = read("components/environment-context-panel.tsx");
const css = read("components/environment-context-panel.module.css");
const pilot = read("components/pilot-takeoff-calculator.tsx");

test("B9-C environment panel renders nothing without runway context, including METAR-only use", () => {
  assert.match(panel, /if \(!runwayContext\) return null/);
});

test("B9-C runway-only context exposes slope without requiring a METAR", () => {
  assert.match(panel, /const slope = \(/);
  assert.match(panel, /<h4>Slope<\/h4>/);
  assert.match(panel, /\{metarSnapshot \? \(/);
});

test("B9-C runway plus METAR context delegates wind and slope math to generic aviation utilities", () => {
  assert.match(panel, /calculateObservedRunwayWindComponents\(/);
  assert.match(panel, /calculateRunwaySlope\(/);
  assert.match(panel, /runwayHeadingTrueDeg: runwayContext\.headingTrueDeg/);
});

test("B9-C calm METAR is delegated to the shared observed-wind resolver", () => {
  assert.match(panel, /windSpeedKt: metarSnapshot\.windSpeedKt/);
  assert.match(panel, /windCalm: metarSnapshot\.windCalm/);
  assert.match(panel, /if \(snapshot\.windCalm\) return "Wind calm"/);
});

test("B9-C environment panel always carries the explicit baseline-distance warning when rendered", () => {
  assert.match(panel, /Distance values shown by this calculator are baseline \(zero wind, zero slope\)/);
  assert.match(panel, /Apply AFM wind and gradient corrections manually/);
});

test("B9-C gust data is displayed without changing baseline performance", () => {
  assert.match(panel, /gusting \$\{Math\.round\(snapshot\.windGustKt\)\} kt/);
  assert.match(panel, /wind\.gustHeadwindKt/);
  assert.match(panel, /wind\.gustCrosswindKt/);
  assert.doesNotMatch(panel, /calculatePilotTakeoffSummary|calculateMultiAxisMetricGrid|distance\s*[*+/=-]/i);
});

test("B9-C missing opposite-end elevation has an explicit runway-slope unavailable state", () => {
  assert.match(panel, /runwayContext\.oppositeEndElevationFt !== undefined/);
  assert.match(panel, /Runway slope unavailable — missing elevation data/);
});

test("B9-C missing runway heading or METAR wind has an explicit wind unavailable state", () => {
  assert.match(panel, /runwayContext\.headingTrueDeg !== undefined/);
  assert.match(panel, /snapshot\.windSpeedKt === undefined/);
  assert.match(panel, /Wind components unavailable — missing runway heading or METAR wind/);
  assert.match(panel, /variable direction cannot be resolved for this runway/);
});

test("B9-C environment panel exposes region semantics and labelled values", () => {
  assert.match(panel, /role="region"/);
  assert.match(panel, /aria-label="Wind and runway slope context"/);
  assert.match(panel, /<dt>Longitudinal component<\/dt>/);
  assert.match(panel, /<dt>Crosswind component<\/dt>/);
  assert.match(panel, /<dt>Runway gradient<\/dt>/);
});

test("B9-C environment panel is embedded between METAR status and the runway selector and stacks on mobile", () => {
  assert.match(pilot, /<MetarStatus[\s\S]*<EnvironmentContextPanel[\s\S]*<AirportRunwaySelector/);
  assert.match(pilot, /runwayContext=\{runwayContext\}/);
  assert.match(pilot, /metarSnapshot=\{metarSnapshot\}/);
  assert.match(css, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:620px\)[\s\S]*grid-template-columns:1fr/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { calculateRunwayMarginFt } from "../lib/aviation/runway-context.ts";

const source = fs.readFileSync(new URL("../components/pilot-landing-calculator.tsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../components/pilot-landing-calculator.module.css", import.meta.url), "utf8");

test("Round 3.7 landing calculator renders the runway margin strip when shared runway context is available", () => {
  assert.match(source, /runwayMargin && runwayContext && availableLengthFt !== undefined/);
  assert.match(source, /className=\{styles\.runwayMargin\}/);
  assert.match(source, /Required distance/);
  assert.match(source, /Available/);
  assert.match(source, /Margin/);
  assert.match(source, /Runway used/);
});

test("Round 3.7 landing margin uses factored landing distance against available runway length", () => {
  assert.match(source, /calculateRunwayMarginFt\(summary\.landingDistanceFt\.value, availableLengthFt\)/);
  const margin = calculateRunwayMarginFt(5106, 12189);
  assert.equal(margin.marginFt, 7083);
  assert.equal(Math.round(margin.usePercent), 42);
  assert.equal(margin.withinLength, true);
});

test("Round 3.7 landing margin remains hidden without external runway context", () => {
  assert.match(source, /const runwayContext = externalEnvironment\?\.runwayContext/);
  assert.match(source, /availableLengthFt = runwayContext\?\.availableTakeoffLengthFt \?\? runwayContext\?\.surfaceLengthFt/);
  assert.match(source, /runwayMargin && runwayContext && availableLengthFt !== undefined \? \(/);
});

test("Round 3.7 landing margin uses the same safe neutral caution critical thresholds as takeoff", () => {
  assert.match(source, /usePercent <= 50[\s\S]*?"safe"/);
  assert.match(source, /usePercent <= 70[\s\S]*?"neutral"/);
  assert.match(source, /usePercent <= 90[\s\S]*?"caution"[\s\S]*?"critical"/);
  for (const tone of ["safe", "neutral", "caution", "critical"]) {
    assert.match(css, new RegExp(`data-margin-tone="${tone}"`));
  }
});

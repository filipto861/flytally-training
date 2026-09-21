import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("UX Round 3 Environment section composes the existing context widgets", () => {
  const source = fs.readFileSync(new URL("../components/performance-environment-section.tsx", import.meta.url), "utf8");
  assert.match(source, /<MetarStatus/);
  assert.match(source, /<AirportRunwaySelector/);
  assert.match(source, /<EnvironmentContextPanel/);
});

test("UX Round 3 Environment section is stateless and lifts context to its parent", () => {
  const source = fs.readFileSync(new URL("../components/performance-environment-section.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /useState|useReducer/);
  assert.match(source, /onIcaoChange/);
  assert.match(source, /onRunwayContextChange/);
  assert.match(source, /onMetarApply/);
});

test("UX Round 3 Environment section forwards fetched METAR snapshots", () => {
  const source = fs.readFileSync(new URL("../components/performance-environment-section.tsx", import.meta.url), "utf8");
  assert.match(source, /onMetarSnapshot/);
  assert.match(source, /onSnapshot=\{onMetarSnapshot \?\? onMetarApply\}/);
});

test("UX Round 3 Environment section carries the baseline correction warning", () => {
  const source = fs.readFileSync(new URL("../components/performance-environment-section.tsx", import.meta.url), "utf8");
  assert.match(source, /Distances shown in the calculators are baseline values/);
  assert.match(source, /Wind and runway slope are context only/);
});

test("UX Round 3 Environment section stacks on narrow screens", () => {
  const css = fs.readFileSync(new URL("../components/performance-environment-section.module.css", import.meta.url), "utf8");
  assert.match(css, /@media\(max-width:620px\)/);
  assert.match(css, /\.topGrid\{\s*grid-template-columns:1fr/);
  assert.match(css, /@media\(max-width:620px\)/);
});

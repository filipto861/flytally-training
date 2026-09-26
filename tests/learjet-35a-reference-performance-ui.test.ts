import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("15.2c UI binds the separate Reference performance package only in Reference", () => {
  const route = read("app/aircraft/[aircraftId]/reference/page.tsx");

  assert.match(route, /getBundledReferencePerformancePackage/);
  assert.match(route, /filterPerformanceForConfiguration/);
  assert.match(route, /bundledReferencePerformance\.content/);
  assert.match(route, /referencePerformance=\{referencePerformance\}/);
});

test("15.2c UI resolves aircraft configuration before exposing Reference datasets", () => {
  const route = read("app/aircraft/[aircraftId]/reference/page.tsx");

  assert.match(route, /configurationForAircraftVariant\(aircraft, selectedVariant\)/);
  assert.match(
    route,
    /filterPerformanceForConfiguration\([\s\S]*bundledReferencePerformance\.content,[\s\S]*configuration/,
  );
});

test("15.2c Reference calculator delegates all calculation to the generic performance runtime", () => {
  const component = read("components/ft-reference/FtReferencePerformance.tsx");

  assert.match(component, /getPerformanceSelectionState/);
  assert.match(component, /performanceScalarKey/);
  assert.doesNotMatch(component, /learjet|35a|CL-102B|rosemount-pitot-static/i);
  assert.doesNotMatch(\n    component,\n    /dataset\\.rows|weightedRows|buildWeightedCorners|getAxisBracket|interpolatePerformanceRow/,\n  );
});

test("15.2c Reference calculator exposes exact interpolated and fail-closed states", () => {
  const component = read("components/ft-reference/FtReferencePerformance.tsx");

  assert.match(component, /SOURCE ROW/);
  assert.match(component, /INTERPOLATED/);
  assert.match(component, />Unavailable</);
  assert.match(component, /outside a complete published source region or crosses a blocked source boundary/);
  assert.match(component, /No extrapolation/);
});

test("15.2c Reference calculator keeps provenance and effectivity behind progressive disclosure", () => {
  const component = read("components/ft-reference/FtReferencePerformance.tsx");

  assert.match(component, /<details className=\{styles\.sourceDetails\}>/);
  assert.match(component, /Source, effectivity & boundaries/);
  assert.match(component, /dataset\.notes/);
  assert.match(component, /dataset\.sources/);
  assert.match(component, /content\.disclaimer/);
  assert.match(component, /REFERENCE ONLY/);
});

test("15.2c Reference workspace remains responsive and touch-first", () => {
  const css = read("components/ft-reference/reference-performance.module.css");

  assert.match(css, /min-height:\s*var\(--ft-touch-target-min\)/);
  assert.match(css, /@media \(max-width: 1180px\), \(hover: none\)/);
  assert.match(css, /@media \(max-width: 48rem\)/);
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\)/);
});

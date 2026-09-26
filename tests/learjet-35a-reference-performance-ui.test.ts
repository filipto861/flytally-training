import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("15.2d LEARN Reference binds the separate Reference package after configuration filtering", () => {
  const route = read("app/aircraft/[aircraftId]/reference/page.tsx");

  assert.match(route, /getBundledReferencePerformancePackage/);
  assert.match(route, /configurationForAircraftVariant\(aircraft, selectedVariant\)/);
  assert.match(route, /filterPerformanceForConfiguration/);
  assert.match(route, /referencePerformance=\{referencePerformance\}/);
});

test("15.2d LEARN Reference presents exact source tables instead of the input calculator", () => {
  const page = read("components/ft-reference/FtReferencePage.tsx");
  const table = read("components/ft-reference/FtReferencePerformanceTable.tsx");

  assert.match(page, /FtReferencePerformanceTable/);
  assert.doesNotMatch(page, /<FtReferencePerformance content=/);
  assert.match(table, /Published source tables/);
  assert.match(table, /Exact published values for study and reference/);
  assert.match(table, /dataset\.rows/);
  assert.match(table, /Unavailable/);
  assert.doesNotMatch(table, /getPerformanceSelectionState|interpolatedRow|INTERPOLATED/);
});

test("15.2d EFB REF receives the Reference package without moving it into PERF", () => {
  const shell = read("components/ft-shell/FtShell.tsx");
  const panel = read("components/ft-fast-path/FtFastPathPanel.tsx");
  const reference = read("components/ft-fast-path/FtFastPathReference.tsx");

  assert.match(shell, /getBundledReferencePerformancePackage/);
  assert.match(shell, /referencePerformance=\{bundledReferencePerformance\?\.content\}/);
  assert.match(panel, /performance=\{referencePerformance\}/);
  assert.match(reference, /FtReferencePerformance/);
  assert.match(reference, /filterPerformanceForConfiguration/);
  assert.doesNotMatch(
    read("app/aircraft/[aircraftId]/performance/page.tsx"),
    /getBundledReferencePerformancePackage/,
  );
});

test("15.2d EFB Reference calculator delegates all calculation to the generic performance runtime", () => {
  const component = read("components/ft-reference/FtReferencePerformance.tsx");

  assert.match(component, /getPerformanceSelectionState/);
  assert.match(component, /performanceScalarKey/);
  assert.doesNotMatch(component, /learjet|35a|CL-102B|rosemount-pitot-static/i);
  assert.doesNotMatch(
    component,
    /dataset\.rows|weightedRows|buildWeightedCorners|getAxisBracket|interpolatePerformanceRow/,
  );
});

test("15.2d EFB Reference calculator exposes exact interpolated and fail-closed states", () => {
  const component = read("components/ft-reference/FtReferencePerformance.tsx");

  assert.match(component, /EFB · REF/);
  assert.match(component, /Climb \/ cruise lookup/);
  assert.match(component, /SOURCE ROW/);
  assert.match(component, /INTERPOLATED/);
  assert.match(component, />Unavailable</);
  assert.match(component, /outside a complete published source region or crosses a blocked source boundary/);
  assert.match(component, /No extrapolation/);
});

test("15.2d Reference contexts keep provenance and boundaries explicit", () => {
  const calculator = read("components/ft-reference/FtReferencePerformance.tsx");
  const table = read("components/ft-reference/FtReferencePerformanceTable.tsx");

  for (const component of [calculator, table]) {
    assert.match(component, /Source, effectivity & boundaries/);
    assert.match(component, /dataset\.notes/);
    assert.match(component, /dataset\.sources/);
    assert.match(component, /content\.disclaimer/);
  }
});

test("15.2d LEARN table and EFB lookup remain responsive and touch-first", () => {
  const calculatorCss = read("components/ft-reference/reference-performance.module.css");
  const tableCss = read("components/ft-reference/reference-performance-table.module.css");

  assert.match(calculatorCss, /min-height:\s*var\(--ft-touch-target-min\)/);
  assert.match(calculatorCss, /@media \(max-width: 1180px\), \(hover: none\)/);
  assert.match(tableCss, /overflow:\s*auto/);
  assert.match(tableCss, /min-height:\s*var\(--ft-touch-target-min\)/);
  assert.match(tableCss, /@media \(max-width: 48rem\)/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("P1.4 makes Flight Brief the EFB landing surface without replacing the dedicated Performance page", () => {
  const page = read("components/ft-flight/FtFlightPage.tsx");
  const efbRoute = read("app/aircraft/[aircraftId]/efb/page.tsx");
  const performancePage = read("components/ft-performance/FtPerformancePage.tsx");

  assert.match(page, /data-efb-home="true"/);
  assert.match(page, />EFB</);
  assert.match(page, />Flight Brief</);
  assert.match(efbRoute, /export \{ default \} from "\.\.\/flight\/page"/);
  assert.match(performancePage, /FtPerformancePresentation/);
});

test("P1.4 Flight Brief owns one canonical Takeoff controller and shares it with the editor", () => {
  const brief = read("components/ft-flight/FtFlightBrief.tsx");
  const editor = read("components/ft-flight/FtPerformanceEditorSheet.tsx");
  const presentation = read("components/ft-performance/FtPerformancePresentation.tsx");

  assert.match(brief, /usePerformanceOperation\("TAKEOFF"/);
  assert.match(brief, /operation=\{operation\}/);
  assert.match(editor, /FtPerformanceOperationPresentation/);
  assert.match(editor, /operation=\{operation\}/);
  assert.match(presentation, /export function FtPerformanceOperationPresentation/);
  assert.match(presentation, /export function FtPerformancePresentation/);

  for (const source of [brief, editor]) {
    assert.doesNotMatch(
      source,
      /computePerformance|readTakeoffPerformanceState|writeTakeoffPerformanceResultV2/,
    );
  }
  assert.doesNotMatch(editor, /usePerformanceOperation/);
});

test("P1.4 Takeoff card exposes runway metrics validity and explicit editor actions", () => {
  const brief = read("components/ft-flight/FtFlightBrief.tsx");

  assert.match(brief, /aria-label="Takeoff performance brief"/);
  assert.match(brief, /RUNWAY NOT SET/);
  assert.match(brief, /NOT CALCULATED/);
  assert.match(brief, /RECALCULATE/);
  assert.match(brief, /CURRENT/);
  assert.match(brief, /FtPerformanceStrip/);
  assert.match(brief, /Calculate Takeoff/);
  assert.match(brief, /Edit Performance/);
  assert.match(brief, /Review & recalculate/);
  assert.match(brief, /Open full Performance/);
  assert.match(brief, /withVariantQuery\(\`\/aircraft\/\$\{aircraftId\}\/performance/);
});

test("P1.4 Performance editor is an accessible modal using the shared Performance presentation", () => {
  const editor = read("components/ft-flight/FtPerformanceEditorSheet.tsx");

  assert.match(editor, /role="dialog"/);
  assert.match(editor, /aria-modal="true"/);
  assert.match(editor, /aria-label="Takeoff performance editor"/);
  assert.match(editor, /event\.key !== "Escape"/);
  assert.match(editor, /event\.key !== "Tab"/);
  assert.match(editor, /focusableSelector/);
  assert.match(editor, /showInputs/);
  assert.match(editor, /view="brief"/);
});

test("P1.4 Performance editor is a desktop side drawer and touch full-height sheet", () => {
  const css = read("components/ft-flight/ft-flight.module.css");

  assert.match(
    css,
    /\.performanceEditorPanel\s*\{[\s\S]*height:\s*100dvh[\s\S]*border-inline-start:[\s\S]*slide-in/,
  );
  assert.match(
    css,
    /@media \(max-width: 1180px\), \(hover: none\)[\s\S]*\.performanceEditorPanel\s*\{[\s\S]*width:\s*100%[\s\S]*border-inline-start:\s*0[\s\S]*slide-up/,
  );
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation:\s*none/);
  assert.match(css, /\.performanceEditorClose\s*\{[\s\S]*var\(--ft-touch-target-min\)/);
});

test("P1.4 Flight Brief uses a complete two-column secondary layout instead of the old empty third column", () => {
  const css = read("components/ft-flight/ft-flight.module.css");

  assert.match(css, /\.brief\s*\{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(css, /\.brief\s*\{[\s\S]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
});

test("P1.4 does not introduce Landing runtime or Takeoff wind-correction math", () => {
  const brief = read("components/ft-flight/FtFlightBrief.tsx");
  const editor = read("components/ft-flight/FtPerformanceEditorSheet.tsx");

  assert.doesNotMatch(brief, /LANDING|VREF|landingDistance|correctTakeoffDistanceForWind|correctV1ForWind/);
  assert.doesNotMatch(editor, /LANDING|VREF|landingDistance|correctTakeoffDistanceForWind|correctV1ForWind/);
});

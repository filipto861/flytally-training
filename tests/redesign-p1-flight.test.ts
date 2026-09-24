import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test("P1 Flight workspace styling consumes frozen tokens without hardcoded colors or layout spacing", () => {
  const css = read("components/ft-flight/ft-flight.module.css");

  for (const token of [
    "--ft-bg-shell",
    "--ft-bg-inset",
    "--ft-bg-operational",
    "--ft-text-primary",
    "--ft-text-secondary",
    "--ft-text-metadata",
    "--ft-space-3",
    "--ft-space-4",
    "--ft-space-5",
    "--ft-space-6",
    "--ft-touch-target-min",
    "--ft-rule-default",
    "--ft-rule-strong",
  ]) {
    assert.match(css, new RegExp(`var\\(${token.replaceAll("-", "\\-")}\\)`));
  }

  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
  assert.doesNotMatch(css.replaceAll("1180px", ""), /\b\d+(?:\.\d+)?px\b/);
});

test("P1.1 Flight Brief keeps operational sections and removes Training Recommendations", () => {
  const page = read("components/ft-flight/FtFlightPage.tsx");
  const active = read("components/ft-flight/FtActiveFlight.tsx");
  const brief = read("components/ft-flight/FtFlightBrief.tsx");

  assert.match(page, /FtActiveFlight/);
  assert.match(page, /FtFlightBrief/);
  assert.match(active, />Active Flight</);
  assert.match(brief, />Performance</);
  assert.match(brief, /FtPerformancePresentation/);
  assert.match(brief, /view="brief"/);
  assert.match(brief, />Flight Considerations</);
  assert.match(brief, />Relevant Procedures</);
  assert.doesNotMatch(brief, />Training Recommendations</);
});

test("P1 delegates takeoff metrics to P2 instead of fabricating values in Flight Brief", () => {
  const brief = read("components/ft-flight/FtFlightBrief.tsx");
  const strip = read("components/ft-performance/FtPerformanceStrip.tsx");

  for (const label of ["N1", "V1", "VR", "V2", "Takeoff Distance"]) {
    assert.match(strip, new RegExp(`"${label}"`));
  }
  assert.doesNotMatch(
    brief,
    /\b(?:N1|V1|VR|V2)\b[^\n]{0,40}\b\d{2,3}(?:\.\d+)?\b/,
  );
  assert.doesNotMatch(strip, /\bVREF\b/i);
});

test("P1 keeps non-performance downstream slots empty while P2 owns Performance state", () => {
  const active = read("components/ft-flight/FtActiveFlight.tsx");
  const brief = read("components/ft-flight/FtFlightBrief.tsx");
  const recent = read("components/ft-flight/FtRecentFlights.tsx");

  assert.match(active, /data-empty=\{current \? "false" : "true"\}/);
  assert.match(active, /No active flight\./);
  assert.match(active, /Start new flight/);
  assert.equal((brief.match(/data-empty="true"/g) ?? []).length, 2);
  assert.match(brief, /data-flight-context=\{hasActiveFlight \? "active" : "none"\}/);
  assert.match(brief, /FtPerformancePresentation/);
  assert.match(recent, /data-empty="true"/);
  assert.match(recent, /No recent flights\./);
});

test("P1 preserves the existing operational /fly implementation unchanged as a separate entry", () => {
  const fly = read("app/aircraft/[aircraftId]/fly/page.tsx");
  const active = read("components/ft-flight/FtActiveFlight.tsx");

  assert.match(fly, /FlightDeck/);
  assert.match(fly, /active="fly"/);
  assert.match(active, /\/fly/);
  assert.doesNotMatch(fly, /FtFlightPage|FT_NEW_SHELL|@\/components\/ft-flight|@\/components\/ft-launch/);
});

test("P1 /flight route is feature-gated and P0 enters it without exposing it in flag-off production", () => {
  const route = read("app/aircraft/[aircraftId]/flight/page.tsx");
  const launch = read("components/ft-launch/FtFlightSection.tsx");

  assert.match(route, /if \(!isNewShellEnabled\(\)\)/);
  assert.match(route, /redirect\(withVariantQuery\(`\/aircraft\/\$\{aircraftId\}\/fly`/);
  assert.match(route, /FtFlightPage/);
  assert.match(launch, /\/flight/);
});

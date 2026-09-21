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

test("P1 Flight workspace exposes Active Flight and all frozen Flight Brief sections", () => {
  const page = read("components/ft-flight/FtFlightPage.tsx");
  const active = read("components/ft-flight/FtActiveFlight.tsx");
  const brief = read("components/ft-flight/FtFlightBrief.tsx");

  assert.match(page, /FtActiveFlight/);
  assert.match(page, /FtFlightBrief/);
  assert.match(active, />Active Flight</);
  assert.match(brief, />Performance</);
  assert.match(brief, />Flight Considerations</);
  assert.match(brief, />Training Recommendations</);
  assert.match(brief, />Relevant Procedures</);
});

test("P1 empty Flight Brief contains metric labels but no fabricated performance values", () => {
  const brief = read("components/ft-flight/FtFlightBrief.tsx");

  for (const label of ["N1", "V1", "VR", "V2"]) {
    assert.match(brief, new RegExp(`"${label}"`));
  }
  assert.doesNotMatch(
    brief,
    /\b(?:N1|V1|VR|V2)\b[^\n]{0,40}\b\d{2,3}(?:\.\d+)?\b/,
  );
  assert.doesNotMatch(brief, /\bKIAS\b|\bknots?\b|\bkt\b|\bRPM\b|%/i);
});

test("P1 Flight Brief and flight history are explicitly marked empty until D0 exists", () => {
  const active = read("components/ft-flight/FtActiveFlight.tsx");
  const brief = read("components/ft-flight/FtFlightBrief.tsx");
  const recent = read("components/ft-flight/FtRecentFlights.tsx");

  assert.match(active, /data-empty="true"/);
  assert.match(active, /No active flight\./);
  assert.equal((brief.match(/data-empty="true"/g) ?? []).length, 4);
  assert.match(brief, /No active flight/);
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

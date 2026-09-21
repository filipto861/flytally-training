import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { metarAutoFill, manualSourcedValue } from "../lib/aviation/runway-context.ts";
import {
  CLIENT_EXPIRED_MS,
  CLIENT_STALE_MS,
  classifyFreshness,
} from "../lib/weather/metar-cache.ts";
import { canApplyMetarFreshness } from "../lib/weather/metar-snapshot-helpers.ts";
import type { SourcedValue } from "../lib/aviation/airport-types.ts";

const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const component = read("components/metar-status.tsx");
const pilot = read("components/pilot-takeoff-calculator.tsx");
const fieldRow = read("components/performance-ui/field-row.tsx");
const sourceBadge = read("components/performance-ui/source-badge.tsx");
const selector = read("components/airport-runway-selector.tsx");
const css = read("components/metar-status.module.css");

test("B9-B METAR widget is hidden until a valid airport ICAO is selected", () => {
  assert.match(component, /if \(!icao\) return null/);
  assert.match(selector, /onAirportChange\?/);
  assert.match(pilot, /!usesExternalEnvironment \? \([\s\S]{0,300}<MetarStatus[\s\S]{0,120}icao=\{selectedIcao\}/);
});

test("B9-B METAR widget uses client cache before same-origin live fetch", () => {
  assert.match(component, /getClientCachedMetar\(icao\)/);
  assert.match(component, /classifyFreshness\(cached\.cachedAt\) === "live"/);
  assert.match(component, /fetch\(\`\/api\/weather\/metar\?icao=/);
  assert.doesNotMatch(component, /aviationweather\.gov/);
});

test("B9-B applying METAR requires an explicit button action", () => {
  assert.match(component, /onClick=\{\(\) => snapshot && onApply\(snapshot\)\}/);
  assert.match(component, /Apply METAR/);
  assert.doesNotMatch(component, /useEffect[\s\S]{0,300}onApply\(/);
});

test("B9-B stale and expired cache thresholds enforce explicit safe behavior", () => {
  const now = 100_000_000;
  const stale = classifyFreshness(now - CLIENT_STALE_MS, now);
  const expired = classifyFreshness(now - CLIENT_EXPIRED_MS, now);
  assert.equal(stale, "stale");
  assert.equal(canApplyMetarFreshness(stale), true);
  assert.equal(expired, "expired");
  assert.equal(canApplyMetarFreshness(expired), false);
  assert.match(component, /more than 12 hours old and cannot be applied/);
});

test("B9-B offline cache has explicit apply UX and manual fallback", () => {
  assert.match(component, /Using cached METAR/);
  assert.match(component, /Apply cached METAR/);
  assert.match(component, /Live weather unavailable\. Manual inputs remain available/);
});

test("B9-B manual edits block METAR autofill until explicit force override", () => {
  const manual = manualSourcedValue("18");
  assert.deepEqual(metarAutoFill(manual, "16"), manual);
  assert.deepEqual(metarAutoFill(manual, "16", true), {
    value: "16",
    source: "metar",
    dirty: false,
  });
  const clean: SourcedValue<string> = { value: "", source: "manual", dirty: false };
  assert.deepEqual(metarAutoFill(clean, "16"), { value: "16", source: "metar", dirty: false });
  assert.match(pilot, /Use METAR value/);
});

test("B9-B QNH and OAT expose source badges and manual edits become dirty", () => {
  assert.match(pilot, /label="QNH \/ Altimeter"[\s\S]{0,500}source=\{qnh\.source\}/);
  assert.match(pilot, /label=\{definition\.inputs\.oat\.label\}[\s\S]{0,300}source=\{oat\.source\}/);
  assert.match(fieldRow, /source \? <SourceBadge kind=\{source\} \/>/);
  assert.match(sourceBadge, /data-source=\{kind\}/);
  assert.match(pilot, /setQnh\(manualSourcedValue/);
  assert.match(pilot, /setOat\(manualSourcedValue/);
  assert.match(css, /data-freshness="live"/);
  assert.match(css, /data-freshness="stale"/);
  assert.match(css, /data-freshness="offline"/);
});

test("B9-B UI meets accessibility and touch-target requirements", () => {
  assert.match(component, /aria-label="METAR status"/);
  assert.match(component, /aria-live="polite"/);
  assert.match(css, /min-height:44px/);
  assert.match(css, /focus-visible/);
});

test("B9-B displays the expanded operational-use disclaimer without changing aircraft performance data", () => {
  assert.match(pilot, /Not approved for operational use/);
  assert.match(pilot, /Weather and airport data are provided for training\/simulation convenience/);
  assert.match(pilot, /NOTAMs and declared distances/);
  assert.doesNotMatch(read("lib/performance-calculator.ts"), /metar|aviationweather/i);
  assert.doesNotMatch(read("lib/performance-runtime.ts"), /metar|aviationweather/i);
});

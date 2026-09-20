import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const serviceWorker = read("app/sw.js/route.ts");
const bootstrap = read("components/offline-flight-bootstrap.tsx");
const pilot = read("components/pilot-takeoff-calculator.tsx");
const selector = read("components/airport-runway-selector.tsx");
const airportLib = [
  read("lib/aviation/airport-types.ts"),
  read("lib/aviation/airport-dataset.ts"),
  read("lib/aviation/runway-context.ts"),
  read("lib/aviation/pressure-altitude.ts"),
  read("lib/aviation/length-units.ts"),
].join("\n");

test("B9-A Fly support cache includes the airport manifest and dataset", () => {
  assert.match(serviceWorker, /FLIGHT_DATA_CACHE = "flytally-flight-data-v1"/);
  assert.match(serviceWorker, /\/data\/aviation\/airports\/manifest\.v1\.json/);
  assert.match(serviceWorker, /\/data\/aviation\/airports\/eu-na\.v1\.json/);
});

test("B9-A airport data is not promoted into the global PWA shell cache", () => {
  const shellLine = serviceWorker.match(/const SHELL_ASSETS = \[[^\n]+/s)?.[0] ?? "";
  assert.doesNotMatch(shellLine, /data\/aviation\/airports/);
});

test("B9-A airport support data is cached only through explicit Fly preparation", () => {
  const callCount = (serviceWorker.match(/await cacheFlightSupportAssets\(\)/g) ?? []).length;
  assert.equal(callCount, 1);
  assert.match(serviceWorker, /async function cacheFlightPage[\s\S]+await cacheFlightSupportAssets\(\);[\s\S]+return true;/);
  assert.match(bootstrap, /CACHE_FLIGHT_PAGE/);
});

test("B9-A support-asset cache is restricted to same-origin aviation data", () => {
  assert.match(serviceWorker, /url\.origin !== self\.location\.origin/);
  assert.match(serviceWorker, /url\.pathname\.startsWith\("\/data\/aviation\/"\)/);
});

test("B9-A support assets can be served from cache without caching Reference-route network fallbacks", () => {
  assert.match(serviceWorker, /if \(FLIGHT_SUPPORT_ASSETS\.includes\(url\.pathname\)\)[\s\S]+cache\.match\(url\.pathname\)[\s\S]+return fetch\(request\)/);
});

test("B9-A service worker still preserves the variant-safe Fly cache key", () => {
  assert.match(serviceWorker, /const variant = source\.searchParams\.get\("variant"\)/);
  assert.match(serviceWorker, /canonical\.searchParams\.set\("variant", variant\)/);
  assert.doesNotMatch(serviceWorker, /ignoreSearch: true/);
});

test("B9-A obsolete flytally cache versions are still removed on activation", () => {
  assert.match(serviceWorker, /\[FLIGHT_CACHE, STATIC_CACHE, SHELL_CACHE, FLIGHT_DATA_CACHE\]/);
  assert.match(serviceWorker, /names\.filter\(\(name\) => name\.startsWith\("flytally-"\)/);
});

test("B9-B service worker explicitly bypasses live weather requests", () => {
  assert.match(serviceWorker, /url\.pathname\.startsWith\("\/api\/weather\/"\)/);
  assert.doesNotMatch(serviceWorker.match(/const SHELL_ASSETS = \[[^\n]+/s)?.[0] ?? "", /api\/weather|metar/i);
  assert.doesNotMatch(serviceWorker.match(/const FLIGHT_SUPPORT_ASSETS = \[[\s\S]*?\];/)?.[0] ?? "", /api\/weather|metar/i);
  assert.doesNotMatch(serviceWorker, /aviationweather/i);
  assert.match(pilot, /MetarStatus/);
});

test("B9-A aviation runtime and selector remain aircraft-agnostic", () => {
  assert.doesNotMatch(airportLib, /learjet|bristell|cessna|boeing|rotax/i);
  assert.doesNotMatch(selector, /learjet|bristell|cessna|boeing|rotax/i);
});

test("B9-A Reference pilot calculator integrates airport context without changing the Fly deck", () => {
  assert.match(pilot, /AirportRunwaySelector/);
  assert.match(pilot, /QNH \/ Altimeter/);
  assert.match(pilot, /calculatePressureAltitudeFt/);
  assert.match(pilot, /airportAutoFill/);
  assert.match(pilot, /manualSourcedValue/);
  assert.match(pilot, /calculateRunwayMarginFt/);
  assert.match(pilot, /not declared TORA/);
  assert.doesNotMatch(read("components/flight-deck.tsx"), /AirportRunwaySelector/);
  assert.doesNotMatch(read("components/operational-performance.tsx"), /AirportRunwaySelector/);
});

test("B9-A manual pressure-altitude override has an explicit reset path", () => {
  assert.match(pilot, /current\.dirty \? current/);
  assert.match(pilot, /Manual override/);
  assert.match(pilot, /Reset/);
});

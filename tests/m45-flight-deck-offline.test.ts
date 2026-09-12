import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const nav=read("components/aircraft-workspace-nav.tsx");
const flyPage=read("app/aircraft/[aircraftId]/fly/page.tsx");
const deck=read("components/flight-deck.tsx");
const checklist=read("components/operational-checklist.tsx");
const performance=read("components/operational-performance.tsx");
const emergency=read("components/operational-emergency.tsx");
const offline=read("components/offline-flight-bootstrap.tsx");
const serviceWorker=read("app/sw.js/route.ts");
const manifest=read("app/manifest.ts");
const navCss=read("components/aircraft-workspace-nav.module.css");

test("Fly contains only operational checklist, performance and emergency quick reference",()=>{
  assert.match(nav,/label: "Fly"/);
  assert.match(nav,/label: "Learn"/);
  assert.match(flyPage,/active="fly"/);
  assert.match(deck,/"checklist" \| "performance" \| "emergency"/);
  assert.match(deck,/>Checklist<|"Checklist"/);
  assert.match(deck,/>Performance<|"Performance"/);
  assert.match(deck,/Emergency/);
  assert.doesNotMatch(deck,/systems|procedures|knowledge|avionics|limitations/i);
});

test("operational checklist removes training modes and explanatory commentary",()=>{
  assert.doesNotMatch(checklist,/checklistTrainingModes|Checklist mode|Procedure \/ explanation|sourceLabel|explanation|verification/);
  assert.match(checklist,/item\.challenge/);
  assert.match(checklist,/item\.response/);
  assert.match(checklist,/localStorage/);
  assert.match(checklist,/warning|caution/);
});

test("operational performance is a client-side calculator without reference drawers or training commentary",()=>{
  assert.match(performance,/calculateNativeDistanceGrid/);
  assert.match(performance,/calculateTakeoffDistance/);
  assert.match(performance,/calculateLandingDistance/);
  assert.match(performance,/localStorage/);
  assert.match(performance,/temperatureLimitedLanding/);
  assert.match(performance,/set\("landingOatC"/);
  assert.doesNotMatch(performance,/PerformanceExplorer|Calculation method|Reference data|Training aid/);
});

test("emergency quick reference renders source-backed response actions without training mechanics",()=>{
  assert.match(emergency,/stage\.expectedResponse/);
  assert.match(emergency,/stage\.notices/);
  assert.match(emergency,/Source &amp; authority/);
  assert.doesNotMatch(emergency,/scenario\.setup|scenario\.objectives|scenario\.debrief|stage\.prompt|stage\.explanation|scenario\.minutes|scenario\.difficulty/);
});

test("Fly route embeds source-backed aircraft data so all flight tools switch locally",()=>{
  assert.match(flyPage,/getPublishedAircraftModule<AircraftChecklistContent>/);
  assert.match(flyPage,/getPublishedAircraftModule<AircraftPerformanceContent>/);
  assert.match(flyPage,/getPublishedAircraftModule<unknown>\(repository, aircraftId, "abnormal"\)/);
  assert.match(flyPage,/filterChecklistForConfiguration/);
  assert.match(flyPage,/filterPerformanceForConfiguration/);
  assert.match(flyPage,/filterAbnormalEmergencyForConfiguration/);
  assert.doesNotMatch(deck,/fetch\(/);
});

test("flight deck establishes an offline PWA boundary limited to the Fly route",()=>{
  assert.match(offline,/serviceWorker\.register\("\/sw\.js"/);
  assert.match(offline,/CACHE_FLIGHT_PAGE/);
  assert.match(serviceWorker,/flytally-flight-v1/);
  assert.match(serviceWorker,/\/_next\/static/);
  assert.match(serviceWorker,/FLIGHT_PATH/);
  assert.match(serviceWorker,/ignoreSearch: true/);
  assert.match(manifest,/display: "standalone"/);
  assert.match(navCss,/safe-area-inset-bottom/);
});

test("Fly implementation stays aircraft-agnostic",()=>{
  assert.doesNotMatch(flyPage+deck+checklist+performance+emergency,/bristell|learjet|cessna|boeing|rotax/i);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const brand=read("app/flytally-brand.css");
const layout=read("app/layout.tsx");
const shell=read("components/product-shell.tsx");
const fly=read("app/aircraft/[aircraftId]/fly/page.tsx");
const deck=read("components/flight-deck.tsx");
const deckCss=read("components/flight-deck.module.css");
const emergency=read("components/operational-emergency.tsx");
const emergencyCss=read("components/operational-emergency.module.css");

test("M50 adopts the current FlyTally Logbook light design tokens",()=>{
  assert.match(brand,/--bg:#f4f7fb/);
  assert.match(brand,/--text:#102033/);
  assert.match(brand,/--muted:#66788d/);
  assert.match(brand,/--accent:#0b946e/);
  assert.match(brand,/--accent2:#087fb8/);
  assert.match(brand,/--line:#d5dee8/);
  assert.match(layout,/flytally-brand\.css/);
  assert.match(shell,/<small>Training<\/small>\s*<strong>FlyTally<\/strong>/);
});

test("Fly exposes emergency as a fast third operational tool",()=>{
  assert.match(deck,/type FlightView = "checklist" \| "performance" \| "emergency"/);
  assert.match(deck,/Emergency quick reference/);
  assert.match(deckCss,/data-tab-count="3"/);
  assert.match(deckCss,/danger-text/);
});

test("Fly only enables QRH presentation for validated universal abnormal content",()=>{
  assert.match(fly,/isUniversalAbnormalEmergencyContent/);
  assert.match(fly,/filterAbnormalEmergencyForConfiguration/);
  assert.match(fly,/normalizeUniversalAbnormalEmergency/);
  assert.doesNotMatch(fly,/normalizeLegacyAbnormalTraining/);
});

test("QRH presentation preserves published actions and removes training interaction",()=>{
  assert.match(emergency,/stage\.expectedResponse\.map/);
  assert.match(emergency,/notice\.text/);
  assert.match(emergency,/sourceLabel/);
  assert.match(emergency,/Current approved aircraft documents remain authoritative/);
  assert.doesNotMatch(emergency,/scenario\.setup|scenario\.objectives|scenario\.debrief|stage\.prompt|stage\.explanation|scenario\.minutes|scenario\.difficulty/);
  assert.doesNotMatch(emergency,/score|practice|quiz|check answer/i);
});

test("QRH remains touch-first and visually distinct without turning the whole Fly deck red",()=>{
  assert.match(emergencyCss,/min-height:52px/);
  assert.match(emergencyCss,/danger-bg/);
  assert.match(emergencyCss,/immediate/);
  assert.match(emergencyCss,/warning/);
  assert.match(emergencyCss,/caution/);
  assert.match(deckCss,/activeEmergencyTab/);
  assert.match(deckCss,/activeTab/);
});

test("M50 reusable flight components stay aircraft agnostic",()=>{
  assert.doesNotMatch(deck+emergency,/bristell|learjet|cessna|boeing|rotax/i);
});

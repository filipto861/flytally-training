import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const pilot = read("components/pilot-takeoff-calculator.tsx");
const pilotCss = read("components/pilot-takeoff-calculator.module.css");
const metarCss = read("components/metar-status.module.css");
const airportCss = read("components/airport-runway-selector.module.css");

test("UX polish preserves the 375px single-column calculator without horizontal-width traps", () => {
  assert.match(pilotCss, /@media\(max-width:620px\)[\s\S]*\.fields\{grid-template-columns:1fr\}/);
  assert.match(pilotCss, /\.runwayContext\{grid-template-columns:1fr\}/);
  assert.match(metarCss, /@media\(max-width:620px\)[\s\S]*\.weather\{grid-template-columns:1fr\}/);
  assert.match(airportCss, /@media\(max-width:620px\)[\s\S]*\.fields\{grid-template-columns:1fr\}/);
  assert.match(pilotCss, /min-width:0/);
  assert.match(metarCss, /min-width:0/);
  assert.match(airportCss, /min-width:0/);
});

test("UX polish keeps mobile calculator actions at the shared 44px touch-target boundary", () => {
  assert.match(pilotCss, /\.switch\{[\s\S]*min-height:var\(--ui-touch-min-height\)/);
  assert.match(pilotCss, /\.inlineButton,\.resetLengthButton\{\s*min-height:var\(--ui-touch-min-height\)/);
  assert.match(metarCss, /\.actions button\{[\s\S]*min-height:44px/);
  assert.match(pilot, />\s*Reset\s*</);
  assert.doesNotMatch(pilot, />\s*Use calculated\s*</);
});

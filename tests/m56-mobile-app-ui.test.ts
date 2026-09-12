import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const layout=read("app/layout.tsx");
const mobile=read("app/mobile-app.css");

test("M56 loads mobile app polish after the shared FlyTally brand layer",()=>{
  const brandIndex=layout.indexOf('import "./flytally-brand.css"');
  const mobileIndex=layout.indexOf('import "./mobile-app.css"');
  assert.ok(brandIndex >= 0);
  assert.ok(mobileIndex > brandIndex);
});

test("M56 uses device safe areas and a full-width native-style bottom tab bar",()=>{
  assert.match(mobile,/--mobile-app-header-height:56px/);
  assert.match(mobile,/env\(safe-area-inset-top\)/);
  assert.match(mobile,/env\(safe-area-inset-bottom\)/);
  assert.match(mobile,/nav\[aria-label="Pilot workspace"\]\{[\s\S]*right:0;[\s\S]*bottom:0;[\s\S]*left:0;/);
  assert.match(mobile,/border-radius:0;/);
});

test("M56 keeps the non-overlapping mobile sticky stack while allowing later screen-space refinement",()=>{
  assert.match(mobile,/nav\[aria-label="Flight tools"\][\s\S]*--mobile-app-header-height/);
  assert.match(mobile,/select\[aria-label="Checklist phase"\][\s\S]*--mobile-flight-tabs-height/);
  assert.match(mobile,/section\[aria-label="Emergency quick reference"\][\s\S]*--mobile-flight-tabs-height/);
  assert.match(mobile,/section\[aria-label="Operational performance"\][\s\S]*--mobile-bottom-nav-height/);
});

test("M56 removes website footer chrome inside the aircraft app without hiding it globally",()=>{
  assert.match(mobile,/body:has\(\.learner-pilot-nav\) \.app-footer\{display:none\}/);
  assert.doesNotMatch(mobile,/(^|\n)\s*\.app-footer\{display:none\}/);
});

test("M56 is presentation-only and does not introduce aircraft-specific styling",()=>{
  assert.doesNotMatch(mobile,/bristell|learjet|sn809|OK-EUI/i);
  assert.doesNotMatch(mobile,/takeoff-distance-grid|landing-distance-grid|rotax|kw-21/i);
});

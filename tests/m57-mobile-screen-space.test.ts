import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const mobile=read("app/mobile-app.css");
const deckCss=read("components/flight-deck.module.css");
const checklistCss=read("components/operational-checklist.module.css");
const performanceCss=read("components/operational-performance.module.css");
const emergency=read("components/operational-emergency.tsx");
const emergencyCss=read("components/operational-emergency.module.css");

test("M57 removes duplicate mobile Fly identity while retaining offline status",()=>{
  assert.match(deckCss,/@media\(max-width:900px\)[\s\S]*\.header>div\{display:none\}/);
  assert.match(deckCss,/\.header\{min-height:28px;[\s\S]*justify-content:flex-end/);
  assert.match(mobile,/\.flight-shell>\.learner-pilot-nav>div:first-child\{min-height:42px/);
  assert.match(mobile,/--mobile-flight-tabs-height:56px/);
});

test("M57 stops checklist phase navigation competing with the native bottom tab bar",()=>{
  assert.match(checklistCss,/@media\(max-width:700px\)[\s\S]*\.footer\{position:static;/);
  assert.doesNotMatch(mobile,/section\[aria-label\$="Checklist"\]>footer/);
});

test("M57 keeps an idle performance result as a compact strip",()=>{
  assert.match(performanceCss,/\.results:has\(\.status\)\{display:flex;align-items:center;min-height:48px/);
  assert.match(performanceCss,/@media\(max-width:760px\)[\s\S]*\.results h2\{display:none\}/);
  assert.match(performanceCss,/\.primary strong\{font-size:1\.72rem\}/);
});

test("M57 automatically collapses emergency quick access after the user scrolls into the procedure",()=>{
  assert.match(emergency,/useEffect\(\(\) => \{/);
  assert.match(emergency,/window\.scrollY > originY \+ 170/);
  assert.match(emergency,/setIndexCollapsed/);
  assert.match(emergency,/expandQuickAccess/);
  assert.match(emergency,/className=\{`\$\{styles\.index\}\$\{indexCollapsed/);
  assert.match(emergencyCss,/\.indexCollapsed \.indexExpanded\{display:none\}/);
  assert.match(emergencyCss,/\.indexCollapsed \.compactIndex\{display:flex;[\s\S]*min-height:46px/);
});

test("M57 remains presentation-only and aircraft agnostic",()=>{
  const source=[mobile,deckCss,checklistCss,performanceCss,emergency,emergencyCss].join("\n");
  assert.doesNotMatch(source,/bristell|learjet|sn809|OK-EUI/i);
  assert.doesNotMatch(source,/takeoff-distance-grid|landing-distance-grid|rotax|kw-21/i);
});

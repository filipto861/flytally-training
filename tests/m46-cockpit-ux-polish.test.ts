import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const checklist=read("components/operational-checklist.tsx");
const checklistCss=read("components/operational-checklist.module.css");
const deckCss=read("components/flight-deck.module.css");
const performanceCss=read("components/operational-performance.module.css");
const offlineCss=read("components/offline-flight-bootstrap.module.css");

test("M46 makes checklist progress glanceable without adding training commentary",()=>{
  assert.match(checklist,/Overall checklist progress/);
  assert.match(checklist,/role="progressbar"/);
  assert.match(checklist,/totalComplete/);
  assert.match(checklist,/overallPercent/);
  assert.doesNotMatch(checklist,/explanation|verification|sourceLabel|training boundary/i);
});

test("M46 identifies and advances from the next unchecked operational item",()=>{
  assert.match(checklist,/nextUncheckedId/);
  assert.match(checklist,/followingUnchecked/);
  assert.match(checklist,/scrollIntoView/);
  assert.match(checklist,/prefers-reduced-motion/);
  assert.match(checklistCss,/nextItem/);
});

test("phase reset now requires an explicit second action",()=>{
  assert.match(checklist,/resetArmed/);
  assert.match(checklist,/Confirm reset/);
  assert.match(checklist,/Confirm/);
  assert.match(checklistCss,/resetArmed/);
});

test("15.3d operational checklist consumes workspace theme roles in dark and light EFB",()=>{
  assert.match(checklistCss,/\.itemWrap[\\s\\S]*background:\s*var\(--ft-bg-panel/);
  assert.match(checklistCss,/\.item[\\s\\S]*color:\s*var\(--ft-text-primary/);
  assert.match(checklistCss,/\.phaseBar[\\s\\S]*background:\s*var\(--ft-bg-panel/);
  assert.match(checklistCss,/\.phasePicker select[\\s\\S]*background:\s*var\(--ft-bg-inset/);
  assert.match(checklistCss,/\.done \.item[\\s\\S]*background:\s*var\(--ft-state-completed-bg/);
  assert.match(checklistCss,/\.warning[\\s\\S]*var\(--ft-source-warning-bg/);
  assert.match(checklistCss,/\.caution[\\s\\S]*var\(--ft-source-caution-bg/);
});

test("cockpit controls keep large touch targets and visible keyboard focus",()=>{
  assert.match(deckCss,/focus-visible/);
  assert.match(checklistCss,/focus-visible/);
  assert.match(performanceCss,/focus-visible/);
  assert.match(checklistCss,/min-height:72px/);
  assert.match(performanceCss,/min-height:56px/);
});

test("offline preparation has a distinct but reduced-motion-safe state",()=>{
  assert.match(offlineCss,/data-offline-state="preparing"/);
  assert.match(offlineCss,/offlinePulse/);
  assert.match(offlineCss,/prefers-reduced-motion:reduce/);
});

test("M46 remains aircraft agnostic",()=>{
  assert.doesNotMatch(checklist+checklistCss+performanceCss,/bristell|learjet|cessna|boeing|rotax/i);
});

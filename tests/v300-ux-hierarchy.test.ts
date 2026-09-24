import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root=path.resolve(import.meta.dirname,"..");
const read=(file:string)=>fs.readFileSync(path.join(root,file),"utf8");

test("v3.0 U1 keeps aircraft selection ahead of optional PWA installation",()=>{
  const home=read("app/page.tsx");
  const aircraft=home.indexOf("className={styles.aircraftList}");
  const install=home.indexOf("<PwaInstallCard />");
  assert.ok(aircraft>=0);
  assert.ok(install>aircraft);
});

test("v3.0 preserves the focused Training task model instead of rebuilding navigation",()=>{
  const nav=read("components/aircraft-workspace-nav.tsx");
  for(const label of ["Home","Fly","Learn","Reference"])assert.ok(nav.includes(`label: "${label}"`));
  assert.doesNotMatch(nav,/multi-aircraft|billing|compliance/i);
});

test("current roadmap supersedes historical v3.0 sequencing with the LEARN/EFB architecture",()=>{
  const roadmap=read("ROADMAP.md");
  assert.match(roadmap,/single authoritative product\/implementation roadmap/i);
  assert.match(roadmap,/LEARN.*aircraft knowledge/i);
  assert.match(roadmap,/EFB.*operational flight tools/i);
  assert.match(roadmap,/P1\.1 — LEARN \/ EFB product mode split — MERGED/);
  assert.match(roadmap,/P1\.1 production follow-up — EFB top-bar Active Flight reconciliation.*IN PROGRESS.*PR #213/);
});


test("v3.0 U5 makes learner continuation discoverable without changing the four-area model",()=>{
  const home=read("components/legacy-aircraft-home.tsx");
  const training=read("app/aircraft/[aircraftId]/training/page.tsx");
  const continueCard=read("components/continue-learning-card.tsx");
  assert.match(home,/ContinueLearningCard/);
  assert.match(training,/START HERE/);
  assert.match(training,/Quick Start/);
  assert.match(training,/Cockpit orientation/);
  assert.match(training,/Checklist training/);
  assert.match(training,/View progress/);
  assert.match(continueCard,/loadTrainingProgress/);
  assert.match(continueCard,/Continue learning/);
  for(const label of ["Home","Fly","Learn","Reference"])assert.ok(read("components/aircraft-workspace-nav.tsx").includes(`label: "${label}"`));
});

test("current roadmap retains responsive acceptance as a global merge requirement",()=>{
  const roadmap=read("ROADMAP.md");
  assert.match(roadmap,/desktop\/iPad\/mobile acceptance required before merge/i);
});

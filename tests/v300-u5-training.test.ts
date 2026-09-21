import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root=path.resolve(import.meta.dirname,"..");
const read=(file:string)=>fs.readFileSync(path.join(root,file),"utf8");

test("U5 restores Quick Start and Cockpit orientation to the current Learn hierarchy",()=>{
  const training=read("app/aircraft/[aircraftId]/training/page.tsx");
  const quick=read("app/aircraft/[aircraftId]/quick-start/page.tsx");
  const orientation=read("app/aircraft/[aircraftId]/orientation/page.tsx");
  assert.match(training,/capabilities\.quickStart/);
  assert.match(training,/capabilities\.cockpitOrientation/);
  assert.match(training,/key: "quick-start"/);
  assert.match(training,/key: "orientation"/);
  assert.match(quick,/href\("training"\)/);
  assert.match(quick,/active="training"/);
  assert.match(orientation,/href\("training"\)/);
  assert.match(orientation,/active="training"/);
  assert.doesNotMatch(quick,/href=\{?["\x60\']?\/aircraft\/[^\n]*\/learn/);
  assert.doesNotMatch(orientation,/href=\{?["\x60\']?\/aircraft\/[^\n]*\/practice/);
});

test("U5 preserves selected variant through learner entry and legacy learning pages",()=>{
  const home=read("components/legacy-aircraft-home.tsx");
  const continueCard=read("components/continue-learning-card.tsx");
  const quick=read("app/aircraft/[aircraftId]/quick-start/page.tsx");
  const orientation=read("app/aircraft/[aircraftId]/orientation/page.tsx");
  assert.match(home,/selectedVariant=\{selectedVariant\}/);
  assert.match(continueCard,/withVariantQuery/);
  assert.match(quick,/resolveSelectedVariant/);
  assert.match(quick,/withVariantQuery/);
  assert.match(orientation,/resolveSelectedVariant/);
  assert.match(orientation,/withVariantQuery/);
});

test("U5 keeps progress secondary while making continuation primary",()=>{
  const home=read("components/legacy-aircraft-home.tsx");
  const training=read("app/aircraft/[aircraftId]/training/page.tsx");
  const progress=read("components/progress-panel.tsx");
  assert.match(home,/ContinueLearningCard/);
  assert.match(training,/training-progress-link/);
  assert.match(progress,/<details className=\{styles\.referenceGroup\}>/);
  assert.match(progress,/Progress sync · FlyTally account/);
});

test("U5 makes Reference faster and source metadata progressively disclosed",()=>{
  const reference=read("app/aircraft/[aircraftId]/reference/page.tsx");
  const quickRef=read("components/pilot-quick-reference.tsx");
  assert.match(reference,/QUICK ACCESS/);
  assert.match(reference,/Cockpit reference/);
  assert.match(reference,/Planning & limits/);
  assert.match(reference,/pilot-area-card-critical/);
  assert.match(quickRef,/sourceDetails/);
  assert.match(quickRef,/datasetSource/);
  assert.match(quickRef,/open=\{index === 0\}/);
});

test("U5 keeps Fly operational and aircraft agnostic",()=>{
  const fly=read("components/flight-deck.tsx");
  const home=read("components/legacy-aircraft-home.tsx");
  const training=read("app/aircraft/[aircraftId]/training/page.tsx");
  const continueCard=read("components/continue-learning-card.tsx");
  assert.match(fly,/Checklist/);
  assert.match(fly,/Performance/);
  assert.doesNotMatch(fly,/Systems|Knowledge|Procedures/);
  assert.doesNotMatch(home+training+continueCard,/learjet|bristell|cessna|boeing|rotax/i);
});

test("U5 ships responsive learner polish without changing mobile bottom navigation",()=>{
  const css=read("app/v300-u5-training.css");
  const navCss=read("components/aircraft-workspace-nav.module.css");
  const layout=read("app/layout.tsx");
  assert.match(layout,/v300-u5-training\.css/);
  assert.match(css,/training-continue-card/);
  assert.match(css,/training-hub-section/);
  assert.match(css,/@media\(max-width:620px\)/);
  assert.match(navCss,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
});

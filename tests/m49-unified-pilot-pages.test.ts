import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const knowledge=read("app/aircraft/[aircraftId]/knowledge/page.tsx");
const avionics=read("app/aircraft/[aircraftId]/avionics/page.tsx");
const flows=read("app/aircraft/[aircraftId]/flows/page.tsx");
const performance=read("app/aircraft/[aircraftId]/performance/page.tsx");
const limitations=read("app/aircraft/[aircraftId]/limitations/page.tsx");
const abnormal=read("app/aircraft/[aircraftId]/abnormal/page.tsx");
const quickReference=read("app/aircraft/[aircraftId]/quick-reference/page.tsx");
const weightBalance=read("app/aircraft/[aircraftId]/weight-balance/page.tsx");
const progress=read("app/aircraft/[aircraftId]/progress-overview/page.tsx");
const completion=read("components/learning-completion-button.tsx");

test("M49 gives every remaining Learn page the same short task hierarchy",()=>{
  assert.match(knowledge,/<p className="eyebrow">Learn<\/p>[\s\S]*<h1>Knowledge<\/h1>/);
  assert.match(avionics,/<p className="eyebrow">Learn<\/p>[\s\S]*<h1>Avionics<\/h1>/);
  assert.match(flows,/<p className="eyebrow">Learn<\/p>[\s\S]*<h1>Flows<\/h1>/);
  assert.doesNotMatch(knowledge,/eyebrow">Knowledge ·/);
  assert.doesNotMatch(avionics,/eyebrow">Avionics ·/);
  assert.doesNotMatch(flows,/eyebrow">Flows ·/);
});

test("M49 gives all reference tools short stable page titles",()=>{
  for(const [source,title] of [[performance,"Performance"],[limitations,"Limitations"],[abnormal,"Abnormal &amp; Emergency"],[quickReference,"Quick Reference"],[weightBalance,"Weight &amp; Balance"]] as const){
    assert.match(source,/<p className="eyebrow">Reference<\/p>/);
    assert.match(source,new RegExp(`<h1>${title}<\\/h1>`));
  }
  assert.match(progress,/<h1>Progress<\/h1>/);
});

test("source and authority copy is removed from the primary reading path",()=>{
  assert.match(knowledge,/details className="pilot-source-details"/);
  assert.match(avionics,/details className="pilot-source-details"/);
  assert.match(flows,/details className="pilot-source-details"/);
  assert.match(limitations,/details className="pilot-source-details"/);
  assert.match(abnormal,/details className="pilot-source-details"/);
});

test("completion actions are one compact control instead of an explanatory block",()=>{
  assert.match(completion,/aria-label=\{label\}/);
  assert.match(completion,/"Mark complete"/);
  assert.match(completion,/"Checking…"/);
  assert.doesNotMatch(completion,/When you have reviewed this material/);
  assert.doesNotMatch(completion,/Recorded in your aircraft progress/);
});

test("M49 remains aircraft agnostic",()=>{
  assert.doesNotMatch(knowledge+avionics+flows+performance+limitations+abnormal+quickReference+weightBalance+progress,/bristell|learjet|cessna|boeing|rotax/i);
});

import assert from "node:assert/strict";
import test from "node:test";
import { deriveAircraftOnboarding } from "../lib/admin-aircraft-onboarding.ts";
import type { AdminAircraftDetail,AdminContentVersion } from "../lib/content-admin-types.ts";

const version=(overrides:Partial<AdminContentVersion>={}):AdminContentVersion=>({
  id:"v1",
  domain:"checklists",
  contentKey:"bundle",
  versionNo:1,
  state:"published",
  origin:"human",
  createdBy:"admin",
  createdAt:"2026-09-11T00:00:00.000Z",
  ...overrides,
});

const aircraft=(overrides:Partial<AdminAircraftDetail>={}):AdminAircraftDetail=>({
  id:"test-aircraft",
  manufacturer:"Test",
  model:"One",
  displayName:"Test One",
  status:"draft",
  variants:[],
  manualRevisionCount:0,
  contentItemCount:0,
  staleCount:0,
  manuals:[],
  sourceReferences:[],
  contentVersions:[],
  ...overrides,
});

test("new aircraft starts at controlled sources without requiring variants",()=>{
  const onboarding=deriveAircraftOnboarding(aircraft());
  assert.equal(onboarding.phase,"sources");
  assert.equal(onboarding.nextAction,"Register the first controlled source revision.");
  assert.equal(onboarding.steps.find(step=>step.id==="profile")?.complete,true);
  assert.match(onboarding.steps.find(step=>step.id==="profile")?.detail??"",/variants are optional/);
  assert.equal(onboarding.modules.every(module=>module.state==="absent"),true);
});

test("sparse published aircraft can be ready with only one genuine learner domain",()=>{
  const onboarding=deriveAircraftOnboarding(aircraft({
    status:"published",
    manualRevisionCount:1,
    contentItemCount:1,
    manuals:[{manualId:"manual",revisionId:"manual-r1",title:"Manual",publisher:"OEM",revision:"1",issueDate:"2026-01-01",sourceKind:"AFM",authorityRole:"CONTROLLING"}],
    sourceReferences:[{id:"ref-1",revisionId:"manual-r1",chapter:"2",pageLabel:"2-1"}],
    contentVersions:[version()],
  }));
  assert.equal(onboarding.phase,"ready");
  assert.equal(onboarding.publishedModuleCount,1);
  assert.equal(onboarding.modules.find(module=>module.domain==="checklists")?.state,"published");
  assert.equal(onboarding.modules.find(module=>module.domain==="systems")?.state,"absent");
  assert.equal(onboarding.completionPercent,100);
});

test("a newer draft is visible even while an older module remains published",()=>{
  const onboarding=deriveAircraftOnboarding(aircraft({
    manuals:[{manualId:"manual",revisionId:"manual-r1",title:"Manual",publisher:"OEM",revision:"1",issueDate:"2026-01-01",sourceKind:"AFM",authorityRole:"CONTROLLING"}],
    sourceReferences:[{id:"ref-1",revisionId:"manual-r1",pageLabel:"1"}],
    contentVersions:[
      version(),
      version({id:"v2",versionNo:2,state:"draft",createdAt:"2026-09-12T00:00:00.000Z"}),
    ],
  }));
  assert.equal(onboarding.modules.find(module=>module.domain==="checklists")?.state,"draft");
  assert.equal(onboarding.phase,"review");
});

test("stale content moves an otherwise released aircraft into maintenance",()=>{
  const onboarding=deriveAircraftOnboarding(aircraft({
    status:"published",
    staleCount:1,
    manuals:[{manualId:"manual",revisionId:"manual-r2",title:"Manual",publisher:"OEM",revision:"2",issueDate:"2026-09-01",sourceKind:"AFM",authorityRole:"CONTROLLING"}],
    sourceReferences:[{id:"ref-2",revisionId:"manual-r2",pageLabel:"1"}],
    contentVersions:[version({state:"stale"})],
  }));
  assert.equal(onboarding.phase,"maintenance");
  assert.equal(onboarding.modules.find(module=>module.domain==="checklists")?.state,"stale");
  assert.equal(onboarding.steps.find(step=>step.id==="freshness")?.attention,true);
});

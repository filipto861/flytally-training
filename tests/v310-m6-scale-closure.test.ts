import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { deriveAircraftOnboarding } from "../lib/admin-aircraft-onboarding.ts";
import { deriveAircraftPackageReadiness } from "../lib/aircraft-package-readiness-model.ts";
import type { TrainingAircraft } from "../lib/aircraft-catalog.ts";
import { getAircraftContentBundle } from "../lib/content-repository.ts";
import { createStructuredStarterPayload } from "../lib/content-authoring-templates.ts";
import { validateContentPayload } from "../lib/content-contracts.ts";
import type { AdminAircraftDetail } from "../lib/content-admin-types.ts";
import { StaticTrainingContentRepository } from "../lib/static-content-repository.ts";
import type { AircraftSystemsContent } from "../lib/universal-aircraft-content.ts";

const aircraftId="scale-aircraft-three";
const source={manualId:"third-aircraft-poh",chapter:"7",section:"Electrical",pageLabel:"7-1"} as const;

const thirdAircraft:TrainingAircraft={
  id:aircraftId,
  manufacturer:"Generic",
  model:"Sparse Three",
  displayName:"Sparse Aircraft Three",
  variants:[],
  variantProfiles:[],
  manuals:[],
};

function thirdSystemsPayload():AircraftSystemsContent{
  const starter=createStructuredStarterPayload(aircraftId,"systems");
  assert.equal(starter.aircraftId,aircraftId);
  return {
    aircraftId,
    title:"Essential systems",
    systems:[{
      id:"electrical",
      title:"Electrical",
      summary:"A source-backed single-system module used to prove sparse aircraft scale.",
      applicability:{},
      sources:[source],
    }],
  };
}

test("v3.1 M6 third aircraft can be authored from the existing Studio starter and contract",()=>{
  const payload=thirdSystemsPayload();
  assert.deepEqual(validateContentPayload("systems",payload,aircraftId),[]);
});

test("v3.1 M6 one genuine module is a valid sparse learner package",async()=>{
  const payload=thirdSystemsPayload();
  const repository=new StaticTrainingContentRepository({
    aircraft:[thirdAircraft],
    nativeModules:[{aircraftId,domain:"systems",payload}],
    learningContent:[],
    normalFlights:[],
    cockpitOrientations:[],
    abnormalTrainings:[],
    referenceKnowledge:[],
  });

  const bundle=await getAircraftContentBundle(repository,aircraftId);
  assert.ok(bundle);
  assert.deepEqual(bundle.publishedModuleDomains,["systems"]);
  assert.equal(bundle.capabilities.systems,true);
  assert.equal(bundle.capabilities.checklists,false);
  assert.equal(bundle.capabilities.performance,false);
  assert.equal(bundle.capabilities.weightBalance,false);
  assert.equal(bundle.capabilities.limitations,false);
  assert.equal(bundle.capabilities.abnormalEmergency,false);
  assert.equal(bundle.capabilities.flows,false);
  assert.equal(bundle.capabilities.avionics,false);
  assert.equal(bundle.capabilities.knowledge,false);
  assert.equal(bundle.capabilities.quickStart,false);
  assert.equal(bundle.capabilities.cockpitOrientation,false);

  const hasTraining=bundle.capabilities.quickStart||bundle.capabilities.cockpitOrientation||bundle.capabilities.checklists||bundle.capabilities.systems||bundle.capabilities.procedures||bundle.capabilities.knowledge||bundle.capabilities.avionics||bundle.capabilities.flows;
  const hasFly=bundle.capabilities.checklists||bundle.capabilities.performance;
  const hasReference=bundle.capabilities.performance||bundle.capabilities.weightBalance||bundle.capabilities.limitations||bundle.capabilities.abnormalEmergency;
  assert.equal(hasTraining,true);
  assert.equal(hasFly,false);
  assert.equal(hasReference,false);
});

test("v3.1 M6 Studio onboarding considers a source-backed one-module aircraft complete",()=>{
  const detail:AdminAircraftDetail={
    id:aircraftId,
    manufacturer:"Generic",
    model:"Sparse Three",
    displayName:"Sparse Aircraft Three",
    status:"published",
    variants:[],
    variantProfiles:[],
    manualRevisionCount:1,
    contentItemCount:1,
    staleCount:0,
    manuals:[{
      manualId:"third-aircraft-poh",
      revisionId:"third-aircraft-poh-r1",
      title:"Aircraft POH",
      publisher:"Generic OEM",
      revision:"1",
      issueDate:"2026-01-01",
      sourceKind:"POH",
      authorityRole:"CONTROLLING",
    }],
    sourceReferences:[{
      id:"third-ref-1",
      revisionId:"third-aircraft-poh-r1",
      chapter:"7",
      section:"Electrical",
      pageLabel:"7-1",
    }],
    contentVersions:[{
      id:"systems-v1",
      domain:"systems",
      contentKey:"bundle",
      versionNo:1,
      state:"published",
      origin:"human",
      createdBy:"admin",
      createdAt:"2026-09-18T00:00:00.000Z",
      approvedBy:"reviewer",
      publishedAt:"2026-09-18T00:10:00.000Z",
    }],
  };

  const onboarding=deriveAircraftOnboarding(detail);
  assert.equal(onboarding.phase,"ready");
  assert.equal(onboarding.completionPercent,100);
  assert.equal(onboarding.publishedModuleCount,1);
  assert.equal(onboarding.modules.find(module=>module.domain==="systems")?.state,"published");
  assert.equal(onboarding.modules.filter(module=>module.state!=="absent").length,1);
});

test("v3.1 M6 one-module package satisfies the shared release-readiness model",()=>{
  const readiness=deriveAircraftPackageReadiness({
    sourceRevisionCount:1,
    sourceReferenceCount:1,
    publishedModuleCount:1,
    pendingVersionCount:0,
    publishedContractsValid:true,
    applicabilityCurrent:true,
    sourceProvenanceComplete:true,
    fresh:true,
  });
  assert.equal(readiness.ready,true);
  assert.equal(readiness.completionPercent,100);
  assert.deepEqual(readiness.blockers,[]);
});

test("v3.1 M6 scale proof does not add a third-aircraft runtime registration",()=>{
  const files=[
    "../lib/aircraft-catalog.ts",
    "../lib/content-repository.ts",
    "../lib/postgres-content-repository.ts",
    "../lib/aircraft-applicability.ts",
    "../app/aircraft/[aircraftId]/page.tsx",
    "../app/aircraft/[aircraftId]/training/page.tsx",
    "../app/aircraft/[aircraftId]/fly/page.tsx",
    "../app/aircraft/[aircraftId]/reference/page.tsx",
  ];
  const runtime=files.map(path=>fs.readFileSync(new URL(path,import.meta.url),"utf8")).join("\n");
  assert.doesNotMatch(runtime,/scale-aircraft-three|Sparse Aircraft Three|Generic Sparse Three/i);
  const catalog=fs.readFileSync(new URL("../lib/aircraft-catalog.ts",import.meta.url),"utf8");
  assert.match(catalog,/trainingAircraft:\s*readonly TrainingAircraft\[\]\s*=\s*\[\]/);
});

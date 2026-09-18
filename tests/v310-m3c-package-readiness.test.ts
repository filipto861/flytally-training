import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { deriveAircraftPackageReadiness } from "../lib/aircraft-package-readiness-model.ts";
import { createStructuredStarterPayload, type StructuredAuthoringDomain } from "../lib/content-authoring-templates.ts";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

function applicabilityBlocks(value:unknown):Record<string,unknown>[] {
  const result:Record<string,unknown>[]=[];
  const visit=(candidate:unknown)=>{
    if(Array.isArray(candidate)){candidate.forEach(visit);return;}
    if(!candidate||typeof candidate!=="object")return;
    const record=candidate as Record<string,unknown>;
    if(record.applicability&&typeof record.applicability==="object"&&!Array.isArray(record.applicability))result.push(record.applicability as Record<string,unknown>);
    Object.values(record).forEach(visit);
  };
  visit(value);
  return result;
}

test("v3.1 M3C ready package passes every shared release check",()=>{
  const readiness=deriveAircraftPackageReadiness({
    sourceRevisionCount:1,
    sourceReferenceCount:3,
    publishedModuleCount:2,
    pendingVersionCount:0,
    publishedContractsValid:true,
    applicabilityCurrent:true,
    sourceProvenanceComplete:true,
    fresh:true,
  });
  assert.equal(readiness.ready,true);
  assert.equal(readiness.completionPercent,100);
  assert.deepEqual(readiness.blockers,[]);
  assert.equal(readiness.nextAction,"Package is ready for catalogue release.");
});

test("v3.1 M3C configuration drift blocks catalogue release after module publication",()=>{
  const readiness=deriveAircraftPackageReadiness({
    sourceRevisionCount:1,
    sourceReferenceCount:1,
    publishedModuleCount:1,
    pendingVersionCount:1,
    publishedContractsValid:true,
    applicabilityCurrent:false,
    sourceProvenanceComplete:true,
    fresh:true,
  });
  assert.equal(readiness.ready,false);
  assert.deepEqual(readiness.blockers.map(blocker=>blocker.id),["applicability"]);
  assert.equal(readiness.warnings.length,1);
});

test("v3.1 M3C pre-publication checks wait behind the first learner module instead of pretending to pass",()=>{
  const readiness=deriveAircraftPackageReadiness({
    sourceRevisionCount:1,
    sourceReferenceCount:1,
    publishedModuleCount:0,
    pendingVersionCount:1,
    publishedContractsValid:false,
    applicabilityCurrent:false,
    sourceProvenanceComplete:false,
    fresh:false,
  });
  assert.equal(readiness.ready,false);
  assert.deepEqual(readiness.blockers.map(blocker=>blocker.id),["published-content"]);
  assert.ok(readiness.checks.filter(check=>["content-contracts","applicability","source-provenance","freshness"].includes(check.id)).every(check=>check.status==="waiting"));
});

test("v3.1 M3C common-content starters do not serialize invalid empty applicability restrictions",()=>{
  const scoped:StructuredAuthoringDomain[]=["checklists","procedures","performance","weight-balance","limitations","systems","flows","avionics","knowledge","abnormal"];
  for(const domain of scoped){
    const payload=createStructuredStarterPayload("generic-aircraft",domain);
    const blocks=applicabilityBlocks(payload);
    assert.ok(blocks.length>0,domain);
    for(const block of blocks){
      for(const key of ["variants","equipmentAllOf","equipmentAnyOf","equipmentNoneOf"]){
        assert.equal(block[key],undefined,`${domain} must omit empty ${key}`);
      }
    }
  }
});

test("v3.1 M3C catalogue publication and Studio consume the same package readiness boundary",()=>{
  const server=read("lib/aircraft-package-readiness.ts");
  const publication=read("lib/aircraft-publication.ts");
  const onboarding=read("app/admin/aircraft/[aircraftId]/onboarding/page.tsx");
  const settings=read("app/admin/aircraft/[aircraftId]/settings/page.tsx");
  assert.match(server,/validateContentPayload/);
  assert.match(server,/assertApplicabilityVariantsRegistered/);
  assert.match(server,/assertApplicabilityEquipmentRegistered/);
  assert.match(server,/hasCompletePublishedSourceProvenance/);
  assert.match(publication,/assertAircraftPackageReadyForCatalogue/);
  assert.match(onboarding,/getAircraftPackageReadiness/);
  assert.match(onboarding,/v3\.1 package gate/);
  assert.match(settings,/packageReadiness\.ready/);
});

test("v3.1 M3C normal Studio path exposes every package step without direct database authoring",()=>{
  const actions=read("app/admin/actions.ts");
  for(const action of [
    "createAircraftAction",
    "saveCommonEquipmentAction",
    "saveVariantProfileAction",
    "registerRevisionAction",
    "createReferenceAction",
    "createStructuredDraftAction",
    "approveVersionAction",
    "publishVersionAction",
    "publishAircraftAction",
  ]) assert.match(actions,new RegExp(`export async function ${action}\\b`),action);

  const normalPages=[
    "app/admin/aircraft/[aircraftId]/onboarding/page.tsx",
    "app/admin/aircraft/[aircraftId]/sources/page.tsx",
    "app/admin/aircraft/[aircraftId]/content/new/page.tsx",
    "app/admin/aircraft/[aircraftId]/content/[versionId]/page.tsx",
    "app/admin/aircraft/[aircraftId]/settings/page.tsx",
  ].map(read).join("\n");
  assert.doesNotMatch(normalPages,/from ["']@\/lib\/db["']|\bsql\s*`/);
  assert.match(normalPages,/Advanced raw JSON escape hatch|Create raw JSON draft/);
});

test("v3.1 M3C acceptance harness requires package readiness before catalogue publication",()=>{
  const acceptance=read("tests/no-code-postgres-acceptance.test.ts");
  assert.match(acceptance,/getAircraftPackageReadiness/);
  assert.match(acceptance,/packageReadiness\.ready, true/);
  assert.ok(acceptance.indexOf("packageReadiness.ready")<acceptance.indexOf("publishGovernedAircraft(aircraftId)"));
});

test("v3.1 M3 stays aircraft agnostic",()=>{
  const implementation=[
    read("lib/aircraft-package-readiness-model.ts"),
    read("lib/aircraft-package-readiness.ts"),
    read("lib/aircraft-publication.ts"),
    read("components/structured-content-builder.tsx"),
    read("app/admin/aircraft/[aircraftId]/onboarding/page.tsx"),
  ].join("\n");
  assert.doesNotMatch(implementation,/learjet|bristell|cessna|boeing|rotax/i);
});

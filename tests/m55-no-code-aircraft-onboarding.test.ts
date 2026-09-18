import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  assertApplicabilityEquipmentRegistered,
  collectEmbeddedEquipmentTags,
} from "../lib/content-applicability-binding.ts";
import {
  createStructuredStarterPayload,
  type StructuredAuthoringDomain,
} from "../lib/content-authoring-templates.ts";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const repository=read("lib/content-admin-repository.ts");
const governance=read("lib/content-governance.ts");
const settings=read("app/admin/aircraft/[aircraftId]/settings/page.tsx");
const actions=read("app/admin/actions.ts");
const composer=read("app/admin/aircraft/[aircraftId]/content/new/page.tsx");
const onboarding=read("app/admin/aircraft/[aircraftId]/onboarding/page.tsx");
const learnerRepository=read("lib/postgres-content-repository.ts");

function applicabilityBlocks(value:unknown):Record<string,unknown>[] {
  const result:Record<string,unknown>[]=[];
  const visit=(candidate:unknown)=>{
    if(Array.isArray(candidate)){candidate.forEach(visit);return;}
    if(!candidate||typeof candidate!=="object")return;
    const record=candidate as Record<string,unknown>;
    const applicability=record.applicability;
    if(applicability&&typeof applicability==="object"&&!Array.isArray(applicability))result.push(applicability as Record<string,unknown>);
    Object.values(record).forEach(visit);
  };
  visit(value);
  return result;
}

test("M55 equipment applicability is collected only from applicability blocks and fails closed on unknown tags",()=>{
  const payload={
    equipmentAllOf:["not-applicability"],
    systems:[
      {applicability:{equipmentAllOf:["engine-a"],equipmentAnyOf:["display-a","display-b"]}},
      {items:[{applicability:{equipmentNoneOf:["legacy-unit","engine-a"]}}]},
    ],
  };
  assert.deepEqual([...collectEmbeddedEquipmentTags(payload)].sort(),["display-a","display-b","engine-a","legacy-unit"]);
  assert.doesNotThrow(()=>assertApplicabilityEquipmentRegistered(payload,["engine-a","display-a","display-b","legacy-unit"],"test-aircraft"));
  assert.throws(()=>assertApplicabilityEquipmentRegistered(payload,["engine-a","display-a","display-b"],"test-aircraft"),/unregistered equipment tag\(s\).*test-aircraft.*legacy-unit/i);
});

test("M55 structured starters expose no-code configuration applicability for every supported scoped domain",()=>{
  const scopedDomains:StructuredAuthoringDomain[]=["checklists","procedures","performance","weight-balance","limitations","systems","flows","avionics","knowledge","abnormal"];
  for(const domain of scopedDomains){
    const payload=createStructuredStarterPayload("generic-aircraft",domain);
    const blocks=applicabilityBlocks(payload);
    assert.ok(blocks.length>0,`${domain} should expose at least one applicability editor`);
    for(const block of blocks){
      assert.equal(block.variants,undefined);
      assert.equal(block.equipmentAllOf,undefined);
      assert.equal(block.equipmentAnyOf,undefined);
      assert.equal(block.equipmentNoneOf,undefined);
    }
  }
});

test("M55 aircraft settings persist rich draft configuration data without source-code registration",()=>{
  assert.match(repository,/export async function updateAircraftProfile/);
  assert.match(repository,/export async function upsertAircraftVariant/);
  assert.match(repository,/display_name=EXCLUDED\.display_name,metadata=EXCLUDED\.metadata/);
  assert.match(repository,/equipmentTags/);
  assert.match(repository,/variantProfiles/);
  assert.match(repository,/a\.status='draft'/);
  assert.match(settings,/Variants &amp; equipment/);
  assert.match(settings,/saveVariantProfileAction/);
  assert.match(settings,/updateAircraftProfileAction/);
  assert.match(settings,/Configuration locked for this release/);
  assert.match(actions,/refreshAircraftRuntime/);
  assert.match(actions,/upsertAircraftVariant/);
});

test("M55 content governance validates both configured variants and equipment inventory",()=>{
  assert.match(governance,/SELECT variant_key,metadata FROM training_aircraft_variants/);
  assert.match(governance,/assertApplicabilityVariantsRegistered/);
  assert.match(governance,/assertApplicabilityEquipmentRegistered/);
  assert.match(governance,/variantMetadata\(row\.metadata\)\.equipmentTags/);
});

test("M55 authoring surfaces exact configuration identifiers while learner runtime already hydrates them from PostgreSQL",()=>{
  assert.match(composer,/Configuration scope/);
  assert.match(composer,/Registered equipment tags/);
  assert.match(composer,/Unknown identifiers are blocked at approval and publication/);
  assert.match(onboarding,/No-code aircraft profile/);
  assert.match(onboarding,/No source-code aircraft registration/);
  assert.match(learnerRepository,/v\.display_name,v\.metadata/);
  assert.match(learnerRepository,/equipmentTags:stringArray\(metadata\.equipmentTags\)/);
});

test("M55 remains aircraft agnostic",()=>{
  const implementation=[repository,governance,settings,actions,composer,onboarding,read("lib/content-applicability-binding.ts"),read("lib/content-authoring-templates.ts")].join("\n");
  assert.doesNotMatch(implementation,/bristell|learjet|cessna|boeing|rotax/i);
});

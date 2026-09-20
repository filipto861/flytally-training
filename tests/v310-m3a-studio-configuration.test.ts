import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { configurationForAircraftVariant, matchesAircraftApplicability } from "../lib/aircraft-applicability.ts";
import { commonAircraftEquipmentProfileKey, mergeAircraftEquipmentTags } from "../lib/aircraft-configuration-profile.ts";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("v3.1 M3A common aircraft equipment is active without requiring a variant",()=>{
  const aircraft={
    id:"common-equipment-aircraft",
    variants:[],
    equipmentTags:["constant-speed-prop","autopilot"],
    variantProfiles:[],
  } as const;
  const configuration=configurationForAircraftVariant(aircraft,undefined);
  assert.deepEqual([...configuration.equipment],["constant-speed-prop","autopilot"]);
  assert.equal(matchesAircraftApplicability({equipmentAllOf:["autopilot"]},configuration),true);
});

test("v3.1 M3A selected variant adds equipment to common aircraft equipment",()=>{
  const aircraft={
    id:"variant-equipment-aircraft",
    variants:["A","B"],
    equipmentTags:["engine-common"],
    variantProfiles:[
      {key:"A",displayName:"A",equipmentTags:[]},
      {key:"B",displayName:"B",equipmentTags:["glass-panel"]},
    ],
  } as const;
  assert.deepEqual([...configurationForAircraftVariant(aircraft,"B").equipment],["engine-common","glass-panel"]);
  assert.deepEqual(mergeAircraftEquipmentTags(["engine-common"],["glass-panel","engine-common"]),["engine-common","glass-panel"]);
});

test("v3.1 M3A reserved common profile never becomes a registered learner variant",()=>{
  assert.equal(commonAircraftEquipmentProfileKey,"__common__");
  const admin=read("lib/content-admin-repository.ts");
  const learner=read("lib/postgres-content-repository.ts");
  const governance=read("lib/content-governance.ts");
  assert.match(admin,/variant_key<>\$\{commonAircraftEquipmentProfileKey\}/);
  assert.match(admin,/filter\(row=>row\.variant_key!==commonAircraftEquipmentProfileKey\)/);
  assert.match(learner,/filter\(profile=>profile\.key!==commonAircraftEquipmentProfileKey\)/);
  assert.match(governance,/filter\(\(row\) => row\.variant_key !== commonAircraftEquipmentProfileKey\)/);
});

test("v3.1 M3A Studio manages common and variant-only equipment as configuration data",()=>{
  const settings=read("app/admin/aircraft/[aircraftId]/settings/page.tsx");
  const actions=read("app/admin/actions.ts");
  const onboarding=read("app/admin/aircraft/[aircraftId]/onboarding/page.tsx");
  assert.match(settings,/Common equipment/);
  assert.match(settings,/Variant-only equipment tags/);
  assert.match(settings,/Structured configuration metadata/);
  assert.match(settings,/configurationJson/);
  assert.match(settings,/saveCommonEquipmentAction/);
  assert.match(actions,/setAircraftCommonEquipment/);
  assert.match(actions,/parseAircraftConfigurationMetadata/);
  assert.match(actions,/variantConfiguration\(form\)/);
  assert.match(onboarding,/aircraft\.equipmentTags/);
});

test("v3.1 M3A structured authoring uses registered applicability choices",()=>{
  const builder=read("components/structured-content-builder.tsx");
  const create=read("app/admin/aircraft/[aircraftId]/content/new/page.tsx");
  const revise=read("app/admin/aircraft/[aircraftId]/content/[versionId]/page.tsx");
  assert.match(builder,/applicabilityArrayKeys/);
  assert.match(builder,/renderApplicabilityChoices/);
  assert.match(builder,/unregistered/);
  assert.match(create,/variantOptions=\{variantOptions\}/);
  assert.match(create,/equipmentOptions=\{equipmentTags\}/);
  assert.match(revise,/variantOptions=\{variantOptions\}/);
  assert.match(revise,/equipmentOptions=\{equipmentOptions\}/);
});

test("v3.1 M3A remains aircraft agnostic",()=>{
  const implementation=[
    read("lib/aircraft-configuration-profile.ts"),
    read("lib/aircraft-applicability.ts"),
    read("lib/content-admin-repository.ts"),
    read("lib/postgres-content-repository.ts"),
    read("components/structured-content-builder.tsx"),
    read("app/admin/aircraft/[aircraftId]/settings/page.tsx"),
  ].join("\n");
  assert.doesNotMatch(implementation,/learjet|bristell|cessna|boeing|rotax/i);
});

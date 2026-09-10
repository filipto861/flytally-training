import assert from "node:assert/strict";
import test from "node:test";
import { learjet3536AbnormalTraining } from "../lib/abnormal-scenarios.ts";
import { learjet3536CockpitOrientation } from "../lib/cockpit-orientation.ts";
import { validateContentPayload } from "../lib/content-contracts.ts";
import { learjet3536LearningContent } from "../lib/learning-content.ts";
import { learjet3536ReferenceKnowledge } from "../lib/reference-knowledge.ts";
import { learjet3536ColdDarkFlow } from "../lib/simulator-checklists.ts";

const aircraftId="learjet-35-36";
const records=[
  ["learning",learjet3536LearningContent],
  ["normal-flight",learjet3536ColdDarkFlow],
  ["orientation",learjet3536CockpitOrientation],
  ["abnormal",learjet3536AbnormalTraining],
  ["reference-knowledge",learjet3536ReferenceKnowledge],
] as const;

test("existing Learjet bundles remain valid during the M9 migration",()=>{
  for(const [domain,payload] of records)assert.deepEqual(validateContentPayload(domain,payload,aircraftId),[],domain);
});

test("publication contract rejects a wrong aircraft id and malformed legacy payload",()=>{
  const errors=validateContentPayload("normal-flight",{aircraftId:"wrong",title:"x",estimatedMinutes:10,sourceNote:"x",phases:[]},aircraftId);
  assert.ok(errors.some(error=>error.includes("aircraftId")));
  assert.ok(errors.some(error=>error.includes("phases")));
});

test("abnormal publication contract preserves the existing four-stage trainer model",()=>{
  const broken=structuredClone(learjet3536AbnormalTraining) as any;
  broken.scenarios[0].stages=broken.scenarios[0].stages.slice(0,3);
  assert.ok(validateContentPayload("abnormal",broken,aircraftId).some(error=>error.includes("Recognize")));
});

test("M9 accepts independent checklist, procedure and performance modules",()=>{
  assert.deepEqual(validateContentPayload("checklists",{
    aircraftId,
    title:"Normal checklists",
    phases:[{id:"before-start",title:"Before Start",sequence:10,items:[{id:"battery",challenge:"Battery",response:"ON",procedureId:"electrical-power-up",explanation:"Establish aircraft electrical power."}]}],
  },aircraftId),[]);

  assert.deepEqual(validateContentPayload("procedures",{
    aircraftId,
    title:"Normal procedures",
    procedures:[{id:"electrical-power-up",title:"Electrical power up",steps:[{id:"battery-on",action:"Set BAT switch ON",expectedResult:"Bus voltage indicated",verification:"Confirm normal voltage indication",rationale:"Energizes the aircraft electrical system."}]}],
  },aircraftId),[]);

  assert.deepEqual(validateContentPayload("performance",{
    aircraftId,
    title:"Performance",
    datasets:[{
      id:"takeoff-speed",
      title:"Takeoff speed",
      kind:"lookup-table",
      interpolation:"none",
      axes:[{key:"mass",label:"Mass",unit:"kg",values:[600]}],
      outputs:[{key:"vr",label:"VR",unit:"KIAS"}],
      rows:[{inputs:{mass:600},outputs:{vr:60}}],
    }],
  },aircraftId),[]);
});

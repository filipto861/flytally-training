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

test("existing Learjet bundles satisfy the generic M8 publication contracts",()=>{
  for(const [domain,payload] of records)assert.deepEqual(validateContentPayload(domain,payload,aircraftId),[],domain);
});

test("publication contract rejects a wrong aircraft id and malformed domain payload",()=>{
  const errors=validateContentPayload("normal-flight",{aircraftId:"wrong",title:"x",estimatedMinutes:10,sourceNote:"x",phases:[]},aircraftId);
  assert.ok(errors.some(error=>error.includes("aircraftId")));
  assert.ok(errors.some(error=>error.includes("phases")));
});

test("abnormal publication contract preserves the four-stage trainer model",()=>{
  const broken=structuredClone(learjet3536AbnormalTraining) as any;
  broken.scenarios[0].stages=broken.scenarios[0].stages.slice(0,3);
  assert.ok(validateContentPayload("abnormal",broken,aircraftId).some(error=>error.includes("Recognize")));
});

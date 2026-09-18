import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { validateContentPayload } from "../lib/content-contracts.ts";
import {
  createPerformanceAuthoringDataset,
  createPerformanceAuthoringStructure,
  performanceAuthoringModeFromDataset,
  performanceAuthoringModes,
} from "../lib/performance-authoring-presets.ts";
import { createStructuredStarterPayload } from "../lib/content-authoring-templates.ts";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

function validDataset(mode:(typeof performanceAuthoringModes)[number],operation?:string){
  const dataset=createPerformanceAuthoringDataset(mode);
  return {
    ...dataset,
    id:`${mode}-dataset`,
    title:`${mode} dataset`,
    ...(operation?createPerformanceAuthoringStructure(mode,operation):{}),
    applicability:undefined,
  };
}

test("v3.1 M3B performance composer exposes all generic calculator behaviors",()=>{
  assert.deepEqual(performanceAuthoringModes,["reference-only","metric-lookup","runway-distance-grid","distance-factor"]);
  for(const mode of performanceAuthoringModes){
    const dataset=validDataset(mode,mode==="runway-distance-grid"||mode==="distance-factor"?"landing":"cruise");
    const payload={aircraftId:"generic-aircraft",title:"Performance",datasets:[dataset]};
    assert.deepEqual(validateContentPayload("performance",payload,"generic-aircraft"),[],mode);
    assert.equal(performanceAuthoringModeFromDataset(dataset),mode);
  }
});

test("v3.1 M3B runway and factor presets are aircraft-neutral governed structures",()=>{
  const runway=createPerformanceAuthoringStructure("runway-distance-grid","takeoff") as Record<string,unknown>;
  const runwayCalculator=runway.calculator as Record<string,unknown>;
  assert.equal(runway.phase,"takeoff");
  assert.equal(runwayCalculator.kind,"runway-distance-grid");
  assert.equal(runwayCalculator.operation,"takeoff");

  const factor=createPerformanceAuthoringStructure("distance-factor","landing") as Record<string,unknown>;
  const factorCalculator=factor.calculator as Record<string,unknown>;
  assert.equal(factor.phase,"landing");
  assert.equal(factorCalculator.kind,"distance-factor");
  assert.equal(factorCalculator.operation,"landing");

  assert.doesNotMatch(JSON.stringify({runway,factor}),/learjet|bristell|cessna|boeing|rotax/i);
});

test("v3.1 M3B performance structured starter is produced by the composer preset",()=>{
  const payload=createStructuredStarterPayload("generic-aircraft","performance");
  const datasets=payload.datasets as Array<Record<string,unknown>>;
  assert.equal(datasets.length,1);
  assert.equal((datasets[0]?.calculator as Record<string,unknown>)?.kind,"metric-lookup");
  assert.equal(performanceAuthoringModeFromDataset(datasets[0]),"metric-lookup");
});

test("v3.1 M3B Studio manages calculator bindings and W&B setup without raw JSON",()=>{
  const builder=read("components/structured-content-builder.tsx");
  assert.match(builder,/Dataset behavior/);
  assert.match(builder,/switchPerformanceDatasetMode/);
  assert.match(builder,/managed by calculator operation/);
  assert.match(builder,/datasetBindingOptions/);
  assert.match(builder,/Factor selector behavior/);
  assert.match(builder,/Weight & Balance setup/);
  assert.match(builder,/Fuel burn station/);
  assert.match(builder,/setWeightBalanceStationInput/);
  assert.match(builder,/Separate landing mass limit/);
});

test("v3.1 M3B registered source selection copies citations and auto-links governed provenance",()=>{
  const builder=read("components/structured-content-builder.tsx");
  const create=read("app/admin/aircraft/[aircraftId]/content/new/page.tsx");
  const revise=read("app/admin/aircraft/[aircraftId]/content/[versionId]/page.tsx");
  assert.match(builder,/Registered reference/);
  assert.match(builder,/registeredSourceValue/);
  assert.match(builder,/embeddedSourceReferenceIds/);
  assert.match(builder,/name="sourceReferenceId"/);
  assert.match(create,/sourceOptions=\{sourceOptions\}/);
  assert.match(revise,/sourceOptions=\{sourceOptions\}/);
});

test("v3.1 M3B remains generic and raw JSON is only an advanced escape hatch",()=>{
  const builder=read("components/structured-content-builder.tsx");
  assert.match(builder,/Advanced raw JSON escape hatch/);
  assert.doesNotMatch(builder,/learjet|bristell|cessna|boeing|rotax/i);
});

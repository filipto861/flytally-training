import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import type { TrainingAircraft } from "../lib/aircraft-catalog.ts";
import { getAircraftContentBundle } from "../lib/content-repository.ts";
import { materializeLegacyPerformanceContracts } from "../lib/performance-contract-migration.ts";
import { toOperationalPerformanceDatasets } from "../lib/operational-flight-data.ts";
import { progressStorageKey, summarizeProgress } from "../lib/progress-events.ts";
import { StaticTrainingContentRepository } from "../lib/static-content-repository.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const legacyGrid:PerformanceDataset={
  id:"takeoff-runway-grid",
  title:"Takeoff runway grid",
  kind:"lookup-table",
  axes:[
    {key:"airportAltitudeFt",label:"Airport altitude",unit:"ft",values:[0,2000]},
    {key:"isaDeviationC",label:"ISA deviation",unit:"°C",values:[0,10]},
    {key:"surface",label:"Runway surface",values:["Paved","Grass"]},
  ],
  outputs:[
    {key:"oatC",label:"Published temperature",unit:"°C"},
    {key:"groundRunM",label:"Ground run",unit:"m"},
    {key:"distance50ftM",label:"Distance over obstacle",unit:"m"},
  ],
  rows:[{inputs:{airportAltitudeFt:0,isaDeviationC:0,surface:"Paved"},outputs:{oatC:15,groundRunM:200,distance50ftM:350}}],
  interpolation:"linear-explicit",
};

test("v3.1 M5A materializes pre-v3.1 runway grids into the declarative contract without changing source rows",()=>{
  const [dataset]=materializeLegacyPerformanceContracts([legacyGrid]);
  assert.ok(dataset);
  assert.equal(dataset.phase,"takeoff");
  assert.equal(dataset.calculator?.kind,"runway-distance-grid");
  assert.equal(dataset.calculator?.operation,"takeoff");
  if(dataset.calculator?.kind!=="runway-distance-grid")assert.fail("runway grid calculator expected");
  assert.deepEqual(dataset.calculator.bindings,{
    altitudeAxis:"airportAltitudeFt",
    isaDeviationAxis:"isaDeviationC",
    surfaceAxis:"surface",
    sourceTemperatureOutput:"oatC",
    groundRunOutput:"groundRunM",
    obstacleDistanceOutput:"distance50ftM",
  });
  assert.equal(dataset.calculator.oatInput.unit,"°C");
  assert.equal(dataset.calculator.runwayAvailableInput.unit,"m");
  assert.deepEqual(dataset.rows,legacyGrid.rows);
});

test("v3.1 M5A never rewrites already-declarative performance data",()=>{
  const declared:PerformanceDataset={
    id:"arrival-metrics",
    title:"Arrival metrics",
    kind:"lookup-table",
    phase:"landing",
    calculator:{kind:"metric-lookup",operation:"landing",axisKey:"mass",outputKeys:["speed"]},
    axes:[{key:"mass",label:"Mass",unit:"kg",values:[500]}],
    outputs:[{key:"speed",label:"Reference speed",unit:"kt"}],
    rows:[{inputs:{mass:500},outputs:{speed:60}}],
    interpolation:"none",
  };
  const [result]=materializeLegacyPerformanceContracts([declared]);
  assert.equal(result,declared);
});

test("v3.1 M5A Flight Deck transport preserves declarative calculator metadata",()=>{
  const [migrated]=materializeLegacyPerformanceContracts([legacyGrid]);
  assert.ok(migrated);
  const [operational]=toOperationalPerformanceDatasets([migrated]);
  assert.equal(operational?.phase,"takeoff");
  assert.equal(operational?.calculator?.kind,"runway-distance-grid");
  assert.deepEqual(operational?.rows,migrated.rows);
});

test("v3.1 M5A sparse capability discovery produces Home Fly Learn Reference from published data only",async()=>{
  const aircraft:TrainingAircraft={
    id:"second-aircraft",
    manufacturer:"Generic Manufacturer",
    model:"Light SEP",
    displayName:"Second Aircraft",
    variants:["configured"],
    equipmentTags:["engine-common"],
    variantProfiles:[{key:"configured",displayName:"Configured aircraft",equipmentTags:["constant-speed-prop"]}],
    manuals:[],
  };
  const published=["checklists","procedures","performance","weight-balance","limitations","systems","abnormal","knowledge"] as const;
  const repository=new StaticTrainingContentRepository({
    aircraft:[aircraft],
    nativeModules:published.map(domain=>({aircraftId:aircraft.id,domain,payload:{aircraftId:aircraft.id}})),
    learningContent:[],
    normalFlights:[],
    cockpitOrientations:[],
    abnormalTrainings:[],
    referenceKnowledge:[],
  });
  const bundle=await getAircraftContentBundle(repository,aircraft.id);
  assert.ok(bundle);
  assert.equal(bundle.capabilities.checklists,true);
  assert.equal(bundle.capabilities.performance,true);
  assert.equal(bundle.capabilities.weightBalance,true);
  assert.equal(bundle.capabilities.systems,true);
  assert.equal(bundle.capabilities.knowledge,true);
  assert.equal(bundle.capabilities.abnormalEmergency,true);
  assert.equal(bundle.capabilities.flows,false);
  assert.equal(bundle.capabilities.avionics,false);
  assert.equal(bundle.capabilities.quickStart,false);
  assert.equal(bundle.capabilities.cockpitOrientation,false);
});

test("v3.1 M5A progress remains isolated per aircraft",()=>{
  assert.notEqual(progressStorageKey("reference-aircraft"),progressStorageKey("second-aircraft"));
  const events=[
    {aircraftId:"reference-aircraft",kind:"systems" as const,contentId:"electrical",occurredAt:"2026-09-18T10:00:00.000Z",completed:true},
    {aircraftId:"second-aircraft",kind:"systems" as const,contentId:"fuel",occurredAt:"2026-09-18T11:00:00.000Z",completed:true},
  ];
  const second=summarizeProgress("second-aircraft",events);
  assert.equal(second.attempts,1);
  assert.equal(second.completedActivities,1);
  assert.equal(second.recent[0]?.contentId,"fuel");
});

test("v3.1 M5A learner surfaces stay capability/configuration driven",()=>{
  const home=read("app/aircraft/[aircraftId]/page.tsx");
  const fly=read("app/aircraft/[aircraftId]/fly/page.tsx");
  const learn=read("app/aircraft/[aircraftId]/training/page.tsx");
  const reference=read("app/aircraft/[aircraftId]/reference/page.tsx");
  const transport=read("lib/operational-flight-data.ts");
  const fullPerformance=read("components/performance-calculator.tsx");
  const operationalPerformance=read("components/operational-performance.tsx");
  const combined=[home,fly,learn,reference,transport,fullPerformance,operationalPerformance].join("\n");

  assert.match(home,/capabilities\.checklists \|\| capabilities\.performance/);
  assert.match(fly,/configurationForAircraftVariant\(aircraft, selectedVariant\)/);
  assert.match(fly,/filterPerformanceForConfiguration/);
  assert.match(learn,/capabilities\.systems/);
  assert.match(reference,/capabilities\.weightBalance/);
  assert.match(transport,/calculator: dataset\.calculator/);
  assert.match(fullPerformance,/materializeLegacyPerformanceContracts/);
  assert.match(operationalPerformance,/materializeLegacyPerformanceContracts/);
  assert.doesNotMatch(combined,/bristell|learjet|cessna|boeing|rotax|kw-21|sn809/i);
});

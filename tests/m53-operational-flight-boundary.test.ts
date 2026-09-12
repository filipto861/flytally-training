import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  toOperationalChecklist,
  toOperationalEmergency,
  toOperationalPerformanceDatasets,
} from "../lib/operational-flight-data.ts";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const flyPage=read("app/aircraft/[aircraftId]/fly/page.tsx");
const deck=read("components/flight-deck.tsx");
const offline=read("components/offline-flight-bootstrap.tsx");
const serviceWorker=read("app/sw.js/route.ts");

test("M53 strips training-only checklist fields before the client boundary",()=>{
  const operational=toOperationalChecklist({
    aircraftId:"generic-aircraft",
    title:"Normal checklist",
    estimatedMinutes:12,
    phases:[{
      id:"before-start",
      title:"Before Start",
      items:[{
        id:"controls",
        challenge:"Controls",
        response:"FREE",
        explanation:"training explanation",
        verification:"training verification",
        condition:"training condition",
        procedureId:"procedure-link",
        sourceLabel:"source label",
        notices:[
          {kind:"note",text:"training note"},
          {kind:"warning",text:"operational warning"},
        ],
      }],
    }],
  });
  const serialized=JSON.stringify(operational);
  assert.match(serialized,/operational warning/);
  assert.doesNotMatch(serialized,/estimatedMinutes|training explanation|training verification|training condition|procedure-link|source label|training note/);
});

test("M53 strips reference metadata from performance datasets while preserving calculator inputs",()=>{
  const [operational]=toOperationalPerformanceDatasets([{
    id:"takeoff-distance-grid",
    title:"Takeoff",
    description:"reference description",
    kind:"lookup-table",
    axes:[{key:"airportAltitudeFt",label:"Altitude",unit:"ft",values:[0,2000]}],
    outputs:[{key:"groundRunM",label:"Ground run",unit:"m"}],
    rows:[{inputs:{airportAltitudeFt:0},outputs:{groundRunM:100}}],
    interpolation:"none",
    notes:["reference note"],
    applicability:{variants:["variant-a"],note:"applicability note"},
    sources:[{manualId:"manual",pageLabel:"5-5",note:"source note"}],
  }]);
  const serialized=JSON.stringify(operational);
  assert.match(serialized,/takeoff-distance-grid/);
  assert.match(serialized,/groundRunM/);
  assert.doesNotMatch(serialized,/reference description|reference note|variant-a|applicability note|manual|source note/);
});

test("M53 maps emergency data directly to QRH-only fields",()=>{
  const operational=toOperationalEmergency({
    aircraftId:"generic-aircraft",
    title:"Emergency",
    sourceNote:"training source note",
    disclaimer:"training disclaimer",
    scenarios:[{
      id:"engine-fire",
      title:"Engine fire",
      category:"Fire",
      phase:"Flight",
      difficulty:"core",
      minutes:5,
      summary:"training summary",
      setup:"training setup",
      objectives:["training objective"],
      debrief:["training debrief"],
      notices:[{kind:"warning",text:"Operational warning"}],
      boundaryNote:"Authority boundary",
      applicability:{note:"Configuration note"},
      stages:[{
        id:"immediate",
        label:"Immediate actions",
        prompt:"training prompt",
        expectedResponse:["Fuel selector — OFF"],
        explanation:"training explanation",
        notices:[{kind:"caution",text:"Operational caution"}],
        sources:[{manualId:"manual",chapter:"3",section:"Fire",pageLabel:"3-6",note:"training source detail"}],
      }],
    }],
  });
  const serialized=JSON.stringify(operational);
  assert.match(serialized,/Fuel selector — OFF/);
  assert.match(serialized,/Operational warning|Operational caution|Authority boundary|Configuration note/);
  assert.match(serialized,/manual|3-6/);
  assert.doesNotMatch(serialized,/training source note|training disclaimer|training summary|training setup|training objective|training debrief|training prompt|training explanation|training source detail|difficulty|minutes/);
});

test("Fly filters applicability before crossing the operational mapper boundary",()=>{
  assert.match(flyPage,/filterChecklistForConfiguration/);
  assert.match(flyPage,/toOperationalChecklist\(runtimeChecklist\)/);
  assert.match(flyPage,/filterPerformanceForConfiguration/);
  assert.match(flyPage,/toOperationalPerformanceDatasets\(configuredPerformance\?\.datasets \?\? \[\]\)/);
  assert.match(flyPage,/filterAbnormalEmergencyForConfiguration/);
  assert.match(flyPage,/toOperationalEmergency\(configuredAbnormal\)/);
  assert.doesNotMatch(flyPage,/normalizeUniversalAbnormalEmergency|normalizeLegacyAbnormalTraining/);
  assert.doesNotMatch(deck,/RuntimeChecklist|RuntimeAbnormalTraining|PerformanceDataset from/);
});

test("offline ready is acknowledged only after caching and remains variant-safe",()=>{
  assert.match(offline,/MessageChannel/);
  assert.match(offline,/CACHE_FLIGHT_PAGE_RESULT/);
  assert.match(offline,/verifyFlightCache/);
  assert.match(serviceWorker,/flytally-flight-v2/);
  assert.match(serviceWorker,/canonicalFlightRequest/);
  assert.match(serviceWorker,/searchParams\.get\("variant"\)/);
  assert.match(serviceWorker,/cache\.match\(cacheKey\)/);
  assert.doesNotMatch(serviceWorker,/ignoreSearch:\s*true/);
});

test("M53 operational boundary stays aircraft agnostic",()=>{
  const operational=read("lib/operational-flight-data.ts");
  assert.doesNotMatch(operational+flyPage+deck+offline+serviceWorker,/bristell|learjet|cessna|boeing|rotax/i);
});

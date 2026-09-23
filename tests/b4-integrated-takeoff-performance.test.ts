import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { ActiveFlight } from "../lib/active-flight/types.ts";
import {
  buildTakeoffPerformanceContext,
  computeContextHash,
  diffPerformanceContext,
} from "../lib/performance/context.ts";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

const flight:ActiveFlight={
  id:"flight-b4",
  aircraftId:"learjet-35a",
  accountSubject:"local",
  lifecycle:"ACTIVE",
  departure:{icao:"LKPR"},
  destination:{icao:"LKTB"},
  runway:null,
  weight:{value:15000,unit:"lb"},
  configuration:null,
  weather:null,
  performanceDependency:{snapshotId:"afd1:b4"},
  brief:null,
  createdAt:"2026-09-23T00:00:00.000Z",
  updatedAt:"2026-09-23T00:00:00.000Z",
  activatedAt:"2026-09-23T00:00:00.000Z",
  deactivatedAt:null,
  archivedAt:null,
};

test("B4 builds Takeoff context from operation-owned setup without legacy Active Flight runway/config",()=>{
  const context=buildTakeoffPerformanceContext(flight,{
    runway:{identifier:"24",airportIcao:"LKPR"},
    weight:{value:14800,unit:"lb"},
    configuration:{flaps:"8",antiIce:false},
    weather:{qnh:1016,oat:14},
  });

  assert.equal(context.activeFlightId,"flight-b4");
  assert.deepEqual(context.runway,{identifier:"24",airportIcao:"LKPR"});
  assert.deepEqual(context.weight,{value:14800,unit:"lb"});
  assert.deepEqual(context.configuration,{flaps:"8",antiIce:false});
  assert.deepEqual(context.weather,{qnh:1016,oat:14});
});

test("B4 runway dependency includes airport identity, not only runway number",()=>{
  const first=buildTakeoffPerformanceContext(flight,{
    runway:{identifier:"24",airportIcao:"LKPR"},
    weight:{value:15000,unit:"lb"},
    configuration:{flaps:"8",antiIce:false},
    weather:{qnh:1013,oat:15},
  });
  const second={...first,runway:{...first.runway,airportIcao:"LKKV"}};

  assert.notEqual(computeContextHash(first),computeContextHash(second));
  assert.deepEqual(diffPerformanceContext(first,second),[{
    key:"runway",
    label:"Runway",
    before:"LKPR · 24",
    after:"LKKV · 24",
  }]);
});

test("B4 UX6 Performance consumes real runway data, governed config and airport-driven METAR",()=>{
  const source=read("components/ft-performance/FtPerformancePresentation.tsx");

  assert.match(source,/loadAirportDataset/);
  assert.match(source,/availableRunwayEnds/);
  assert.match(source,/resolveRunwayEnd/);
  assert.match(source,/current\.departure\.icao/);
  assert.match(source,/takeoffCalculator\?\.flapOptions/);
  assert.match(source,/aria-label="Takeoff runway"/);
  assert.match(source,/aria-label="Takeoff flaps"/);
  assert.match(source,/\/api\/weather\/metar\?icao=/);
  assert.match(source,/calculatePressureAltitudeFt/);
  assert.match(source,/calculateWindComponents/);
  assert.match(source,/Use METAR/);
  assert.match(source,/Calculate Takeoff/);
});

test("B4 UX6 Performance no longer requires legacy Active Flight runway/config to render setup",()=>{
  const source=read("components/ft-performance/FtPerformancePresentation.tsx");

  assert.doesNotMatch(source,/buildPerformanceContext\(current\)/);
  assert.match(source,/current && showInputs/);
  assert.match(source,/buildTakeoffPerformanceContext/);
});

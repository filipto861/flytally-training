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
  const presentation=read("components/ft-performance/FtPerformancePresentation.tsx");
  const controller=read("components/ft-performance/use-performance-operation.ts");

  assert.match(controller,/loadAirportDataset/);
  assert.match(controller,/availableRunwayEnds/);
  assert.match(controller,/resolveRunwayEnd/);
  assert.match(controller,/current\.departure\.icao/);
  assert.match(controller,/\/api\/weather\/metar\?icao=/);
  assert.match(controller,/calculatePressureAltitudeFt/);
  assert.match(controller,/calculateWindComponents/);
  assert.match(controller,/previousDeparture/);
  assert.match(controller,/setAvailableWeather\(null\)/);
  assert.match(controller,/storedState\?\.requiresRecalculation/);
  assert.match(controller,/snapshotDependencyChanges\.length > 0/);
  assert.match(controller,/!currentContext/);
  assert.match(controller,/!isContextValid\(currentContext, result\.context\)/);

  assert.match(presentation,/current\.departure\.icao/);
  assert.match(presentation,/takeoffCalculator\?\.flapOptions/);
  assert.match(presentation,/aria-label="Takeoff runway"/);
  assert.match(presentation,/aria-label="Takeoff flaps"/);
  assert.match(presentation,/Use latest METAR|Apply & recalculate/);
  assert.match(presentation,/Calculate Takeoff/);
});

test("B4 UX6 Performance no longer requires legacy Active Flight runway/config to render setup",()=>{
  const presentation=read("components/ft-performance/FtPerformancePresentation.tsx");
  const controller=read("components/ft-performance/use-performance-operation.ts");

  assert.doesNotMatch(controller,/buildPerformanceContext\(current\)/);
  assert.match(presentation,/current && showInputs/);
  assert.match(controller,/buildTakeoffPerformanceContext/);
});

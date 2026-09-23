import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  parseActiveFlightInput,
  parseActiveFlightPatch,
} from "../lib/active-flight/validation.ts";
import { buildPerformanceContext } from "../lib/performance/context.ts";
import type { ActiveFlight } from "../lib/active-flight/types.ts";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

const minimalInput={
  aircraftId:"learjet-35a",
  departure:{icao:"LKPR"},
  destination:{icao:"LKTB"},
  weight:{value:15000,unit:"lb" as const},
};

test("B3 Active Flight creation no longer requires runway or aircraft configuration",()=>{
  const parsed=parseActiveFlightInput(minimalInput);
  assert.ok(parsed);
  assert.equal(parsed.runway,null);
  assert.equal(parsed.configuration,null);
  assert.deepEqual(parsed.weight,{value:15000,unit:"lb"});
});

test("B3 Active Flight patches may explicitly clear legacy runway and configuration",()=>{
  assert.deepEqual(parseActiveFlightPatch({runway:null}),{runway:null});
  assert.deepEqual(parseActiveFlightPatch({configuration:null}),{configuration:null});
});

test("B3 Active Flight UI no longer asks for free-text runway or flaps",()=>{
  const source=read("components/ft-flight/FtActiveFlight.tsx");
  assert.doesNotMatch(source,/name="runway"/);
  assert.doesNotMatch(source,/name="flaps"/);
  assert.doesNotMatch(source,/name="antiIce"/);
  assert.match(source,/name="departure"/);
  assert.match(source,/name="destination"/);
  assert.match(source,/name="weight"/);
});

test("B3 legacy Performance fails closed until operation-owned setup exists",()=>{
  const flight:ActiveFlight={
    id:"flight-1",
    aircraftId:"learjet-35a",
    accountSubject:"local",
    lifecycle:"ACTIVE",
    departure:{icao:"LKPR"},
    destination:{icao:"LKTB"},
    runway:null,
    weight:{value:15000,unit:"lb"},
    configuration:null,
    weather:null,
    performanceDependency:{snapshotId:"afd1:test"},
    brief:null,
    createdAt:"2026-09-23T00:00:00.000Z",
    updatedAt:"2026-09-23T00:00:00.000Z",
    activatedAt:"2026-09-23T00:00:00.000Z",
    deactivatedAt:null,
    archivedAt:null,
  };
  assert.equal(buildPerformanceContext(flight),null);
  assert.match(
    read("components/ft-performance/FtPerformancePresentation.tsx"),
    /Performance setup required/,
  );
});

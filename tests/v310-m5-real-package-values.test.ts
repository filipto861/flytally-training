import assert from "node:assert/strict";
import test from "node:test";

import {
  configurationForAircraftVariant,
  filterPerformanceForConfiguration,
  matchesAircraftApplicability,
  resolveSelectedVariant,
} from "../lib/aircraft-applicability.ts";
import { calculateNativeDistanceGrid } from "../lib/performance-calculator.ts";
import { materializeLegacyPerformanceContracts } from "../lib/performance-contract-migration.ts";
import { calculateWeightBalance } from "../lib/weight-balance-calculator.ts";
import {
  realSecondAircraft,
  realSecondAircraftPerformance,
  realSecondAircraftWeightBalance,
} from "./fixtures/v31-real-second-aircraft.ts";

test("v3.1 M5B real single configuration auto-selects and admits its scoped package",()=>{
  const selected=resolveSelectedVariant(undefined,realSecondAircraft.variants);
  assert.equal(selected,"sn809-2025");
  const configuration=configurationForAircraftVariant(realSecondAircraft,selected);
  assert.equal(configuration.variant,"sn809-2025");
  assert.equal(configuration.equipment.has("rotax-912-uls-3"),true);
  assert.equal(configuration.equipment.has("woodcomp-kw-21"),true);

  const configuredPerformance=filterPerformanceForConfiguration(realSecondAircraftPerformance,configuration);
  assert.deepEqual(configuredPerformance.datasets.map(dataset=>dataset.id),[
    "takeoff-distance-grid",
    "landing-distance-grid",
  ]);
  assert.equal(matchesAircraftApplicability(realSecondAircraftWeightBalance.applicability,configuration),true);
});

test("v3.1 M5B wrong configuration cannot consume S/N-specific performance or W&B",()=>{
  const wrong={variant:"other-aircraft",equipment:new Set<string>()};
  assert.deepEqual(filterPerformanceForConfiguration(realSecondAircraftPerformance,wrong).datasets,[]);
  assert.equal(matchesAircraftApplicability(realSecondAircraftWeightBalance.applicability,wrong),false);
});

test("v3.1 M5B real published runway rows calculate exact takeoff and landing values",()=>{
  const migrated=materializeLegacyPerformanceContracts(realSecondAircraftPerformance.datasets);
  const takeoff=migrated.find(dataset=>dataset.id==="takeoff-distance-grid");
  const landing=migrated.find(dataset=>dataset.id==="landing-distance-grid");

  const takeoffResult=calculateNativeDistanceGrid(takeoff,{
    airportAltitudeFt:0,
    oatC:15,
    surface:"Concrete",
    runwayAvailableM:500,
  });
  assert.equal(takeoffResult.status,"ready");
  assert.equal(takeoffResult.method,"exact-source-row");
  assert.equal(takeoffResult.groundRunM,140);
  assert.equal(takeoffResult.distance50ftM,380);
  assert.equal(takeoffResult.distance50ftMarginM,120);
  assert.equal(takeoffResult.withinRunway,true);

  const landingResult=calculateNativeDistanceGrid(landing,{
    airportAltitudeFt:0,
    oatC:15,
    surface:"Concrete",
    runwayAvailableM:400,
  });
  assert.equal(landingResult.status,"ready");
  assert.equal(landingResult.method,"exact-source-row");
  assert.equal(landingResult.groundRunM,90);
  assert.equal(landingResult.distance50ftM,290);
  assert.equal(landingResult.distance50ftMarginM,110);
  assert.equal(landingResult.withinRunway,true);
});

test("v3.1 M5B real takeoff grid performs only bounded source-authorized interpolation",()=>{
  const [takeoff]=materializeLegacyPerformanceContracts([realSecondAircraftPerformance.datasets[0]!]);
  const interpolated=calculateNativeDistanceGrid(takeoff,{
    airportAltitudeFt:1000,
    oatC:18,
    surface:"Concrete",
  });
  assert.equal(interpolated.status,"ready");
  assert.equal(interpolated.method,"bounded-linear-interpolation");
  assert.ok(Math.abs((interpolated.isaDeviationC??0)-5)<1e-9);
  assert.ok(Math.abs((interpolated.groundRunM??0)-155)<1e-9);
  assert.ok(Math.abs((interpolated.distance50ftM??0)-420)<1e-9);

  const extrapolated=calculateNativeDistanceGrid(takeoff,{
    airportAltitudeFt:3000,
    oatC:15,
    surface:"Concrete",
  });
  assert.equal(extrapolated.status,"unsupported");
  assert.match(extrapolated.reason??"",/outside the published source-table envelope/i);
});

test("v3.1 M5B real published W&B values produce a valid representative takeoff and landing load",()=>{
  const result=calculateWeightBalance(realSecondAircraftWeightBalance,{
    values:{
      pilot:80,
      passenger:70,
      "rear-baggage":10,
      "wing-baggage-left":0,
      "wing-baggage-right":0,
      fuel:60,
    },
    landingFuelValue:30,
  });

  assert.equal(result.status,"ready");
  assert.deepEqual(result.issues,[]);
  assert.ok(result.takeoff);
  assert.ok(result.landing);
  assert.ok(Math.abs((result.takeoff?.massKg??0)-585.5)<1e-9);
  assert.ok(Math.abs((result.takeoff?.momentKgMm??0)-502086.2)<1e-9);
  assert.ok(Math.abs((result.takeoff?.cgMm??0)-857.534073441503)<1e-9);
  assert.equal(result.takeoff?.withinMass,true);
  assert.equal(result.takeoff?.withinCg,true);

  assert.ok(Math.abs((result.landing?.massKg??0)-563.75)<1e-9);
  assert.ok(Math.abs((result.landing?.momentKgMm??0)-488905.7)<1e-9);
  assert.ok(Math.abs((result.landing?.cgMm??0)-867.2384922394679)<1e-9);
  assert.equal(result.landing?.withinMass,true);
  assert.equal(result.landing?.withinCg,true);
});

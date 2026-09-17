import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { calculateOperationalNativeDistanceGrid } from "../lib/operational-performance-policy.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

function grid(interpolation: PerformanceDataset["interpolation"]): PerformanceDataset {
  return {
    id:"takeoff-distance-grid",
    title:"Takeoff distance",
    kind:"lookup-table",
    axes:[
      {key:"airportAltitudeFt",label:"Altitude",unit:"ft",values:[0,2000]},
      {key:"isaDeviationC",label:"ISA deviation",unit:"C",values:[0,20]},
      {key:"surface",label:"Surface",values:["Dry"]},
    ],
    outputs:[
      {key:"oatC",label:"OAT",unit:"C"},
      {key:"groundRunM",label:"Ground run",unit:"m"},
      {key:"distance50ftM",label:"50 ft distance",unit:"m"},
    ],
    interpolation,
    rows:[
      {inputs:{airportAltitudeFt:0,isaDeviationC:0,surface:"Dry"},outputs:{oatC:15,groundRunM:100,distance50ftM:180}},
      {inputs:{airportAltitudeFt:0,isaDeviationC:20,surface:"Dry"},outputs:{oatC:35,groundRunM:120,distance50ftM:210}},
      {inputs:{airportAltitudeFt:2000,isaDeviationC:0,surface:"Dry"},outputs:{oatC:11,groundRunM:130,distance50ftM:220}},
      {inputs:{airportAltitudeFt:2000,isaDeviationC:20,surface:"Dry"},outputs:{oatC:31,groundRunM:155,distance50ftM:260}},
    ],
  };
}

test("v2.8 Flight Deck fails closed between rows when the governed source does not authorize interpolation",()=>{
  const result=calculateOperationalNativeDistanceGrid(grid("none"),{airportAltitudeFt:1000,oatC:23,surface:"Dry",runwayAvailableM:800});
  assert.equal(result.status,"unsupported");
  assert.match(result.reason ?? "",/does not permit software interpolation/i);
});

test("v2.8 Flight Deck allows bounded interpolation only when the governed source explicitly authorizes it",()=>{
  const result=calculateOperationalNativeDistanceGrid(grid("linear-explicit"),{airportAltitudeFt:1000,oatC:23,surface:"Dry",runwayAvailableM:800});
  assert.equal(result.status,"ready");
  assert.equal(result.method,"bounded-linear-interpolation");
  assert.ok((result.distance50ftM ?? 0)>180 && (result.distance50ftM ?? 999)<260);
});

test("v2.8 exact source rows remain operational with interpolation disabled",()=>{
  const result=calculateOperationalNativeDistanceGrid(grid("none"),{airportAltitudeFt:0,oatC:15,surface:"Dry",runwayAvailableM:800});
  assert.equal(result.status,"ready");
  assert.equal(result.method,"exact-source-row");
  assert.equal(result.distance50ftM,180);
});

test("v2.8 operational calculation still rejects extrapolation",()=>{
  const result=calculateOperationalNativeDistanceGrid(grid("linear-explicit"),{airportAltitudeFt:5000,oatC:15,surface:"Dry"});
  assert.equal(result.status,"unsupported");
  assert.match(result.reason ?? "",/outside the published source-table envelope/i);
});

test("v2.8 globally exposes canonical legal and aviation-safety links",()=>{
  const shell=read("components/product-shell.tsx"),links=read("components/legal-links.tsx"),env=read(".env.example");
  assert.match(shell,/Supplemental training\/reference aid/);
  assert.match(shell,/approved aircraft, operator and regulatory documents remain authoritative/);
  assert.match(shell,/LegalLinks/);
  for(const path of ["privacy","terms","cookies","aviation-safety","subprocessors","report"])assert.match(links,new RegExp(path));
  assert.match(env,/NEXT_PUBLIC_FLYTALLY_LEGAL_URL=https:\/\/fly-tally\.com\/legal/);
});

test("v2.8 documents source-rights, AI human approval and no unauthorized operational interpolation",()=>{
  const docs=read("docs/compliance/V2_8_COMPLIANCE_FOUNDATION.md"),policy=read("lib/operational-performance-policy.ts");
  assert.match(docs,/human governed review\/approval is required/i);
  assert.match(docs,/Proprietary, NDA-restricted/i);
  assert.match(docs,/must not rewrite a dataset from `none` to `linear-explicit`/);
  assert.doesNotMatch(policy,/\{ \.\.\.dataset, interpolation: "linear-explicit" \}/);
  assert.match(policy,/honors the governed source dataset interpolation authority exactly/i);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { calculateOperationalNativeDistanceGrid } from "../lib/operational-performance-policy.ts";
import {
  isOperationalSourceAuthority,
  requiresOperationalSourceAuthority,
  resolveContentSourcePolicy,
  sourcePolicyAllowsAuthority,
} from "../lib/source-authority.ts";
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
  const docs=read("TECHNICAL_DOCUMENTATION.md"),policy=read("lib/operational-performance-policy.ts");
  assert.match(docs,/human governed review\/approval is required/i);
  assert.match(docs,/Proprietary, NDA-restricted/i);
  assert.match(docs,/must (?:not|never) rewrite a dataset from `none` to `linear-explicit`/);
  assert.doesNotMatch(policy,/\{ \.\.\.dataset, interpolation: "linear-explicit" \}/);
  assert.match(policy,/honors the governed source dataset interpolation authority exactly/i);
});


test("v2.8 safety-critical domains stay strict by default and widen authority only through available-sources",()=> {
  assert.equal(isOperationalSourceAuthority("CONTROLLING"),true);
  assert.equal(isOperationalSourceAuthority("OPERATING_REFERENCE"),true);
  for(const role of ["TRAINING_REFERENCE","SIMULATOR_IMPLEMENTATION","SIMULATOR_WORKFLOW","UNCLASSIFIED"]) {
    assert.equal(isOperationalSourceAuthority(role),false);
  }
  for(const domain of ["checklists","procedures","performance","weight-balance","limitations","abnormal"]) {
    assert.equal(requiresOperationalSourceAuthority(domain),true);
  }
  assert.equal(requiresOperationalSourceAuthority("knowledge"),false);
  assert.equal(requiresOperationalSourceAuthority("flows"),false);

  assert.equal(resolveContentSourcePolicy(undefined),"faa-approved");
  assert.equal(sourcePolicyAllowsAuthority("faa-approved","CONTROLLING"),true);
  assert.equal(sourcePolicyAllowsAuthority("faa-approved","OPERATING_REFERENCE"),true);
  assert.equal(sourcePolicyAllowsAuthority("faa-approved","TRAINING_REFERENCE"),false);
  assert.equal(sourcePolicyAllowsAuthority("faa-approved","SIMULATOR_WORKFLOW"),false);

  assert.equal(sourcePolicyAllowsAuthority("available-sources","TRAINING_REFERENCE"),true);
  assert.equal(sourcePolicyAllowsAuthority("available-sources","SIMULATOR_WORKFLOW"),true);
  assert.equal(sourcePolicyAllowsAuthority("available-sources","SIMULATOR_IMPLEMENTATION"),false);
  assert.equal(sourcePolicyAllowsAuthority("available-sources","UNCLASSIFIED"),false);
});

test("v2.8 Flight Deck fails closed on stale or non-authoritative operational publications",()=> {
  const fly=read("app/aircraft/[aircraftId]/fly/page.tsx");
  const gate=read("lib/operational-content-readiness.ts");
  const governance=read("lib/content-governance.ts");
  const provenance=read("lib/source-provenance-readiness.ts");

  assert.match(fly,/getOperationalFlightReadiness\(aircraftId\)/);
  assert.match(fly,/operationalReadiness\.checklists\.ready/);
  assert.match(fly,/operationalReadiness\.performance\.ready/);
  assert.match(fly,/operationalReadiness\.abnormal\.ready/);
  assert.doesNotMatch(fly,/normalizeLegacyFlightFlow|legacyChecklist/);

  assert.match(gate,/training_content_stale_flags/);
  assert.match(gate,/resolved_at IS NULL/);
  assert.match(gate,/CONTROLLING','OPERATING_REFERENCE/);
  assert.match(gate,/authoritative===linked/);
  assert.match(gate,/fails closed/i);

  assert.match(governance,/assertOperationalSourceAuthorityForVersion/);
  assert.match(governance,/requires CONTROLLING or OPERATING_REFERENCE source authority/);
  assert.match(provenance,/JOIN training_content_versions v ON v\.version_id=p\.version_id/);
  assert.match(provenance,/resolveContentSourcePolicy/);
  assert.match(provenance,/sourcePolicyAllowsAuthority/);
  assert.match(provenance,/requiresOperationalSourceAuthority/);
  assert.doesNotMatch(provenance,/BOOL_AND/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { deriveContentStudio,sourceReferenceLabel } from "../lib/admin-content-studio.ts";
import type { AdminAircraftDetail,AdminContentVersion } from "../lib/content-admin-types.ts";

const version=(id:string,versionNo:number,state:AdminContentVersion["state"],createdAt:string):AdminContentVersion=>({id,domain:"systems",contentKey:"bundle",versionNo,state,origin:"human",createdBy:"admin",createdAt});

const aircraft:AdminAircraftDetail={
  id:"sample",manufacturer:"Example",model:"One",displayName:"Example One",status:"published",variants:[],manualRevisionCount:2,contentItemCount:1,staleCount:0,
  manuals:[
    {manualId:"family-a",revisionId:"revision-2",title:"Aircraft Flight Manual",publisher:"OEM",revision:"2",issueDate:"2026-08-01",sourceKind:"AFM",authorityRole:"CONTROLLING"},
    {manualId:"family-a",revisionId:"revision-1",title:"Aircraft Flight Manual",publisher:"OEM",revision:"1",issueDate:"2025-08-01",sourceKind:"AFM",authorityRole:"CONTROLLING"},
  ],
  sourceReferences:[{id:"reference-secret-id",revisionId:"revision-2",chapter:"3",section:"Electrical",pageLabel:"3-12",note:"Generator limits"}],
  contentVersions:[version("published-id",1,"published","2026-08-10T00:00:00.000Z"),version("draft-id",2,"draft","2026-09-11T00:00:00.000Z")],
};

test("Content Studio groups immutable revisions into a human-readable source family",()=>{
  const studio=deriveContentStudio(aircraft);
  assert.equal(studio.sourceFamilies.length,1);
  assert.equal(studio.sourceFamilies[0].title,"Aircraft Flight Manual");
  assert.deepEqual(studio.sourceFamilies[0].revisions.map(item=>item.revision),["2","1"]);
  assert.equal(studio.references[0].label,"Aircraft Flight Manual · rev 2 · Ch. 3 · Electrical · p. 3-12");
});

test("Content Studio keeps the live release distinct from a newer pending draft",()=>{
  const studio=deriveContentStudio(aircraft);
  assert.equal(studio.modules.length,1);
  assert.equal(studio.modules[0].live?.id,"published-id");
  assert.equal(studio.modules[0].pending?.id,"draft-id");
  assert.equal(studio.modules[0].latest.id,"draft-id");
  assert.equal(studio.liveModuleCount,1);
  assert.equal(studio.pendingModuleCount,1);
});

test("source labels expose manual context rather than internal reference ids",()=>{
  const label=sourceReferenceLabel(aircraft.sourceReferences[0],aircraft.manuals);
  assert.match(label,/Aircraft Flight Manual/);assert.match(label,/rev 2/);assert.match(label,/p\. 3-12/);assert.doesNotMatch(label,/reference-secret-id/);
});

test("normal M29 admin actions generate revision ids and accept source checkboxes",()=>{
  const actions=fs.readFileSync(new URL("../app/admin/actions.ts",import.meta.url),"utf8");
  assert.match(actions,/revisionId:randomUUID\(\)/);assert.match(actions,/selected\(form,"sourceReferenceId"\)/);assert.match(actions,/requestedManualId\|\|randomUUID\(\)/);
});

test("split admin workspace keeps internal source ids out of normal UI",()=>{
  const sources=fs.readFileSync(new URL("../app/admin/aircraft/[aircraftId]/sources/page.tsx",import.meta.url),"utf8");
  const composer=fs.readFileSync(new URL("../app/admin/aircraft/[aircraftId]/content/new/page.tsx",import.meta.url),"utf8");
  const settings=fs.readFileSync(new URL("../app/admin/aircraft/[aircraftId]/settings/page.tsx",import.meta.url),"utf8");
  assert.doesNotMatch(sources,/placeholder="Source family ID"|placeholder="Revision ID"|Source reference IDs, comma-separated/);
  assert.match(composer,/name="sourceReferenceId"/);
  assert.match(settings,/Advanced tools/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const shell=read("components/admin-aircraft-workspace.tsx");
const overview=read("app/admin/aircraft/[aircraftId]/page.tsx");
const content=read("app/admin/aircraft/[aircraftId]/content/page.tsx");
const sources=read("app/admin/aircraft/[aircraftId]/sources/page.tsx");
const review=read("app/admin/aircraft/[aircraftId]/review/page.tsx");
const settings=read("app/admin/aircraft/[aircraftId]/settings/page.tsx");
const version=read("app/admin/aircraft/[aircraftId]/content/[versionId]/page.tsx");
const admin=read("app/admin/page.tsx");

test("M34 gives every aircraft a task-oriented workspace navigation",()=>{
  for(const label of ["Overview","Content","Sources","Review","Settings"])assert.match(shell,new RegExp(`label:\"${label}\"`));
  assert.match(shell,/Work here by task, not by database object/);
});

test("aircraft overview is a dashboard instead of the old all-in-one editor",()=>{
  assert.match(overview,/What needs attention\?/);assert.match(overview,/Continue working/);assert.match(overview,/Current modules/);
  assert.doesNotMatch(overview,/SourceFingerprintInput|registerRevisionAction|createAiDraftAction|Create raw governed JSON draft|Migration and raw payload tools/);
});

test("normal work is split into focused Content, Sources and Review pages",()=>{
  assert.match(content,/Training modules/);assert.match(content,/New content/);assert.match(content,/AI-assisted draft/);
  assert.match(sources,/Source records & references/);assert.match(sources,/SourceFingerprintInput/);assert.match(sources,/Add reference/);
  assert.match(review,/Work queue/);assert.match(review,/Drafts & approvals/);assert.match(review,/Source changes/);
});

test("advanced and rarely used controls are isolated in Settings",()=>{
  assert.match(settings,/Aircraft setup/);assert.match(settings,/Advanced tools/);assert.match(settings,/Create raw JSON draft/);assert.match(settings,/Aircraft variants|Variants/);
  assert.doesNotMatch(content,/Create raw JSON draft|publishNativeModuleUpgradeAction/);
  assert.doesNotMatch(sources,/createDraftAction|publishNativeModuleUpgradeAction/);
});

test("content review leads with human status and hides evidence details progressively",()=>{
  assert.match(version,/Validation passed/);assert.match(version,/Create the next draft/);assert.match(version,/Evidence & audit details/);assert.match(version,/Advanced provenance tools/);
  assert.doesNotMatch(version,/M32 · Structured edit|Release gate|Review content version/);
});

test("top-level administration hides migration controls under Platform tools",()=>{
  assert.match(admin,/<summary>Platform tools<\/summary>/);assert.match(admin,/Open workspace/);assert.match(admin,/New aircraft/);
});

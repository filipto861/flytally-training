import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const builder=fs.readFileSync(new URL("../components/structured-content-builder.tsx",import.meta.url),"utf8");
const reviewPage=fs.readFileSync(new URL("../app/admin/aircraft/[aircraftId]/content/[versionId]/page.tsx",import.meta.url),"utf8");
const actions=fs.readFileSync(new URL("../app/admin/actions.ts",import.meta.url),"utf8");
const scope=fs.readFileSync(new URL("../M32_STRUCTURED_CONTENT_BUILDER.md",import.meta.url),"utf8");

test("normal content review uses the structured builder instead of a raw JSON textarea",()=>{
  assert.match(reviewPage,/StructuredContentBuilder/);assert.match(reviewPage,/Create the next draft/);assert.match(reviewPage,/action=\{reviseVersionAction\}/);assert.doesNotMatch(reviewPage,/Edit raw payload JSON/);assert.doesNotMatch(reviewPage,/name="payload"[^>]*defaultValue=\{JSON\.stringify/);
});

test("structured builder submits one serialized governed payload and validates against the publication contract",()=>{
  assert.match(builder,/validateContentPayload\(domain,payload,aircraftId\)/);assert.match(builder,/name="payload"/);assert.match(builder,/JSON\.stringify\(payload\)/);assert.match(builder,/Contract valid/);assert.match(builder,/Advanced raw JSON escape hatch/);assert.match(builder,/Apply JSON to builder/);assert.doesNotMatch(builder,/fetch\(|\/api\/|sql`|@\/lib\/db|createGovernedDraftVersion/);
});

test("builder supports structured collection maintenance without aircraft-specific branches",()=>{
  for(const behavior of ["Add blank item","Duplicate","Move up","Move down","Remove"])assert.match(builder,new RegExp(behavior));
  assert.match(builder,/emptyArrayPrototype/);assert.match(builder,/manualOptions/);assert.match(builder,/linear-explicit/);assert.doesNotMatch(builder,/learjet|cessna|boeing|airbus/i);
});

test("governed server action remains the authoritative immutable-draft boundary",()=>{
  assert.match(actions,/reviseContentVersion/);assert.match(actions,/reviseVersionAction/);assert.match(actions,/payload:payload\(form\)/);assert.match(actions,/sourceReferenceIds:refs\(form\)/);assert.match(scope,/new immutable human draft/);assert.match(scope,/Server-side governance remains authoritative/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root=path.resolve(import.meta.dirname,"..");
const read=(file:string)=>fs.readFileSync(path.join(root,file),"utf8");

test("v3.2 Training defines canonical spacing and async interaction tokens",()=>{
  const css=read("app/ui-system.css");
  for(const token of ["--ui-space-2","--ui-space-3","--ui-space-4","--ui-space-6","--ui-card-gap","--ui-section-gap"])assert.match(css,new RegExp(token));
  assert.match(css,/data-loading="true"/);
  assert.match(css,/form\[aria-busy="true"\]/);
  assert.match(css,/pointer-events:none/);
});

test("v3.2 Training pending action button prevents duplicate submissions",()=>{
  const source=read("components/pending-action-button.tsx");
  assert.match(source,/useFormStatus/);
  assert.match(source,/disabled=\{blocked\}/);
  assert.match(source,/aria-busy=\{pending\|\|undefined\}/);
  assert.match(source,/pendingLabel/);
});

test("v3.2 Training loads the canonical UI system last",()=>{
  const layout=read("app/layout.tsx");
  assert.ok(layout.indexOf('import "./ui-system.css"')>layout.indexOf('import "./v300-u6-acceptance.css"'));
});

test("v3.2 Training applies pending feedback to administrator mutations",()=>{
  const admin=read("app/admin/page.tsx");
  const content=read("app/admin/aircraft/[aircraftId]/content/page.tsx");
  const review=read("app/admin/aircraft/[aircraftId]/review/page.tsx");
  assert.match(admin,/pendingLabel="Creating…"/);
  assert.match(admin,/pendingLabel="Initializing…"/);
  assert.match(admin,/pendingLabel="Publishing…"/);
  assert.match(content,/pendingLabel="Generating…"/);
  assert.match(review,/pendingLabel="Resolving…"/);
});

test("v3.2 learner layout consumes the shared spacing scale",()=>{
  const css=read("app/learner-shell.css");
  assert.match(css,/var\(--ui-space-6\)/);
  assert.match(css,/var\(--ui-space-3\)/);
  assert.match(css,/var\(--ui-space-4\)/);
});

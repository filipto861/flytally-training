import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root=path.resolve(import.meta.dirname,"..");
const read=(file:string)=>fs.readFileSync(path.join(root,file),"utf8");

test("v3.0 U1 keeps aircraft selection ahead of optional PWA installation",()=>{
  const home=read("app/page.tsx");
  const aircraft=home.indexOf('className="pilot-aircraft-list"');
  const install=home.indexOf("<PwaInstallCard />");
  assert.ok(aircraft>=0);
  assert.ok(install>aircraft);
});

test("v3.0 preserves the focused Training task model instead of rebuilding navigation",()=>{
  const nav=read("components/aircraft-workspace-nav.tsx");
  for(const label of ["Home","Fly","Learn","Reference"])assert.ok(nav.includes(`label: "${label}"`));
  assert.doesNotMatch(nav,/multi-aircraft|billing|compliance/i);
});

test("v3.0 roadmap puts learner UX consolidation before multi-aircraft scale",()=>{
  const roadmap=read("ROADMAP.md");
  assert.match(roadmap,/v3\.0 — UX & Product Consolidation — current/);
  assert.match(roadmap,/v3\.1 — Multi-aircraft product scale/);
  assert.match(roadmap,/Home \/ Fly \/ Learn \/ Reference/);
});

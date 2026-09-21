import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root=path.resolve(import.meta.dirname,"..");
const read=(file:string)=>fs.readFileSync(path.join(root,file),"utf8");

test("v3.2 U3 Training browser smoke is selective and pinned",()=>{
  const workflow=read(".github/workflows/browser-smoke.yml");
  const packageJson=JSON.parse(read("package.json")) as {
    devDependencies?:Record<string,string>;
  };
  assert.match(workflow,/pull_request:/);
  assert.match(workflow,/paths:/);
  assert.match(workflow,/schedule:/);
  assert.match(workflow,/npm ci --no-audit --no-fund/);
  assert.equal(packageJson.devDependencies?.["@playwright/test"],"1.55.0");
  assert.doesNotMatch(workflow,/npm install --no-save[^\n]*@playwright\/test/);
  assert.match(workflow,/playwright install --with-deps chromium webkit/);
  assert.match(workflow,/Desktop \+ mobile Chromium \+ iPad WebKit/);
});

test("v3.2 U3 Training runs desktop and mobile Chromium projects",()=>{
  const config=read("playwright.config.mjs");
  assert.match(config,/Desktop Chrome/);
  assert.match(config,/Pixel 7/);
  assert.match(config,/webServer/);
  assert.match(config,/npm start/);
});

test("v3.2 U3 Training verifies responsive library, keyboard skip and account boundary",()=>{
  const smoke=read("e2e/public-shell.spec.mjs");
  assert.match(smoke,/Your aircraft/);
  assert.match(smoke,/Browser CI Aircraft/);
  assert.doesNotMatch(smoke,/test[.]skip\(count===0/);
  assert.match(smoke,/Skip to content/);
  assert.match(smoke,/Sign in/);
  assert.match(smoke,/document[.]documentElement[.]scrollWidth/);
  assert.match(smoke,/document[.]documentElement[.]clientWidth/);
  assert.match(read("app/page.tsx"),/pilot-library-empty/);
  assert.match(read("app/navigation.css"),/min-height:var\(--ui-touch-min-height\)/);
});

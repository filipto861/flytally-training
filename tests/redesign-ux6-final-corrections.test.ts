import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("UX6.9 correction keeps iPad landscape Procedures on the compact control path",()=>{
  const css=read("components/ft-procedures/ft-procedures.module.css");
  const capture=read("scripts/capture-ux6-visuals.mjs");

  assert.match(css,/@media \(max-width: 1180px\), \(hover: none\), \(pointer: coarse\)/);
  assert.match(css,/\.desktopIndex\s*\{[\s\S]*display:\s*none/);
  assert.match(css,/\.mobileControls\s*\{[\s\S]*display:\s*grid/);

  assert.match(capture,/ipadUserAgent/);
  assert.match(capture,/width: 1112/);
  assert.match(capture,/deviceScaleFactor: 2/);
  assert.match(capture,/userAgent: ipadUserAgent/);
});

test("UX6.9 correction removes auth-link prefetch instead of widening CSP",()=>{
  const account=read("components/account-actions.tsx");
  const nextConfig=read("next.config.ts");

  assert.match(
    account,
    /href="\/api\/auth\/flytally\/start\?next=\/" prefetch=\{false\}/,
  );
  assert.match(nextConfig,/"connect-src 'self'"/);
  assert.doesNotMatch(nextConfig,/connect-src[^\n]*fly-tally\.com/);
});

test("UX6.9 capture supports a local authenticated state without committing credentials",()=>{
  const capture=read("scripts/capture-ux6-visuals.mjs");
  const auth=read("scripts/capture-ux6-auth-state.mjs");
  const ignore=read(".gitignore");
  const pkg=JSON.parse(read("package.json")) as { scripts: Record<string,string> };

  assert.match(capture,/UX6_STORAGE_STATE/);
  assert.match(capture,/storageState: storageStatePath/);
  assert.match(capture,/authenticatedCapture: Boolean\(storageStatePath\)/);
  assert.match(auth,/chromium\.launch\(\{ headless: false \}\)/);
  assert.match(auth,/context\.storageState\(\{ path: statePath \}\)/);
  assert.match(auth,/Active Flight/);
  assert.match(ignore,/^ux6-auth-state\.json$/m);
  assert.equal(pkg.scripts["capture:ux6:auth-state"],"node scripts/capture-ux6-auth-state.mjs");
});


test("UX6.9 authenticated capture calculates Performance before visual evidence",()=>{
  const capture=read("scripts/capture-ux6-visuals.mjs");

  assert.match(capture,/storageStatePath && routeName === "performance"/);
  assert.match(capture,/input\[name="pressureAltitude"\]/);
  assert.match(capture,/input\[name="oat"\]/);
  assert.match(capture,/fill\("0"\)/);
  assert.match(capture,/fill\("15"\)/);
  assert.match(capture,/data-ft-performance-strip="true"/);
  assert.match(capture,/performanceCalculated = true/);
  assert.match(capture,/performanceCalculated,/);
});

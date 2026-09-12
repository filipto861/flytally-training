import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const manifest=read("app/manifest.ts");
const layout=read("app/layout.tsx");
const iconRoute=read("app/pwa-icon/route.ts");
const shell=read("components/product-shell.tsx");
const installer=read("components/pwa-install-card.tsx");
const home=read("app/page.tsx");
const serviceWorker=read("app/sw.js/route.ts");
const mobile=read("app/mobile-app.css");
const fly=read("app/aircraft/[aircraftId]/fly/page.tsx");

test("M58 exposes a standalone app identity with same-origin icon assets",()=>{
  assert.match(manifest,/id:\s*"\/"/);
  assert.match(manifest,/scope:\s*"\/"/);
  assert.match(manifest,/display:\s*"standalone"/);
  assert.match(manifest,/src:\s*"\/pwa-icon"/);
  assert.match(manifest,/type:\s*"image\/png"/);
  assert.match(layout,/appleWebApp:\s*\{/);
  assert.match(layout,/apple:\s*"\/pwa-icon"/);
  assert.match(shell,/FLYTALLY_MARK\s*=\s*"\/pwa-icon"/);
  assert.doesNotMatch([layout,shell].join("\n"),/https:\/\/fly-tally\.com\/logbook_icon_32\.png/);
});

test("M58 proxies the canonical FlyTally mark through a cacheable same-origin route",()=>{
  assert.match(iconRoute,/https:\/\/fly-tally\.com\/logbook_icon\.png/);
  assert.match(iconRoute,/arrayBuffer\(\)/);
  assert.match(iconRoute,/Content-Type/);
  assert.match(iconRoute,/image\/png/);
  assert.match(iconRoute,/stale-while-revalidate/);
});

test("M58 offers install only from the mobile aircraft library and handles iOS explicitly",()=>{
  assert.match(installer,/beforeinstallprompt/);
  assert.match(installer,/display-mode: standalone/);
  assert.match(installer,/navigator as Navigator & \{ standalone\?: boolean \}/);
  assert.match(installer,/appinstalled/);
  assert.match(installer,/flytally:pwa-install-dismissed:v1/);
  assert.match(installer,/In Safari, tap Share, then Add to Home Screen\./);
  assert.match(home,/import \{ PwaInstallCard \}/);
  assert.match(home,/<PwaInstallCard \/>/);
  assert.doesNotMatch(fly,/PwaInstallCard/);
  assert.match(mobile,/\.pwa-install-actions button\{[\s\S]*min-height:44px/);
});

test("M58 precaches PWA support assets without widening the authenticated Fly offline boundary",()=>{
  assert.match(serviceWorker,/SHELL_CACHE\s*=\s*"flytally-shell-v1"/);
  assert.match(serviceWorker,/SHELL_ASSETS\s*=\s*\["\/manifest\.webmanifest", "\/pwa-icon"\]/);
  assert.match(serviceWorker,/Promise\.allSettled/);
  assert.match(serviceWorker,/cache\.match\(url\.pathname\)/);
  assert.doesNotMatch(serviceWorker,/ignoreSearch:\s*true/);
  assert.match(serviceWorker,/CACHE_FLIGHT_PAGE/);
  assert.match(serviceWorker,/FLIGHT_PATH/);
  assert.match(serviceWorker,/request\.mode === "navigate" && FLIGHT_PATH\.test\(url\.pathname\)/);
  assert.doesNotMatch(serviceWorker,/request\.mode === "navigate" && !FLIGHT_PATH/);
});

test("M58 remains aircraft agnostic and does not alter operational calculations",()=>{
  const source=[manifest,layout,iconRoute,shell,installer,home,serviceWorker,mobile].join("\n");
  assert.doesNotMatch(source,/bristell|learjet|sn809|OK-EUI/i);
  assert.doesNotMatch(source,/takeoff-distance-grid|landing-distance-grid|rotax|kw-21/i);
});

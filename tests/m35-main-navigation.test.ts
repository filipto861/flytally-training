import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const nav=fs.readFileSync(new URL("../components/aircraft-workspace-nav.tsx",import.meta.url),"utf8");
const variant=fs.readFileSync(new URL("../components/aircraft-variant-selector.tsx",import.meta.url),"utf8");
const productShell=fs.readFileSync(new URL("../components/product-shell.tsx",import.meta.url),"utf8");
const navigationCss=fs.readFileSync(new URL("../app/navigation.css",import.meta.url),"utf8");

test("M35 separation survives the focused contextual navigator",()=>{
  assert.match(nav,/Aircraft training navigation/);
  assert.match(nav,/renderGroup\("fly", "FLY", flyLinks\)/);
  assert.match(nav,/renderGroup\("learn", "LEARN", learn\)/);
  assert.doesNotMatch(nav,/workspace-nav-primary|workspace-nav-secondary|contextualSections|topLinks/);
});

test("learner navigation exposes home progress and published direct module links",()=>{
  assert.match(nav,/>Home<\/Link>/);
  assert.match(nav,/>Progress<\/Link>/);
  assert.match(nav,/aria-current=\{entry\.key === active \? "page" : undefined\}/);
  assert.match(nav,/quick-reference/);
  assert.match(nav,/listPublishedModuleDomains/);
});

test("aircraft configuration remains a compact navigation control",()=>{
  assert.match(variant,/<label className=\{styles\.selector\}/);
  assert.match(variant,/>Configuration<\/span>/);
  assert.doesNotMatch(variant,/Aircraft configuration<\/p>|equipment\/modification tag|Variant-specific content is active/);
});

test("global header is one compact row and keeps the aircraft entry point",()=>{
  assert.match(productShell,/>Aircraft<\/Link>/);
  assert.match(navigationCss,/grid-template-columns:auto minmax\(0,1fr\) auto/);
  assert.match(navigationCss,/@media\(max-width:760px\)/);
  const account=fs.readFileSync(new URL("../components/account-actions.tsx",import.meta.url),"utf8");
  assert.doesNotMatch(account,/FlyTally account/);
});

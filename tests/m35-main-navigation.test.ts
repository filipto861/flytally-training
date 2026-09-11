import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const nav=fs.readFileSync(new URL("../components/aircraft-workspace-nav.tsx",import.meta.url),"utf8");
const variant=fs.readFileSync(new URL("../components/aircraft-variant-selector.tsx",import.meta.url),"utf8");
const productShell=fs.readFileSync(new URL("../components/product-shell.tsx",import.meta.url),"utf8");
const navigationCss=fs.readFileSync(new URL("../app/navigation.css",import.meta.url),"utf8");

test("M35 replaces stacked FLY/LEARN menus with one persistent grouped navigator",()=>{
  assert.match(nav,/Aircraft training navigation/);
  assert.match(nav,/renderGroup\("fly", "FLY", "Cockpit tools"/);
  assert.match(nav,/renderGroup\("learn", "LEARN", "Study & practice"/);
  assert.doesNotMatch(nav,/workspace-nav-primary|workspace-nav-secondary|contextualSections|topLinks/);
});

test("learner navigation exposes overview progress and direct active module links",()=>{
  assert.match(nav,/>Overview<\/Link>/);
  assert.match(nav,/>Progress<\/Link>/);
  assert.match(nav,/aria-current=\{entry\.key === active \? "page" : undefined\}/);
  assert.match(nav,/quick-reference/);
  assert.match(nav,/listPublishedModuleDomains/);
});

test("aircraft configuration is a compact navigation control rather than a third content panel",()=>{
  assert.match(variant,/<label className=\{styles\.selector\}/);
  assert.match(variant,/>Configuration<\/span>/);
  assert.doesNotMatch(variant,/Aircraft configuration<\/p>|equipment\/modification tag|Variant-specific content is active/);
});

test("global header keeps Aircraft library visible and removes account status clutter",()=>{
  assert.match(productShell,/Aircraft library/);
  assert.doesNotMatch(productShell,/global-nav[^]*Aircraft<\/Link>/);
  assert.match(navigationCss,/@media\(max-width:760px\)[^{]*\{[^]*\.global-nav\{display:flex/);
  const account=fs.readFileSync(new URL("../components/account-actions.tsx",import.meta.url),"utf8");
  assert.doesNotMatch(account,/FlyTally account/);
});

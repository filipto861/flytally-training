import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const nav=fs.readFileSync(new URL("../components/aircraft-workspace-nav.tsx",import.meta.url),"utf8");
const variant=fs.readFileSync(new URL("../components/aircraft-variant-selector.tsx",import.meta.url),"utf8");
const productShell=fs.readFileSync(new URL("../components/product-shell.tsx",import.meta.url),"utf8");
const navigationCss=fs.readFileSync(new URL("../app/navigation.css",import.meta.url),"utf8");

test("M35 learner navigation remains one publication-driven navigation surface",()=>{
  assert.match(nav,/Aircraft training navigation/);
  assert.match(nav,/listPublishedModuleDomains/);
  assert.match(nav,/aircraftWorkspaceSections\(aircraftId, publishedDomains\)/);
  assert.doesNotMatch(nav,/workspace-nav-primary|workspace-nav-secondary|contextualSections|topLinks/);
});

test("pilot navigation exposes home task areas and progress without exposing domain clutter globally",()=>{
  assert.match(nav,/>Home<\/Link>/);
  assert.match(nav,/label: "Training"/);
  assert.match(nav,/label: "Checklists"/);
  assert.match(nav,/label: "Reference"/);
  assert.match(nav,/className=\{styles\.progressLink\}/);
  assert.match(nav,/quick-reference/);
  assert.doesNotMatch(nav,/"FLY"|"LEARN"/);
});

test("aircraft variant remains a compact utility instead of a primary navigation choice",()=>{
  assert.match(variant,/<label className=\{styles\.selector\}/);
  assert.match(variant,/>Variant<\/span>/);
  assert.match(variant,/Common \/ all/);
  assert.doesNotMatch(variant,/equipment\/modification tag|Variant-specific content is active/);
});

test("global header keeps only product identity and account actions",()=>{
  assert.doesNotMatch(productShell,/global-nav/);
  assert.match(productShell,/FlyTally/);
  assert.match(navigationCss,/grid-template-columns:auto 1fr auto/);
  assert.match(navigationCss,/\.account-actions\{grid-column:3\}/);
  const account=fs.readFileSync(new URL("../components/account-actions.tsx",import.meta.url),"utf8");
  assert.doesNotMatch(account,/FlyTally account/);
});

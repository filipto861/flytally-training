import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read=(path:string)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const brand=read("app/flytally-brand.css");
const layout=read("app/layout.tsx");
const navigation=read("app/navigation.css");
const shell=read("components/product-shell.tsx");

test("M51 uses the canonical FlyTally mark with a visible Training lockup",()=>{
  assert.match(shell,/https:\/\/fly-tally\.com\/logbook_icon_32\.png/);
  assert.match(shell,/<small>Training<\/small>\s*<strong>FlyTally<\/strong>/);
  assert.match(brand,/\.brand-mark img\{/);
  assert.match(layout,/icons:[\s\S]*fly-tally\.com\/logbook_icon_32\.png/);
});

test("the FlyTally wordmark stays visible on narrow mobile screens",()=>{
  assert.match(navigation,/@media\(max-width:420px\)[\s\S]*\.brand>span:last-child\{display:none\}/);
  assert.match(brand,/@media\(max-width:420px\)[\s\S]*\.brand-copy,\.brand>span:last-child\{display:grid!important\}/);
  assert.match(brand,/@media\(max-width:420px\)[\s\S]*\.brand small\{display:block!important/);
});

test("brand override loads after legacy navigation and release styles",()=>{
  const releaseIndex=layout.indexOf('import "./release.css"');
  const navigationIndex=layout.indexOf('import "./navigation.css"');
  const brandIndex=layout.indexOf('import "./flytally-brand.css"');
  assert.ok(releaseIndex>=0 && navigationIndex>releaseIndex && brandIndex>navigationIndex);
});

test("M51 keeps the shared Logbook visual tokens and compact mobile header",()=>{
  assert.match(brand,/--accent:#0b946e/);
  assert.match(brand,/--text:#102033/);
  assert.match(brand,/@media\(max-width:760px\)[\s\S]*\.app-header-inner\{min-height:60px/);
  assert.match(brand,/\.header-action\{border-color:#102033;background:#102033/);
});
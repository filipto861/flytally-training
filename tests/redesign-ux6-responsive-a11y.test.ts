import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("UX6.8 compact rail exposes full accessible destination names",()=>{
  const nav=read("components/ft-shell/FtSideNav.tsx");
  assert.match(nav,/aria-label=\{destination\.label\}/);
  assert.match(nav,/destination\.shortLabel/);
});

test("UX6.8 aircraft profile is explicitly labelled for assistive technology",()=>{
  const top=read("components/ft-shell/FtTopBar.tsx");
  assert.match(top,/aria-label=\{"Aircraft profile: " \+ resolvedProfileLabel\}/);
  assert.match(top,/workspaceProjection\?\.profileLabel/);
});

test("UX6.8 Procedures uses the compact control path on touch layouts",()=>{
  const css=read("components/ft-procedures/ft-procedures.module.css");
  assert.match(css,/@media \(max-width: 1180px\), \(hover: none\), \(pointer: coarse\)/);
  assert.match(css,/\.desktopIndex\s*\{[\s\S]*display:\s*none/);
  assert.match(css,/\.mobileControls\s*\{[\s\S]*display:\s*grid/);
  assert.match(css,/color:\s*var\(--ft-accent-contrast\)/);
});

test("UX6.8 browser acceptance covers overflow, touch targets and compact procedure controls",()=>{
  const e2e=read("e2e/shell/aircraft-shell.spec.ts");
  assert.match(e2e,/P1\.1 compact rail exposes mode-specific accessible destination names/);
  assert.match(e2e,/UX6\.8 touch Procedures exposes compact selector controls/);
  assert.match(e2e,/UX6\.8 primary touch shell controls meet the 44px boundary/);
  assert.match(e2e,/\$\{aircraftPath\}\/flight/);
  assert.match(e2e,/\$\{aircraftPath\}\/systems/);
});

test("UX6.8 preserves shell overlay focus-return and forced-colors contracts",()=>{
  const drawer=read("components/ft-shell/FtNavDrawer.tsx");
  const search=read("components/ft-search/FtSearchOverlay.tsx");
  const fast=read("components/ft-fast-path/FtFastPathPanel.tsx");
  const shellCss=read("components/ft-shell/ft-shell.module.css");

  assert.match(drawer,/triggerRef\.current\?\.focus/);
  assert.match(search,/triggerRef\.current\?\.focus/);
  assert.match(fast,/returnFocusRef\.current\?\.focus/);
  assert.match(shellCss,/forced-colors:\s*active/);
  assert.match(shellCss,/prefers-reduced-motion:\s*reduce/);
  assert.match(shellCss,/safe-area-inset-bottom/);
});

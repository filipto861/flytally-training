import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("UX6.4 production shell uses the approved compact rail and context bar tokens",()=>{
  const css=read("components/ft-shell/ft-shell.module.css");
  const tokens=read("app/ft-workspace/tokens.css");

  assert.match(tokens,/--ft-shell-rail-width:\s*72px/);
  assert.match(tokens,/--ft-shell-topbar-height:\s*64px/);
  assert.match(tokens,/--ft-shell-content-max:\s*1540px/);

  assert.match(css,/grid-template-columns:\s*var\(--ft-shell-rail-width\) minmax\(0, 1fr\)/);
  assert.match(css,/\.topBar\s*\{[\s\S]*var\(--ft-shell-topbar-height\)/);
  assert.match(css,/\.sideNavIcon/);
});

test("UX6.4 widens the real aircraft workspace without changing page ownership",()=>{
  const css=read("components/ft-shell/ft-shell.module.css");
  const shell=read("components/ft-shell/FtShell.tsx");

  assert.match(css,/\.content\s*>\s*:global\(\*\)[\s\S]*var\(--ft-shell-content-max\)/);
  assert.match(shell,/<FtSideNav aircraftId=\{aircraftId\} \/>/);
  assert.match(shell,/<FtTopBar/);
  assert.doesNotMatch(shell,/learjet|FC-530|flysimware/i);
});

test("P1.1 production shell exposes Learn/EFB destinations and preserves four EFB fast-path actions",()=>{
  const modes=read("lib/aircraft-product-mode.ts");
  const nav=read("components/ft-shell/navigation.ts");

  for(const label of ["Learn","Systems","Procedures","Limitations","Reference","Flight Brief","Performance","Flight Deck"]){
    assert.match(modes,new RegExp(`label: "${label}"`));
  }
  for(const label of ["CHECKLIST","QRH","PERF","REF"]){
    assert.match(nav,new RegExp(`label: "${label}"`));
  }
});

test("UX6.4 shell remains responsive, safe-area aware and accessible",()=>{
  const css=read("components/ft-shell/ft-shell.module.css");
  const drawer=read("components/ft-shell/FtNavDrawer.tsx");

  assert.match(css,/@media \(max-width: 1180px\), \(hover: none\)/);
  assert.match(css,/safe-area-inset-bottom/);
  assert.match(css,/focus-visible/);
  assert.match(css,/forced-colors:\s*active/);
  assert.match(css,/prefers-reduced-motion:\s*reduce/);

  assert.match(drawer,/role="dialog"/);
  assert.match(drawer,/aria-modal="true"/);
  assert.match(drawer,/triggerRef\.current\?\.focus/);
});

test("UX6.4 theme keeps source safety semantics separate from the new interaction accent",()=>{
  const theme=read("app/ft-workspace/theme.css");

  assert.match(theme,/--ft-accent:\s*#2F6BFF/);
  assert.match(theme,/--ft-accent:\s*#5B8CFF/);
  assert.match(theme,/--ft-source-warning:/);
  assert.match(theme,/--ft-source-caution:/);
  assert.match(theme,/--ft-source-note:/);
  assert.doesNotMatch(theme,/--ft-state-error\s*:/);
});

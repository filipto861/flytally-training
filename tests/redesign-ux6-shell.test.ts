import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("UX6.4 mounts the compact rail outside the page workspace", () => {
  const shell = read("components/ft-shell/FtShell.tsx");
  const css = read("components/ft-shell/ft-shell.module.css");

  assert.match(shell, /<FtSideNav aircraftId=\{aircraftId\} \/>[\s\S]*<FtTopBar/);
  assert.match(css, /grid-template-columns:\s*var\(--ft-shell-rail-width\)/);
  assert.match(css, /grid-row:\s*1 \/ -1/);
  assert.match(css, /height:\s*100dvh/);
});

test("UX6.4 top bar has one aircraft context hierarchy", () => {
  const top = read("components/ft-shell/FtTopBar.tsx");

  assert.match(top, /aircraftEyebrow/);
  assert.match(top, /Training profile:/);
  assert.match(top, /No active flight/);
  assert.doesNotMatch(top, /ACTIVE FLIGHT . NONE/);
});

test("UX6.4 exposes UX6 theme roles without removing frozen source semantics", () => {
  const theme = read("app/ft-workspace/theme.css");

  for (const token of [
    "--ft-accent-primary",
    "--ft-accent-hover",
    "--ft-accent-soft",
    "--ft-focus-color",
    "--ft-source-warning",
    "--ft-source-caution",
    "--ft-source-note",
  ]) {
    assert.match(theme, new RegExp(token));
  }
});

test("UX6.4 removes the rejected narrow desktop content constraint", () => {
  const css = read("components/ft-shell/ft-shell.module.css");

  assert.match(css, /var\(--ft-shell-content-max\)/);
  assert.doesNotMatch(css, /calc\(var\(--ft-space-7\) \* 26\)/);
});

test("UX6.4 mobile shell keeps one-row context and edge-attached fast path", () => {
  const css = read("components/ft-shell/ft-shell.module.css");

  assert.match(css, /@media \(max-width: 48rem\)/);
  assert.match(css, /\.profile,[\s\S]*\.flightPlaceholder,[\s\S]*display:\s*none/);
  assert.match(css, /\.fastPathRail\s*\{[\s\S]*inset-inline:\s*0[\s\S]*border-radius:\s*0/);
});

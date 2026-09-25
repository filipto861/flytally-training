import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("production theme retains the core UX6 surface tokens", () => {
  const theme = read("app/ft-workspace/theme.css");
  for (const token of [
    "--ft-bg-shell",
    "--ft-bg-workspace",
    "--ft-bg-panel",
    "--ft-accent",
  ]) {
    assert.match(theme, new RegExp(token));
  }
  assert.match(theme, /prefers-color-scheme|data-theme|\.dark/i);
});

test("current technical documentation keeps source safety semantics separate from interaction state", () => {
  const doc = read("TECHNICAL_DOCUMENTATION.md");
  assert.match(doc, /source\/safety semantic states remain visually distinct from interaction accent/i);
  assert.match(doc, /loading actions must expose disabled\/busy feedback/i);
});

test("UX6.2 specimen demonstrates the approved shell direction without altering production shell", () => {
  const page = read("app/ux6-preview/page.tsx");
  const css = read("app/ux6-preview/ux6-preview.module.css");
  const shell = read("components/ft-shell/FtShell.tsx");

  assert.match(page, /data-ux6-preview="true"/);
  assert.match(page, /Learjet 35A/);
  assert.match(page, /Before Start/);
  assert.match(page, /CHECKLIST/);
  assert.match(page, /QRH/);
  assert.match(css, /grid-template-columns:\s*72px/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.doesNotMatch(shell, /ux6-preview/i);
});

test("UX6.2 preserves accessibility primitives in the specimen", () => {
  const css = read("app/ux6-preview/ux6-preview.module.css");
  const page = read("app/ux6-preview/page.tsx");

  assert.match(css, /44px/);
  assert.match(css, /focus-visible/);
  assert.match(css, /forced-colors: active/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(page, /aria-current/);
  assert.match(page, /aria-label/);
});

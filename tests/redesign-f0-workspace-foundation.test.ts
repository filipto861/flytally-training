import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test("F0 scopes frozen workspace tokens to aircraft routes", () => {
  const layout = read("app/aircraft/[aircraftId]/layout.tsx");
  const tokens = read("app/ft-workspace/tokens.css");
  const theme = read("app/ft-workspace/theme.css");

  assert.match(layout, /WorkspaceThemeProvider/);
  assert.match(tokens, /\.ft-workspace\s*\{/);
  assert.match(theme, /\.ft-workspace\[data-theme="light"\]/);
  assert.match(theme, /\.ft-workspace\[data-theme="dark"\]/);
});

test("F0 keeps source safety semantics separate from app state semantics", () => {
  const theme = read("app/ft-workspace/theme.css");

  for (const token of [
    "--ft-source-warning",
    "--ft-source-caution",
    "--ft-source-note",
    "--ft-state-recalc",
    "--ft-state-invalid",
  ]) {
    assert.match(theme, new RegExp(token));
  }

  assert.doesNotMatch(theme, /--ft-state-invalid:[^;]*;\s*\/\*[^*]*NEEDS RECALCULATION/i);
});

test("F0 gives MemoryItem a neutral content-classification token", () => {
  const tokens = read("app/ft-workspace/tokens.css");

  assert.match(tokens, /--ft-memory-emphasis:\s*var\(--ft-text-primary\)/);
  assert.doesNotMatch(tokens, /--ft-memory-emphasis:\s*var\(--ft-source-warning\)/);
});

test("F0 treats source age as metadata rather than automatic attention", () => {
  const theme = read("app/ft-workspace/theme.css");

  assert.match(theme, /Source age is intentionally not assigned an attention color here/);
  assert.match(theme, /--ft-text-metadata:/);
});

test("F0 loads IBM Plex through Next self-hosted font plumbing", () => {
  const layout = read("app/aircraft/[aircraftId]/layout.tsx");

  assert.match(layout, /IBM_Plex_Sans/);
  assert.match(layout, /IBM_Plex_Mono/);
  assert.match(layout, /--ft-font-plex-sans/);
  assert.match(layout, /--ft-font-plex-mono/);
});

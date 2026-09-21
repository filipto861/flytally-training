import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

const expectedThemeTokens = [
  "--ft-bg-shell",
  "--ft-bg-panel",
  "--ft-bg-inset",
  "--ft-bg-operational",
  "--ft-border-rule",
  "--ft-border-strong",
  "--ft-text-primary",
  "--ft-text-secondary",
  "--ft-text-metadata",
  "--ft-text-disabled",
  "--ft-source-warning",
  "--ft-source-warning-bg",
  "--ft-source-caution",
  "--ft-source-caution-bg",
  "--ft-source-note",
  "--ft-source-note-bg",
  "--ft-state-recalc",
  "--ft-state-recalc-bg",
  "--ft-state-attention",
  "--ft-state-completed",
  "--ft-state-active",
  "--ft-state-previous",
  "--ft-state-archived",
  "--ft-training-accent",
  "--ft-training-accent-bg",
] as const;

function themeBlock(theme: "light" | "dark", css: string): string {
  const marker = `.ft-workspace[data-theme="${theme}"] {`;
  const start = css.indexOf(marker);
  assert.ok(start >= 0, `missing ${theme} workspace theme block`);
  const end = css.indexOf("\n}", start);
  assert.ok(end > start, `unterminated ${theme} workspace theme block`);
  return css.slice(start, end);
}

test("F0 scopes frozen workspace tokens to aircraft routes", () => {
  const layout = read("app/aircraft/[aircraftId]/layout.tsx");
  const tokens = read("app/ft-workspace/tokens.css");
  const theme = read("app/ft-workspace/theme.css");

  assert.match(layout, /WorkspaceThemeProvider/);
  assert.match(tokens, /\.ft-workspace\s*\{/);
  assert.match(theme, /\.ft-workspace\[data-theme="light"\]/);
  assert.match(theme, /\.ft-workspace\[data-theme="dark"\]/);
});

test("F0 foundation CSS defines variables only and stays visually inert", () => {
  const tokens = read("app/ft-workspace/tokens.css");
  const theme = read("app/ft-workspace/theme.css");

  for (const css of [tokens, theme]) {
    assert.doesNotMatch(css, /\n\s*(?:font-family|font-size|line-height|background|background-color|color|padding|margin|display|position|width|height|border|box-shadow)\s*:/);
  }
});

test("F0 defines the same frozen semantic token set in light and dark themes", () => {
  const theme = read("app/ft-workspace/theme.css");

  for (const mode of ["light", "dark"] as const) {
    const block = themeBlock(mode, theme);
    for (const token of expectedThemeTokens) {
      assert.ok(block.includes(`${token}:`), `${token} missing from ${mode} theme`);
    }
  }
});

test("F0 keeps source safety semantics separate from app state semantics", () => {
  const theme = read("app/ft-workspace/theme.css");

  for (const token of ["--ft-source-warning", "--ft-source-caution", "--ft-source-note", "--ft-state-recalc"]) {
    assert.match(theme, new RegExp(token));
  }

  assert.doesNotMatch(theme, /--ft-state-invalid\s*:/);
  assert.doesNotMatch(theme, /--ft-state-error\s*:/);
  assert.match(theme, /Reserved future application states[\s\S]*state\.invalid, state\.error/);
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

test("F0 loads IBM Plex through Next self-hosted font plumbing with Latin Extended support", () => {
  const layout = read("app/aircraft/[aircraftId]/layout.tsx");

  assert.match(layout, /IBM_Plex_Sans/);
  assert.match(layout, /IBM_Plex_Mono/);
  assert.equal((layout.match(/subsets:\s*\["latin", "latin-ext"\]/g) ?? []).length, 2);
  assert.match(layout, /--ft-font-plex-sans/);
  assert.match(layout, /--ft-font-plex-mono/);
});

test("F0 aircraft layout keeps the workspace theme boundary after W0 extension", () => {
  const layout = read("app/aircraft/[aircraftId]/layout.tsx");

  assert.match(layout, /WorkspaceThemeProvider/);
  assert.doesNotMatch(layout, /AircraftWorkspaceNav|ActiveFlight|search-overlay/i);
});

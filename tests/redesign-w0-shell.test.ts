import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

function aircraftPages(directory: string): string[] {
  const absolute = path.join(root, directory);
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) return aircraftPages(relative);
    return entry.name === "page.tsx" ? [relative] : [];
  });
}

test("W0 shell CSS consumes F0 tokens and iPad acceptance uses Chromium touch emulation", () => {
  const css = read("components/ft-shell/ft-shell.module.css");
  const config = read("playwright.config.mjs");

  for (const token of [
    "--ft-bg-shell",
    "--ft-bg-panel",
    "--ft-bg-inset",
    "--ft-bg-operational",
    "--ft-text-primary",
    "--ft-text-secondary",
    "--ft-text-metadata",
    "--ft-rule-default",
    "--ft-rule-strong",
    "--ft-touch-target-min",
    "--ft-fast-path-height-desktop",
    "--ft-fast-path-height-ipad",
    "--ft-font-ui",
    "--ft-font-data",
  ]) {
    assert.match(css, new RegExp(`var\\(${token.replaceAll("-", "\\-")}\\)`));
  }

  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
  assert.doesNotMatch(css.replaceAll("1180px", ""), /\b\d+(?:\.\d+)?px\b/);

  assert.match(config, /const ipadChromium=\{[\s\S]*browserName:"chromium"[\s\S]*hasTouch:true[\s\S]*isMobile:true/);
  assert.match(config, /name:"ipad-landscape"[\s\S]*viewport:\{width:1112,height:834\}/);
  assert.match(config, /name:"ipad-portrait"[\s\S]*viewport:\{width:834,height:1112\}/);
  assert.match(config, /Mozilla\/5\.0 \(iPad;/);
  assert.match(css, /@media \(max-width: 1180px\), \(hover: none\)/);
});

test("W0 aircraft layout gates FtShell with strict FT_NEW_SHELL infrastructure", () => {
  const layout = read("app/aircraft/[aircraftId]/layout.tsx");

  assert.match(layout, /isNewShellEnabled/);
  assert.match(layout, /const newShell = isNewShellEnabled\(\)/);
  assert.match(layout, /newShell \? <FtShell aircraftId=\{aircraftId\}>\{children\}<\/FtShell> : children/);
  assert.match(layout, /params: Promise<\{ aircraftId: string \}>/);
  assert.match(layout, /const \{ aircraftId \} = await params/);
});

test("W0 FtShell remains aircraft-agnostic and fails closed when the flag is off", () => {
  const files = [
    "components/ft-shell/FtShell.tsx",
    "components/ft-shell/FtTopBar.tsx",
    "components/ft-shell/FtSideNav.tsx",
    "components/ft-shell/FtNavDrawer.tsx",
    "components/ft-shell/FtFastPathRail.tsx",
    "components/ft-shell/navigation.ts",
  ];
  const source = files.map(read).join("\n");

  assert.match(source, /isNewShellEnabled\(\)/);
  assert.match(source, /if \(!isNewShellEnabled\(\)\) return/);
  assert.doesNotMatch(source, /learjet|FC-530|browser-ci-aircraft|flysimware/i);
  assert.doesNotMatch(source, /aircraftId\s*===|switch\s*\(\s*aircraftId/i);
});

test("W0 leaves the legacy AircraftWorkspaceNav independent", () => {
  const legacy = read("components/aircraft-workspace-nav.tsx");

  assert.match(legacy, /export async function AircraftWorkspaceNav/);
  assert.doesNotMatch(legacy, /FtShell|FT_NEW_SHELL|ft-shell/i);
});

test("W0 does not mount the new shell from existing aircraft page files", () => {
  const pages = aircraftPages("app/aircraft/[aircraftId]");

  assert.ok(pages.length > 0);
  for (const page of pages) {
    const source = read(page);
    assert.doesNotMatch(source, /FtShell|FT_NEW_SHELL|ft-shell/i, `unexpected W0 shell reference in ${page}`);
  }
});

test("P1.1 shell owns mode-specific navigation while preserving four EFB fast-path actions", () => {
  const productMode = read("lib/aircraft-product-mode.ts");
  const sideNav = read("components/ft-shell/FtSideNav.tsx");
  const fastPath = read("components/ft-shell/navigation.ts");

  for (const label of ["Learn", "Systems", "Procedures", "Limitations", "Reference", "Flight Brief", "Performance", "Flight Deck"]) {
    assert.match(productMode, new RegExp(`label: "${label}"`));
  }
  for (const label of ["CHECKLIST", "QRH", "PERF", "REF"]) {
    assert.match(fastPath, new RegExp(`label: "${label}"`));
  }

  assert.match(sideNav, /getAircraftProductModeForPathname/);
  assert.match(sideNav, /getAircraftModeDestinations/);
  assert.match(fastPath, /\/abnormal/);
  assert.match(fastPath, /\/reference/);
});

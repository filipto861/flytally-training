import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test("F3 pins Playwright as an explicit devDependency", () => {
  const pkg = JSON.parse(read("package.json")) as {
    devDependencies?: Record<string, string>;
  };

  assert.equal(pkg.devDependencies?.["@playwright/test"], "1.55.0");
});

test("F3 preserves existing Playwright projects and adds both iPad orientations", () => {
  const config = read("playwright.config.mjs");

  for (const project of [
    'name:"desktop-chromium"',
    'name:"mobile-chromium"',
    'name:"ipad-landscape"',
    'name:"ipad-portrait"',
  ]) {
    assert.ok(config.includes(project), `missing ${project}`);
  }
});

test("F3 iPad projects use Chromium touch/mobile emulation at frozen viewports", () => {
  const config = read("playwright.config.mjs");

  assert.match(config, /browserName:"chromium"/);
  assert.match(config, /hasTouch:true/);
  assert.match(config, /isMobile:true/);
  assert.match(config, /viewport:\{width:1024,height:768\}/);
  assert.match(config, /viewport:\{width:768,height:1024\}/);
});

test("F3 browser smoke relies on npm ci instead of an ad-hoc Playwright install", () => {
  const workflow = read(".github/workflows/browser-smoke.yml");

  assert.match(workflow, /npm ci --no-audit --no-fund/);
  assert.match(workflow, /npx playwright install --with-deps chromium/);
  assert.doesNotMatch(workflow, /npm install --no-save[^\n]*@playwright\/test/);
});

test("F3 leaves a skipped W0 shell acceptance skeleton", () => {
  const spec = read("e2e/shell/aircraft-shell.spec.ts");

  assert.match(spec, /Filled in by W0 when new shell is mounted/);
  assert.match(spec, /test\.skip\(/);
  assert.doesNotMatch(spec, /expect\(/);
});

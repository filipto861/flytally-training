import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const ignoredDirectories = new Set([
  ".git",
  ".next",
  "node_modules",
  "playwright-report",
  "test-results",
]);

function markdownFiles(directory: string, prefix = ""): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...markdownFiles(absolute, relative));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(relative.replaceAll("\\", "/"));
    }
  }
  return files;
}

test("documentation surface stays consolidated to five maintained Markdown files", () => {
  assert.deepEqual(markdownFiles(root).sort(), [
    "CHANGELOG.md",
    "FEATURES.md",
    "README.md",
    "ROADMAP.md",
    "TECHNICAL_DOCUMENTATION.md",
  ]);
});

test("README points contributors to the four maintained project-control documents", () => {
  const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
  assert.match(readme, /ROADMAP\.md/);
  assert.match(readme, /FEATURES\.md/);
  assert.match(readme, /CHANGELOG\.md/);
  assert.match(readme, /TECHNICAL_DOCUMENTATION\.md/);
  assert.doesNotMatch(readme, /ARCHITECTURE\.md|DEPLOYMENT\.md|V1_RELEASE\.md/);
});

test("feature list remains a capability inventory rather than an implementation roadmap", () => {
  const features = fs.readFileSync(path.join(root, "FEATURES.md"), "utf8");
  assert.match(features, /canonical product capability inventory/i);
  assert.match(features, /Generic Weight & Balance platform|Weight & Balance platform/i);
  assert.match(features, /Learjet operational W&B.+SOURCE-GATED/is);
  assert.match(features, /Operational Fast Path/i);
  assert.doesNotMatch(features, /Active implementation order/i);
});

test("roadmap exposes the forward-looking phase model and source-gated lane", () => {
  const roadmap = fs.readFileSync(path.join(root, "ROADMAP.md"), "utf8");
  assert.match(roadmap, /## Current product truth/);
  assert.match(roadmap, /R0 — Product Truth & Governance Reset/);
  assert.match(roadmap, /R1 — EFB Safety & Foundation Closure/);
  assert.match(roadmap, /R2 — Cockpit Workflow \/ Digital Binder/);
  assert.match(roadmap, /## SOURCE-GATED lane/);
  assert.match(roadmap, /Effective-configuration consistency/);
  assert.match(roadmap, /Offline governed-content currency/);
  assert.doesNotMatch(roadmap, /## Active implementation order/);
});

test("technical documentation owns current architecture instead of milestone files", () => {
  const docs = fs.readFileSync(
    path.join(root, "TECHNICAL_DOCUMENTATION.md"),
    "utf8",
  );
  for (const heading of [
    "Product boundary",
    "Source governance and aviation integrity",
    "Active Flight architecture",
    "Operational checklist architecture",
    "Performance architecture",
    "Deployment and development workflow",
    "Security boundary",
    "Documentation governance",
  ]) {
    assert.match(docs, new RegExp(heading, "i"));
  }
  assert.match(docs, /Historical milestone documents were consolidated here/i);
});

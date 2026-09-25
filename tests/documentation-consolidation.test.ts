import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const allowed = new Set([
  "CHANGELOG.md",
  "README.md",
  "ROADMAP.md",
  "TECHNICAL_DOCUMENTATION.md",
]);

function markdownFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...markdownFiles(absolute));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(path.relative(root, absolute).replaceAll("\\", "/"));
    }
  }
  return files;
}

test("documentation stays consolidated into the maintained four-file set", () => {
  assert.deepEqual(markdownFiles(root).sort(), [...allowed].sort());
});

test("README points contributors to the maintained documentation controls", () => {
  const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
  for (const file of allowed) {
    assert.match(readme, new RegExp(file.replace(".", "\\.")));
  }
});

test("roadmap exposes the terse progress table and completed consolidation", () => {
  const roadmap = fs.readFileSync(path.join(root, "ROADMAP.md"), "utf8");
  assert.match(roadmap, /## Progress at a glance/);
  assert.match(roadmap, /Documentation consolidation — COMPLETE/);
  assert.match(roadmap, /Learjet CHECKLIST \| ✅ Complete/);
});

test("technical documentation declares itself as the single maintained technical contract", () => {
  const docs = fs.readFileSync(
    path.join(root, "TECHNICAL_DOCUMENTATION.md"),
    "utf8",
  );
  assert.match(docs, /single maintained technical\/product documentation file/i);
  assert.match(docs, /do not create new milestone\/specification Markdown files/i);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test("P1.1 aircraft entry is an explicit Learn/EFB chooser", () => {
  const page = read("app/aircraft/[aircraftId]/page.tsx");
  const chooser = read("components/ft-launch/FtModeChooser.tsx");

  assert.match(page, /FtModeChooser/);
  assert.doesNotMatch(page, /FtLaunchSurface/);
  assert.match(chooser, /Study the aircraft/);
  assert.match(chooser, /Fly \/ prepare a flight/);
  assert.match(chooser, /\/learn/);
  assert.match(chooser, /\/efb/);
});

test("P1.1 mode entry routes preserve existing production pages", () => {
  const learn = read("app/aircraft/[aircraftId]/learn/page.tsx");
  const efb = read("app/aircraft/[aircraftId]/efb/page.tsx");

  assert.match(learn, /\/training/);
  assert.match(efb, /\/flight/);
  assert.match(learn, /withVariantQuery/);
  assert.match(efb, /withVariantQuery/);
});

test("P1.1 Learn chrome does not surface Active Flight or operational fast path", () => {
  const topBar = read("components/ft-shell/FtTopBar.tsx");
  const rail = read("components/ft-shell/FtFastPathRail.tsx");
  const panel = read("components/ft-fast-path/FtFastPathPanel.tsx");
  const provider = read("components/ft-fast-path/FtFastPathProvider.tsx");

  assert.match(topBar, /mode === "efb"/);
  assert.match(topBar, /mode === "learn"/);
  assert.match(rail, /!== "efb"/);
  assert.match(panel, /!== "efb"/);
  assert.match(provider, /operationalMode/);
});

test("P1.1 roadmap is the single current planning document", () => {
  const roadmap = read("ROADMAP.md");
  assert.match(roadmap, /single authoritative implementation roadmap/i);
  assert.match(roadmap, /P1\.1 — LEARN \/ EFB product-mode split — IN PROGRESS/);
  assert.match(roadmap, /P1\.2 — Versioned Performance Snapshot V2 — PLANNED/);
  assert.match(roadmap, /P1\.3 — Canonical Performance operation controller — PLANNED/);
  assert.match(roadmap, /P1\.4 — Flight Brief becomes EFB home — PLANNED/);
});

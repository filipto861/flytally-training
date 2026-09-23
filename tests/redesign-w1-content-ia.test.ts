import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  getAircraftContentIa,
  getAircraftContentSectionForPathname,
  getAircraftProductModeForPathname,
} from "../lib/aircraft-content-ia.ts";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

const aircraftId = "test-aircraft";
const base = `/aircraft/${aircraftId}`;

test("P1.1 content IA exposes separate Learn and EFB destinations", () => {
  assert.deepEqual(
    getAircraftContentIa(aircraftId, "learn").map(({ key, label, href }) => ({ key, label, href })),
    [
      { key: "training", label: "LEARN", href: `${base}/training` },
      { key: "systems", label: "SYSTEMS", href: `${base}/systems` },
      { key: "procedures", label: "PROCEDURES", href: `${base}/procedures` },
      { key: "limitations", label: "LIMITATIONS", href: `${base}/limitations` },
      { key: "reference", label: "REFERENCE", href: `${base}/reference` },
    ],
  );

  assert.deepEqual(
    getAircraftContentIa(aircraftId, "efb").map(({ key, label, href }) => ({ key, label, href })),
    [
      { key: "flight", label: "FLIGHT BRIEF", href: `${base}/flight` },
      { key: "performance", label: "PERFORMANCE", href: `${base}/performance` },
      { key: "checklist", label: "CHECKLIST", href: `${base}/fly` },
      { key: "qrh", label: "QRH", href: `${base}/abnormal` },
    ],
  );
});

test("P1.1 classifies named routes into Learn or EFB without moving legacy route files", () => {
  for (const segment of [
    "training",
    "systems",
    "procedures",
    "limitations",
    "reference",
    "knowledge",
    "avionics",
    "flows",
    "quick-start",
    "orientation",
    "cold-dark",
    "progress-overview",
    "checklists",
    "quick-reference",
  ]) {
    assert.equal(getAircraftProductModeForPathname(`${base}/${segment}`, aircraftId), "learn", segment);
  }

  for (const segment of ["flight", "performance", "fly", "abnormal", "weight-balance"]) {
    assert.equal(getAircraftProductModeForPathname(`${base}/${segment}`, aircraftId), "efb", segment);
  }

  assert.equal(getAircraftProductModeForPathname(base, aircraftId), null);
  assert.equal(getAircraftContentSectionForPathname(`${base}/fly`, aircraftId), "checklist");
  assert.equal(getAircraftContentSectionForPathname(`${base}/abnormal`, aircraftId), "qrh");
  assert.equal(getAircraftContentSectionForPathname(`${base}/checklists`, aircraftId), "procedures");
});

test("P1.1 IA points only at existing aircraft route files", () => {
  const destinations = [
    ...getAircraftContentIa(aircraftId, "learn"),
    ...getAircraftContentIa(aircraftId, "efb"),
  ];
  const hrefs = [
    ...destinations.map((destination) => destination.href),
    ...destinations.flatMap((destination) => destination.subs.map((sub) => sub.href)),
  ];

  for (const href of hrefs) {
    const suffix = href.slice(base.length + 1);
    const routeFile = path.join(root, "app/aircraft/[aircraftId]", suffix, "page.tsx");
    assert.ok(fs.existsSync(routeFile), `missing route for ${href}`);
  }
});

test("P1.1 side nav and drawer consume central mode-aware IA", () => {
  for (const file of [
    "components/ft-shell/FtSideNav.tsx",
    "components/ft-shell/FtNavDrawer.tsx",
  ]) {
    const source = read(file);
    assert.match(source, /@\/lib\/aircraft-content-ia/);
    assert.match(source, /getAircraftProductModeForPathname/);
    assert.match(source, /getAircraftContentIa/);
    assert.match(source, /isAircraftContentDestinationActive/);
    assert.doesNotMatch(source, /learjet|FC-530|flysimware/i);
  }
});

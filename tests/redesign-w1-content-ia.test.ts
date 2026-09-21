import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  getAircraftContentIa,
  getAircraftContentSectionForPathname,
} from "../lib/aircraft-content-ia.ts";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

const aircraftId = "test-aircraft";
const base = `/aircraft/${aircraftId}`;

test("W1 content IA exposes exactly five frozen top-level destinations", () => {
  const destinations = getAircraftContentIa(aircraftId);

  assert.deepEqual(
    destinations.map(({ key, label, href }) => ({ key, label, href })),
    [
      { key: "aircraft", label: "AIRCRAFT", href: base },
      { key: "procedures", label: "PROCEDURES", href: `${base}/procedures` },
      { key: "performance", label: "PERFORMANCE", href: `${base}/performance` },
      { key: "training", label: "TRAINING", href: `${base}/training` },
      { key: "flight", label: "FLIGHT", href: `${base}/fly` },
    ],
  );
});

test("W1 IA classifies all existing named aircraft routes into the five sections", () => {
  const expected = new Map<string, string>([
    ["systems", "aircraft"],
    ["knowledge", "aircraft"],
    ["avionics", "aircraft"],
    ["limitations", "aircraft"],
    ["flows", "aircraft"],
    ["procedures", "procedures"],
    ["abnormal", "procedures"],
    ["checklists", "procedures"],
    ["performance", "performance"],
    ["weight-balance", "performance"],
    ["training", "training"],
    ["quick-start", "training"],
    ["orientation", "training"],
    ["cold-dark", "training"],
    ["progress-overview", "training"],
    ["fly", "flight"],
    ["flight", "flight"],
    ["quick-reference", "flight"],
    ["reference", "flight"],
  ]);

  assert.equal(getAircraftContentSectionForPathname(base, aircraftId), "aircraft");
  for (const [segment, section] of expected) {
    assert.equal(
      getAircraftContentSectionForPathname(`${base}/${segment}`, aircraftId),
      section,
      segment,
    );
  }
});

test("W1 content IA points only at existing aircraft route files", () => {
  const destinations = getAircraftContentIa(aircraftId);
  const hrefs = [
    ...destinations.map((destination) => destination.href),
    ...destinations.flatMap((destination) => destination.subs.map((sub) => sub.href)),
  ];

  for (const href of hrefs) {
    const suffix = href === base ? "" : href.slice(base.length + 1);
    const routeFile = suffix
      ? path.join(root, "app/aircraft/[aircraftId]", suffix, "page.tsx")
      : path.join(root, "app/aircraft/[aircraftId]/page.tsx");

    assert.ok(fs.existsSync(routeFile), `missing route for ${href}`);
  }
});

test("W1 side nav and drawer consume the central content IA without hardcoded aircraft hrefs", () => {
  for (const file of [
    "components/ft-shell/FtSideNav.tsx",
    "components/ft-shell/FtNavDrawer.tsx",
  ]) {
    const source = read(file);
    assert.match(source, /@\/lib\/aircraft-content-ia/);
    assert.match(source, /getAircraftContentIa/);
    assert.match(source, /isAircraftContentDestinationActive/);
    assert.doesNotMatch(source, /\/aircraft\/\$\{|\/procedures|\/performance|\/training|\/fly/);
  }
});

test("W1 suppresses legacy navigation only inside the new shell without modifying its component", () => {
  const shellCss = read("components/ft-shell/ft-shell.module.css");
  const legacyNav = read("components/aircraft-workspace-nav.tsx");

  assert.match(shellCss, /\.content :global\(\.learner-pilot-nav\)\s*\{\s*display: none;/);
  assert.match(legacyNav, /aria-label="Aircraft navigation"/);
  assert.match(legacyNav, /aria-label="Pilot workspace"/);
  assert.doesNotMatch(legacyNav, /FtShell|FT_NEW_SHELL|aircraft-content-ia|ft-shell/i);
});

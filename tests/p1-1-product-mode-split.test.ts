import assert from "node:assert/strict";
import test from "node:test";

import {
  getAircraftModeDestinations,
  getAircraftModeHomeHref,
  getAircraftProductModeForPathname,
  isAircraftModeDestinationActive,
} from "../lib/aircraft-product-mode.ts";

const aircraftId = "generic-aircraft";
const base = `/aircraft/${aircraftId}`;

test("P1.1 exposes explicit Learn and EFB mode homes", () => {
  assert.equal(getAircraftModeHomeHref(aircraftId, "learn"), `${base}/learn`);
  assert.equal(getAircraftModeHomeHref(aircraftId, "efb"), `${base}/efb`);
});

test("P1.1 classifies learning and operational legacy routes into separate modes", () => {
  for (const route of [
    "learn",
    "training",
    "systems",
    "procedures",
    "checklists",
    "abnormal",
    "limitations",
    "reference",
    "orientation",
  ]) {
    assert.equal(
      getAircraftProductModeForPathname(`${base}/${route}`, aircraftId),
      "learn",
      route,
    );
  }

  for (const route of ["efb", "flight", "fly", "performance", "weight-balance"]) {
    assert.equal(
      getAircraftProductModeForPathname(`${base}/${route}`, aircraftId),
      "efb",
      route,
    );
  }

  assert.equal(getAircraftProductModeForPathname(base, aircraftId), null);
});

test("P1.1 Learn navigation contains no operational flight destinations", () => {
  const destinations = getAircraftModeDestinations(aircraftId, "learn");
  assert.deepEqual(
    destinations.map((destination) => destination.label),
    ["Learn", "Systems", "Procedures", "Limitations", "Reference"],
  );
  assert.ok(destinations.every((destination) => !/performance|flight deck|flight brief/i.test(destination.label)));
});

test("P1.1 EFB navigation contains no training destinations", () => {
  const destinations = getAircraftModeDestinations(aircraftId, "efb");
  assert.deepEqual(
    destinations.map((destination) => destination.label),
    ["Flight Brief", "Performance", "Checklist"],
  );
  assert.ok(destinations.every((destination) => !/systems|training|learn/i.test(destination.label)));
});

test("P1.1 active destination follows the current product mode", () => {
  assert.equal(
    isAircraftModeDestinationActive(`${base}/systems`, aircraftId, "learn", "systems"),
    true,
  );
  assert.equal(
    isAircraftModeDestinationActive(`${base}/systems`, aircraftId, "efb", "performance"),
    false,
  );
  assert.equal(
    isAircraftModeDestinationActive(`${base}/performance`, aircraftId, "efb", "performance"),
    true,
  );
  assert.equal(
    isAircraftModeDestinationActive(`${base}/performance`, aircraftId, "learn", "systems"),
    false,
  );
});

test("P1.1 shell navigation preserves the selected variant across product-mode links", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const root = path.resolve(import.meta.dirname, "..");
  const sideNav = fs.readFileSync(path.join(root, "components/ft-shell/FtSideNav.tsx"), "utf8");
  const drawer = fs.readFileSync(path.join(root, "components/ft-shell/FtNavDrawer.tsx"), "utf8");

  for (const source of [sideNav, drawer]) {
    assert.match(source, /useSearchParams/);
    assert.match(source, /searchParams\.get\("variant"\)/);
    assert.match(source, /withVariantQuery/);
  }
});

test("P1.1 EFB top bar reconciles server and local Active Flight state", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const root = path.resolve(import.meta.dirname, "..");
  const topBar = fs.readFileSync(path.join(root, "components/ft-shell/FtTopBar.tsx"), "utf8");

  assert.match(topBar, /useActiveFlightState/);
  assert.match(topBar, /useActiveFlightState\(aircraftId, activeFlight\)/);
  assert.match(topBar, /flight\?\.lifecycle === "ACTIVE"/);
  assert.doesNotMatch(topBar, /const current = activeFlight\?\.lifecycle/);
});

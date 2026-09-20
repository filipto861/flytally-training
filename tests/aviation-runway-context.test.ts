import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { findAirport } from "../lib/aviation/airport-dataset.ts";
import type { AirportDatasetV1, AirportRecord, SourcedValue } from "../lib/aviation/airport-types.ts";
import {
  airportAutoFill,
  availableRunwayEnds,
  calculateRunwayMarginFt,
  manualSourcedValue,
  resolveRunwayEnd,
} from "../lib/aviation/runway-context.ts";

const dataset = JSON.parse(
  fs.readFileSync(new URL("../public/data/aviation/airports/eu-na.v1.json", import.meta.url), "utf8"),
) as AirportDatasetV1;
const lkpr = findAirport(dataset, "LKPR");
if (!lkpr) throw new Error("LKPR fixture missing.");

test("B9-A resolves Prague runway 24 into generic runway context", () => {
  const context = resolveRunwayEnd(lkpr, "24");
  assert.ok(context);
  assert.equal(context.airportIcao, "LKPR");
  assert.equal(context.runwayIdent, "24");
  assert.equal(context.airportElevationFt, 1247);
  assert.equal(context.runwayEndElevationFt, 1158);
  assert.equal(context.headingTrueDeg, 245);
  assert.equal(context.surfaceLengthFt, 12189);
  assert.equal(context.availableTakeoffLengthFt, 12189);
  assert.equal(context.surface, "CON");
});

test("B9-A exposes both active ends for both Prague runway surfaces", () => {
  assert.deepEqual(
    availableRunwayEnds(lkpr).map((item) => item.ident),
    ["06", "12", "24", "30"],
  );
});

test("B9-A closed runway surfaces are excluded from selectable runway ends", () => {
  const fixture: AirportRecord = {
    icao: "TEST",
    name: "Test",
    countryCode: "CZ",
    elevationFt: 1000,
    runways: [{
      id: "09/27",
      surfaceLengthFt: 5000,
      closed: true,
      ends: [{ ident: "09" }, { ident: "27" }],
    }],
  };
  assert.deepEqual(availableRunwayEnds(fixture), []);
  assert.equal(resolveRunwayEnd(fixture, "09"), undefined);
});

test("B9-A unknown runway end fails gracefully", () => {
  assert.equal(resolveRunwayEnd(lkpr, "99"), undefined);
});

test("B9-A runway matching is case-insensitive for lettered runway ends", () => {
  const fixture: AirportRecord = {
    icao: "TEST",
    name: "Test",
    countryCode: "US",
    elevationFt: 100,
    runways: [{
      id: "09L/27R",
      surfaceLengthFt: 6000,
      closed: false,
      ends: [{ ident: "09L" }, { ident: "27R" }],
    }],
  };
  assert.equal(resolveRunwayEnd(fixture, "27r")?.runwayIdent, "27R");
});

test("B9-A runway margin reports positive and negative margins without clamping", () => {
  const positive = calculateRunwayMarginFt(3632, 5000);
  assert.equal(positive.marginFt, 1368);
  assert.equal(Math.round(positive.usePercent), 73);
  assert.equal(positive.withinLength, true);

  const negative = calculateRunwayMarginFt(5500, 5000);
  assert.equal(negative.marginFt, -500);
  assert.equal(negative.usePercent, 110);
  assert.equal(negative.withinLength, false);
});

test("B9-A runway margin supports zero required distance and rejects invalid available length", () => {
  assert.deepEqual(calculateRunwayMarginFt(0, 5000), { marginFt: 5000, usePercent: 0, withinLength: true });
  assert.throws(() => calculateRunwayMarginFt(3000, 0), RangeError);
});

test("B9-A sourced-value helpers protect manual overrides", () => {
  const clean: SourcedValue<string> = { value: "", source: "manual", dirty: false };
  assert.deepEqual(airportAutoFill(clean, "820"), { value: "820", source: "airport-db", dirty: false });

  const manual = manualSourcedValue("1000");
  assert.deepEqual(manual, { value: "1000", source: "manual", dirty: true });
  assert.equal(airportAutoFill(manual, "820"), manual);
});

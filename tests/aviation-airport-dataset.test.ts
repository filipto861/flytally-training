import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test from "node:test";
import { gzipSync } from "node:zlib";

import {
  findAirport,
  searchAirports,
  validateAirportDataset,
} from "../lib/aviation/airport-dataset.ts";
import type { AirportDatasetV1 } from "../lib/aviation/airport-types.ts";

const datasetUrl = new URL("../public/data/aviation/airports/eu-na.v1.json", import.meta.url);
const manifestUrl = new URL("../public/data/aviation/airports/manifest.v1.json", import.meta.url);
const raw = fs.readFileSync(datasetUrl);
const dataset = JSON.parse(raw.toString("utf8")) as AirportDatasetV1;
const manifest = JSON.parse(fs.readFileSync(manifestUrl, "utf8")) as {
  dataset: { sha256: string; rawBytes: number; airportCount: number };
};

test("B9-A bundled airport dataset satisfies the generic schema", () => {
  assert.deepEqual(validateAirportDataset(dataset), []);
  assert.equal(dataset.schemaVersion, 1);
  assert.equal(dataset.source.id, "ourairports");
  assert.ok(dataset.airports.length > 2000);
  assert.ok(dataset.airports.every((airport) => /^[A-Z]{4}$/.test(airport.icao)));
});

test("B9-A airport dataset has unique ICAO codes", () => {
  const codes = dataset.airports.map((airport) => airport.icao);
  assert.equal(new Set(codes).size, codes.length);
});

test("B9-A manifest checksum and byte count match the committed dataset", () => {
  assert.equal(createHash("sha256").update(raw).digest("hex"), manifest.dataset.sha256);
  assert.equal(raw.byteLength, manifest.dataset.rawBytes);
  assert.equal(dataset.airports.length, manifest.dataset.airportCount);
});

test("B9-A airport dataset stays inside the agreed raw and gzip size budgets", () => {
  assert.ok(raw.byteLength < 2_000_000, `raw dataset is ${raw.byteLength} bytes`);
  const gzipBytes = gzipSync(raw).byteLength;
  assert.ok(gzipBytes < 600_000, `gzip dataset is ${gzipBytes} bytes`);
});

test("B9-A contains Prague and findAirport is case-insensitive", () => {
  const airport = findAirport(dataset, "lkpr");
  assert.ok(airport);
  assert.equal(airport.name, "Václav Havel Airport Prague");
  assert.equal(airport.countryCode, "CZ");
  assert.equal(airport.elevationFt, 1247);
  assert.ok(airport.runways.some((runway) => runway.id === "06/24"));
});

test("B9-A autocomplete matches partial ICAO case-insensitively and enforces its limit", () => {
  const results = searchAirports(dataset, "lkp", 5);
  assert.ok(results.length <= 5);
  assert.ok(results.some((airport) => airport.icao === "LKPR"));
});

test("B9-A autocomplete can match airport name or municipality", () => {
  const results = searchAirports(dataset, "prague", 12);
  assert.ok(results.some((airport) => airport.icao === "LKPR"));
});

test("B9-A committed dataset uses normalized fields instead of raw OurAirports names", () => {
  const text = raw.toString("utf8");
  assert.doesNotMatch(text, /"length_ft"|"le_heading_degT"|"airport_ident"/);
  assert.match(text, /"surfaceLengthFt"/);
  assert.match(text, /"headingTrueDeg"/);
});

test("B9-A generator is manual and not wired into normal build scripts", () => {
  const generator = fs.readFileSync(new URL("../scripts/generate-airport-dataset.mjs", import.meta.url), "utf8");
  const packageJson = fs.readFileSync(new URL("../package.json", import.meta.url), "utf8");
  assert.match(generator, /ourairports-data\/airports\.csv/);
  assert.match(generator, /ourairports-data\/runways\.csv/);
  assert.doesNotMatch(packageJson, /generate-airport-dataset/);
});

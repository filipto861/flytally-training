import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const AIRPORTS_URL = "https://davidmegginson.github.io/ourairports-data/airports.csv";
const RUNWAYS_URL = "https://davidmegginson.github.io/ourairports-data/runways.csv";
const OUT_DIR = new URL("../public/data/aviation/airports/", import.meta.url);
const COUNTRY_CODES = new Set("AL AD AT AX BY BE BA BG HR CY CZ DK EE FO FI FR DE GI GR GG HU IS IE IM IT JE XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SE CH TR UA GB VA AG AI AW BB BL BM BQ BS BZ CA CR CU CW DM DO GD GL GP GT HN HT JM KN KY LC MF MQ MS MX NI PA PM PR SV SX TC TT US VC VG VI".split(" "));

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; }
        else quoted = false;
      } else field += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  const header = rows.shift();
  return rows.map((values) => Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""])));
}

function finite(value) {
  if (value === "" || value === undefined || value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function runwayEnd(row, prefix) {
  const ident = row[`${prefix}_ident`];
  if (!ident) return undefined;
  const heading = finite(row[`${prefix}_heading_degT`]);
  const elevation = finite(row[`${prefix}_elevation_ft`]);
  const latitude = finite(row[`${prefix}_latitude_deg`]);
  const longitude = finite(row[`${prefix}_longitude_deg`]);
  const displaced = finite(row[`${prefix}_displaced_threshold_ft`]);
  return {
    ident,
    ...(heading !== undefined ? { headingTrueDeg: heading } : {}),
    ...(elevation !== undefined ? { elevationFt: elevation } : {}),
    ...(latitude !== undefined ? { latitudeDeg: latitude } : {}),
    ...(longitude !== undefined ? { longitudeDeg: longitude } : {}),
    ...(displaced !== undefined ? { displacedThresholdFt: displaced } : {}),
  };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

const [airportResponse, runwayResponse] = await Promise.all([fetch(AIRPORTS_URL), fetch(RUNWAYS_URL)]);
if (!airportResponse.ok || !runwayResponse.ok) {
  throw new Error(`OurAirports download failed: airports=${airportResponse.status}, runways=${runwayResponse.status}`);
}
const [airportCsv, runwayCsv] = await Promise.all([airportResponse.text(), runwayResponse.text()]);
const airports = parseCsv(airportCsv);
const runways = parseCsv(runwayCsv);

const runwaysByAirport = new Map();
for (const runway of runways) {
  if (runway.closed === "1" || !(Number(runway.length_ft) > 0)) continue;
  const list = runwaysByAirport.get(runway.airport_ident) ?? [];
  list.push(runway);
  runwaysByAirport.set(runway.airport_ident, list);
}

const records = [];
for (const airport of airports) {
  if (!(airport.continent === "EU" || airport.continent === "NA")) continue;
  if (!COUNTRY_CODES.has(airport.iso_country)) continue;
  if (!/^[A-Z]{4}$/.test(airport.gps_code ?? "")) continue;
  if (!(airport.scheduled_service === "yes" || ["large_airport", "medium_airport"].includes(airport.type))) continue;
  const elevationFt = finite(airport.elevation_ft);
  if (elevationFt === undefined) continue;

  const transformedRunways = (runwaysByAirport.get(airport.ident) ?? []).map((runway) => {
    const ends = [runwayEnd(runway, "le"), runwayEnd(runway, "he")].filter(Boolean);
    if (!ends.length) return undefined;
    const widthFt = finite(runway.width_ft);
    return {
      id: [runway.le_ident, runway.he_ident].filter(Boolean).join("/"),
      surfaceLengthFt: Number(runway.length_ft),
      ...(widthFt !== undefined ? { widthFt } : {}),
      ...(runway.surface ? { surface: runway.surface } : {}),
      closed: false,
      ends,
    };
  }).filter(Boolean).sort((left, right) => left.id.localeCompare(right.id));

  if (!transformedRunways.length) continue;
  records.push({
    icao: airport.gps_code,
    name: airport.name,
    ...(airport.municipality ? { municipality: airport.municipality } : {}),
    countryCode: airport.iso_country,
    elevationFt,
    runways: transformedRunways,
  });
}
records.sort((left, right) => left.icao.localeCompare(right.icao));

const generatedAt = new Date().toISOString();
const snapshotDate = generatedAt.slice(0, 10);
const dataset = {
  schemaVersion: 1,
  generatedAt,
  source: { id: "ourairports", snapshotDate },
  airports: records,
};
const datasetText = `${JSON.stringify(dataset)}\n`;
const datasetBuffer = Buffer.from(datasetText, "utf8");
const manifest = {
  schemaVersion: 1,
  generatedAt,
  source: {
    id: "ourairports",
    snapshotDate,
    airportsUrl: AIRPORTS_URL,
    runwaysUrl: RUNWAYS_URL,
    airportsSha256: sha256(airportCsv),
    runwaysSha256: sha256(runwayCsv),
  },
  dataset: {
    path: "eu-na.v1.json",
    sha256: sha256(datasetBuffer),
    rawBytes: datasetBuffer.byteLength,
    airportCount: records.length,
    filter: "Europe/North America; four-letter ICAO gps_code; active runway; scheduled service or large/medium airport",
  },
};

await mkdir(OUT_DIR, { recursive: true });
await Promise.all([
  writeFile(new URL("eu-na.v1.json", OUT_DIR), datasetText, "utf8"),
  writeFile(new URL("manifest.v1.json", OUT_DIR), `${JSON.stringify(manifest, null, 2)}\n`, "utf8"),
]);

const gzipBytes = gzipSync(datasetBuffer).byteLength;
console.log(`Generated ${records.length} airports: ${datasetBuffer.byteLength} raw bytes, ${gzipBytes} gzip bytes.`);

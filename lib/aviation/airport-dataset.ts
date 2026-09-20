import type { AirportDatasetV1, AirportRecord } from "./airport-types.ts";

export const AIRPORT_DATASET_URL = "/data/aviation/airports/eu-na.v1.json";
export const AIRPORT_MANIFEST_URL = "/data/aviation/airports/manifest.v1.json";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function validateAirportDataset(value: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return ["Airport dataset must be an object."];
  if (value.schemaVersion !== 1) errors.push("schemaVersion must be 1.");
  if (typeof value.generatedAt !== "string" || !value.generatedAt) errors.push("generatedAt is required.");
  if (!isRecord(value.source) || value.source.id !== "ourairports" || typeof value.source.snapshotDate !== "string") {
    errors.push("source must identify an OurAirports snapshot.");
  }
  if (!Array.isArray(value.airports)) return [...errors, "airports must be an array."];

  const seen = new Set<string>();
  value.airports.forEach((candidate, airportIndex) => {
    if (!isRecord(candidate)) {
      errors.push(`airports[${airportIndex}] must be an object.`);
      return;
    }
    const icao = candidate.icao;
    if (typeof icao !== "string" || !/^[A-Z]{4}$/.test(icao)) {
      errors.push(`airports[${airportIndex}].icao must be a four-letter ICAO code.`);
    } else if (seen.has(icao)) {
      errors.push(`Duplicate ICAO ${icao}.`);
    } else {
      seen.add(icao);
    }
    if (typeof candidate.name !== "string" || !candidate.name) errors.push(`${icao ?? airportIndex}: name is required.`);
    if (typeof candidate.countryCode !== "string" || !candidate.countryCode) errors.push(`${icao ?? airportIndex}: countryCode is required.`);
    if (!finiteNumber(candidate.elevationFt)) errors.push(`${icao ?? airportIndex}: elevationFt must be finite.`);
    if (!Array.isArray(candidate.runways) || !candidate.runways.length) {
      errors.push(`${icao ?? airportIndex}: at least one runway is required.`);
      return;
    }
    candidate.runways.forEach((runway, runwayIndex) => {
      if (!isRecord(runway)) {
        errors.push(`${icao ?? airportIndex}: runway ${runwayIndex} must be an object.`);
        return;
      }
      if (typeof runway.id !== "string" || !runway.id) errors.push(`${icao ?? airportIndex}: runway id is required.`);
      if (!finiteNumber(runway.surfaceLengthFt) || runway.surfaceLengthFt <= 0) errors.push(`${icao ?? airportIndex}: runway surfaceLengthFt must be positive.`);
      if (typeof runway.closed !== "boolean") errors.push(`${icao ?? airportIndex}: runway closed must be boolean.`);
      if (!Array.isArray(runway.ends) || !runway.ends.length) {
        errors.push(`${icao ?? airportIndex}: runway ends are required.`);
        return;
      }
      runway.ends.forEach((end, endIndex) => {
        if (!isRecord(end) || typeof end.ident !== "string" || !end.ident) {
          errors.push(`${icao ?? airportIndex}: runway end ${endIndex} requires ident.`);
        }
      });
    });
  });
  return errors;
}

export function findAirport(
  dataset: AirportDatasetV1,
  icao: string,
): AirportRecord | undefined {
  const normalized = icao.trim().toUpperCase();
  return dataset.airports.find((airport) => airport.icao === normalized);
}

export function searchAirports(
  dataset: AirportDatasetV1,
  query: string,
  limit = 12,
): readonly AirportRecord[] {
  const normalized = query.trim().toUpperCase();
  if (!normalized) return [];
  return dataset.airports
    .filter((airport) => [
      airport.icao,
      airport.name,
      airport.municipality ?? "",
      airport.countryCode,
    ].some((value) => value.toUpperCase().includes(normalized)))
    .sort((left, right) => {
      const score = (airport: AirportRecord) => {
        if (airport.icao === normalized) return 0;
        if (airport.icao.startsWith(normalized)) return 1;
        if (airport.icao.includes(normalized)) return 2;
        if (airport.name.toUpperCase().startsWith(normalized)) return 3;
        if ((airport.municipality ?? "").toUpperCase().startsWith(normalized)) return 4;
        return 5;
      };
      return score(left) - score(right) || left.icao.localeCompare(right.icao);
    })
    .slice(0, Math.max(0, limit));
}

export async function loadAirportDataset(
  fetchImpl: typeof fetch = globalThis.fetch,
  url = AIRPORT_DATASET_URL,
): Promise<AirportDatasetV1> {
  const response = await fetchImpl(url, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`Airport dataset request failed with HTTP ${response.status}.`);
  const payload: unknown = await response.json();
  const errors = validateAirportDataset(payload);
  if (errors.length) throw new Error(`Airport dataset validation failed: ${errors[0]}`);
  return payload as AirportDatasetV1;
}

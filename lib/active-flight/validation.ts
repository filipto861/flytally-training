import type { ActiveFlight, ActiveFlightInput, ActiveFlightPatch } from "./types.ts";

const ICAO = /^[A-Z0-9]{4}$/;
const RUNWAY = /^[A-Z0-9]{1,4}[LCR]?$/;

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= max ? trimmed : null;
}

function airport(value: unknown): ActiveFlightInput["departure"] | null {
  const row = object(value);
  if (!row) return null;
  const icao = text(row.icao, 4)?.toUpperCase();
  if (!icao || !ICAO.test(icao)) return null;
  const name = row.name == null ? undefined : text(row.name, 120) ?? undefined;
  return name ? { icao, name } : { icao };
}

function runway(value: unknown): ActiveFlightInput["runway"] | null {
  const row = object(value);
  const identifier = row ? text(row.identifier, 5)?.toUpperCase() : null;
  return identifier && RUNWAY.test(identifier) ? { identifier } : null;
}

function weight(value: unknown): ActiveFlightInput["weight"] | null {
  const row = object(value);
  if (!row || typeof row.value !== "number" || !Number.isFinite(row.value)) return null;
  if (row.value <= 0 || row.value > 100000) return null;
  if (row.unit !== "kg" && row.unit !== "lb") return null;
  return { value: row.value, unit: row.unit };
}

function configuration(value: unknown): ActiveFlightInput["configuration"] | null {
  const row = object(value);
  if (!row) return null;
  const flaps = text(row.flaps, 32);
  if (!flaps) return null;
  if (row.antiIce !== undefined && typeof row.antiIce !== "boolean") return null;
  return row.antiIce === undefined ? { flaps } : { flaps, antiIce: row.antiIce };
}

function brief(value: unknown): ActiveFlightInput["brief"] | undefined | null {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const row = object(value);
  if (!row) return undefined;
  if (row.notes === undefined) return {};
  const notes = text(row.notes, 2000);
  return notes ? { notes } : {};
}

export function parseActiveFlightInput(value: unknown): ActiveFlightInput | null {
  const row = object(value);
  if (!row) return null;
  const aircraftId = text(row.aircraftId, 128);
  const departure = airport(row.departure);
  const destination = airport(row.destination);
  const selectedRunway =
    row.runway === undefined || row.runway === null ? null : runway(row.runway);
  const selectedWeight = weight(row.weight);
  const selectedConfiguration =
    row.configuration === undefined || row.configuration === null
      ? null
      : configuration(row.configuration);
  const selectedBrief = brief(row.brief);
  if (!aircraftId || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(aircraftId)) return null;
  if (!departure || !destination || !selectedWeight) return null;
  if (row.runway !== undefined && row.runway !== null && !selectedRunway) return null;
  if (row.configuration !== undefined && row.configuration !== null && !selectedConfiguration) return null;
  if (row.brief !== undefined && selectedBrief === undefined) return null;
  return {
    aircraftId,
    departure,
    destination,
    runway: selectedRunway,
    weight: selectedWeight,
    configuration: selectedConfiguration,
    ...(selectedBrief === undefined ? {} : { brief: selectedBrief }),
  };
}

export function parseActiveFlightPatch(value: unknown): ActiveFlightPatch | null {
  const row = object(value);
  if (!row) return null;
  const patch: ActiveFlightPatch = {};
  if ("departure" in row) { const parsed = airport(row.departure); if (!parsed) return null; Object.assign(patch,{departure:parsed}); }
  if ("destination" in row) { const parsed = airport(row.destination); if (!parsed) return null; Object.assign(patch,{destination:parsed}); }
  if ("runway" in row) {
    if (row.runway === null) Object.assign(patch, { runway: null });
    else { const parsed = runway(row.runway); if (!parsed) return null; Object.assign(patch, { runway: parsed }); }
  }
  if ("weight" in row) { const parsed = weight(row.weight); if (!parsed) return null; Object.assign(patch,{weight:parsed}); }
  if ("configuration" in row) {
    if (row.configuration === null) Object.assign(patch, { configuration: null });
    else { const parsed = configuration(row.configuration); if (!parsed) return null; Object.assign(patch, { configuration: parsed }); }
  }
  if ("brief" in row) { const parsed = brief(row.brief); if (parsed === undefined) return null; Object.assign(patch,{brief:parsed}); }
  return Object.keys(patch).length ? patch : null;
}

export function activeFlightDependencyReference(
  input: Pick<ActiveFlightInput, "departure" | "destination" | "runway" | "weight" | "configuration">,
): string {
  const raw = [
    input.departure.icao,
    input.destination.icao,
    input.runway?.identifier ?? "",
    String(input.weight.value),
    input.weight.unit,
    input.configuration?.flaps ?? "",
    input.configuration?.antiIce ? "1" : "0",
  ].join("|");
  let hash = 2166136261;
  for (let index = 0; index < raw.length; index += 1) {
    hash ^= raw.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return "afd1:" + (hash >>> 0).toString(16).padStart(8, "0");
}

export function isActiveFlight(value: unknown): value is ActiveFlight {
  const row = object(value);
  if (!row || typeof row.id !== "string" || typeof row.aircraftId !== "string" || typeof row.accountSubject !== "string") return false;
  if (row.lifecycle !== "ACTIVE" && row.lifecycle !== "PREVIOUS" && row.lifecycle !== "ARCHIVED") return false;
  if (!airport(row.departure) || !airport(row.destination) || !weight(row.weight)) return false;
  if (row.runway !== null && !runway(row.runway)) return false;
  if (row.configuration !== null && !configuration(row.configuration)) return false;
  for (const key of ["createdAt","updatedAt","activatedAt"] as const) {
    if (typeof row[key] !== "string" || Number.isNaN(Date.parse(row[key] as string))) return false;
  }
  for (const key of ["deactivatedAt","archivedAt"] as const) {
    if (row[key] !== null && (typeof row[key] !== "string" || Number.isNaN(Date.parse(row[key] as string)))) return false;
  }
  const dependency = object(row.performanceDependency);
  if (!dependency || typeof dependency.snapshotId !== "string" || !dependency.snapshotId) return false;
  if (row.weather !== null) return false;
  if (row.brief !== null && !object(row.brief)) return false;
  return true;
}

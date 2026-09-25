import type {
  SimBriefAircraftProfile,
  SimBriefIdentity,
  SimBriefLatestOfp,
} from "./types.ts";

const ICAO = /^[A-Z0-9]{4}$/;
const PILOT_ID = /^\d{1,7}$/;

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function text(value: unknown, max = 128): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const normalized = String(value).trim();
  return normalized && normalized.length <= max ? normalized : null;
}

function numeric(value: unknown): number | null {
  const normalized = text(value, 32);
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function airport(value: unknown): SimBriefLatestOfp["departure"] | null {
  const row = object(value);
  if (!row) return null;
  const icao = text(row.icao_code, 4)?.toUpperCase();
  if (!icao || !ICAO.test(icao)) return null;
  const name = text(row.name, 160) ?? undefined;
  return name ? { icao, name } : { icao };
}

function weightUnit(value: unknown): "kg" | "lb" | null {
  const normalized = text(value, 16)?.toLowerCase();
  if (normalized === "kg" || normalized === "kgs") return "kg";
  if (
    normalized === "lb"
    || normalized === "lbs"
    || normalized === "pound"
    || normalized === "pounds"
  ) {
    return "lb";
  }
  return null;
}

export function parseSimBriefIdentity(value: unknown): SimBriefIdentity | null {
  const row = object(value);
  if (!row) return null;
  if (row.kind !== "alias" && row.kind !== "pilot-id") return null;
  const identityValue = text(row.value, 64);
  if (!identityValue || /[\u0000-\u001f\u007f]/.test(identityValue)) return null;
  if (row.kind === "pilot-id" && !PILOT_ID.test(identityValue)) return null;
  return { kind: row.kind, value: identityValue };
}

export function simBriefLatestOfpUrl(identity: SimBriefIdentity): URL {
  const url = new URL("https://www.simbrief.com/api/xml.fetcher.php");
  url.searchParams.set(
    identity.kind === "pilot-id" ? "userid" : "username",
    identity.value,
  );
  url.searchParams.set("json", "v2");
  return url;
}

export function parseSimBriefLatestOfp(value: unknown): SimBriefLatestOfp | null {
  const root = object(value);
  if (!root) return null;

  const fetch = object(root.fetch);
  const fetchStatus = text(fetch?.status, 256);
  if (fetchStatus && fetchStatus.toLowerCase() !== "success") return null;

  const params = object(root.params);
  const weights = object(root.weights);
  const aircraft = object(root.aircraft);
  if (!params || !weights || !aircraft) return null;

  const departure = airport(root.origin);
  const destination = airport(root.destination);
  const estimatedTow = numeric(weights.est_tow);
  const unit = weightUnit(params.units);
  const aircraftIcaoCode = (
    text(aircraft.icao_code, 8)
    ?? text(aircraft.icaocode, 8)
  )?.toUpperCase() ?? null;
  const requestId = text(params.request_id, 64);
  const generatedUnix = numeric(params.time_generated);

  if (
    !departure
    || !destination
    || !estimatedTow
    || estimatedTow <= 0
    || !unit
    || !aircraftIcaoCode
    || !requestId
  ) {
    return null;
  }

  let generatedAt: string | null = null;
  if (generatedUnix && generatedUnix > 0) {
    const generatedDate = new Date(generatedUnix * 1000);
    if (Number.isNaN(generatedDate.getTime())) return null;
    generatedAt = generatedDate.toISOString();
  }

  return {
    departure,
    destination,
    weight: { value: estimatedTow, unit },
    aircraftIcaoCode,
    requestId,
    generatedAt,
  };
}

export function parseNormalizedSimBriefOfp(
  value: unknown,
): SimBriefLatestOfp | null {
  const row = object(value);
  if (!row) return null;
  const departureRow = object(row.departure);
  const destinationRow = object(row.destination);
  const weightRow = object(row.weight);
  const departure = departureRow
    ? airport({
        icao_code: departureRow.icao,
        name: departureRow.name,
      })
    : null;
  const destination = destinationRow
    ? airport({
        icao_code: destinationRow.icao,
        name: destinationRow.name,
      })
    : null;
  const weightValue = numeric(weightRow?.value);
  const unit = weightUnit(weightRow?.unit);
  const aircraftIcaoCode = text(row.aircraftIcaoCode, 8)?.toUpperCase();
  const requestId = text(row.requestId, 64);
  const generatedAt =
    row.generatedAt === null
      ? null
      : text(row.generatedAt, 64);

  if (
    !departure
    || !destination
    || !weightValue
    || weightValue <= 0
    || !unit
    || !aircraftIcaoCode
    || !requestId
    || (generatedAt !== null && (!generatedAt || Number.isNaN(Date.parse(generatedAt))))
  ) {
    return null;
  }

  return {
    departure,
    destination,
    weight: { value: weightValue, unit },
    aircraftIcaoCode,
    requestId,
    generatedAt: generatedAt ? new Date(generatedAt).toISOString() : null,
  };
}

export function simBriefAircraftCompatible(
  profile: SimBriefAircraftProfile,
  aircraftIcaoCode: string,
): boolean {
  const normalized = aircraftIcaoCode.trim().toUpperCase();
  return profile.acceptedIcaoCodes.some(
    (candidate) => candidate.toUpperCase() === normalized,
  );
}

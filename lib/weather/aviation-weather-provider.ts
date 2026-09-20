import type { MetarFetchResult, MetarSnapshot } from "./metar-types.ts";

export type FetchImpl = typeof fetch;

const PROVIDER_URL = "https://aviationweather.gov/api/data/metar";
const USER_AGENT = "FlyTally-Training/0.0.1 (training-only)";
const DEFAULT_TIMEOUT_MS = 8_000;
const RETRY_DELAY_MS = 500;

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function stringValue(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function numberValue(record: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function normalizeSnapshot(payload: unknown, fetchedAt: string): MetarFetchResult {
  if (!Array.isArray(payload)) {
    return { status: "malformed-response", message: "Aviation Weather response must be an array." };
  }
  if (!payload.length) return { status: "no-report" };
  const record = asRecord(payload[0]);
  if (!record) return { status: "malformed-response", message: "METAR record is not an object." };

  const station = stringValue(record, "station_id", "icaoId")?.toUpperCase();
  const rawText = stringValue(record, "raw_text", "rawOb");
  const observedRaw = stringValue(record, "observation_time", "reportTime");
  if (!station || !/^[A-Z]{4}$/.test(station) || !rawText || !observedRaw || !Number.isFinite(Date.parse(observedRaw))) {
    return { status: "malformed-response", message: "METAR response is missing required station, raw text, or observation time." };
  }

  const qnhHpa = numberValue(record, "altim");
  const windRaw = record.wind_dir_degrees ?? record.wdir;
  const windVariable = typeof windRaw === "string" && windRaw.trim().toUpperCase() === "VRB";
  const windDirectionTrueDeg = windVariable ? undefined : (() => {
    if (typeof windRaw === "number" && Number.isFinite(windRaw)) return windRaw;
    if (typeof windRaw === "string" && windRaw.trim()) {
      const parsed = Number(windRaw);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  })();
  const windSpeedKt = numberValue(record, "wind_speed_kt", "wspd");

  const snapshot: MetarSnapshot = {
    station,
    observedAt: new Date(observedRaw).toISOString(),
    fetchedAt,
    rawText,
    temperatureC: numberValue(record, "temp"),
    dewpointC: numberValue(record, "dewp"),
    qnhHpa,
    altimeterInHg: qnhHpa === undefined ? undefined : qnhHpa / 33.8639,
    windDirectionTrueDeg,
    windSpeedKt,
    windGustKt: numberValue(record, "wind_gust_kt", "wgst"),
    windVariable,
    windCalm: windSpeedKt === 0,
    source: "aviationweather.gov",
  };
  return { status: "ready", snapshot };
}

function shouldRetry(result: MetarFetchResult): boolean {
  return result.status === "provider-unavailable"
    || result.status === "timeout"
    || result.status === "network-error";
}

async function waitForRetry(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
}

async function fetchOnce(
  icao: string,
  fetchImpl: FetchImpl,
  externalSignal: AbortSignal | undefined,
  timeoutMs: number,
): Promise<MetarFetchResult> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const abortFromExternal = () => controller.abort();
  if (externalSignal?.aborted) controller.abort();
  else externalSignal?.addEventListener("abort", abortFromExternal, { once: true });

  try {
    const url = new URL(PROVIDER_URL);
    url.searchParams.set("ids", icao);
    url.searchParams.set("format", "json");
    url.searchParams.set("taf", "false");
    const response = await fetchImpl(url.toString(), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      signal: controller.signal,
    });

    if (response.status === 204) return { status: "no-report" };
    if (response.status === 400) return { status: "invalid-request", message: "Aviation Weather rejected the station request." };
    if (response.status === 429) return { status: "rate-limited" };
    if ([500, 502, 504].includes(response.status)) return { status: "provider-unavailable" };
    if (!response.ok) return { status: "network-error", message: `Aviation Weather returned HTTP ${response.status}.` };

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return { status: "malformed-response", message: "Aviation Weather returned invalid JSON." };
    }
    return normalizeSnapshot(payload, new Date().toISOString());
  } catch (error) {
    if (timedOut || controller.signal.aborted || (error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name))) {
      return { status: "timeout" };
    }
    return {
      status: "network-error",
      message: error instanceof Error ? error.message : "Aviation Weather request failed.",
    };
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", abortFromExternal);
  }
}

export async function fetchAviationWeatherMetar(
  icao: string,
  options: {
    fetchImpl?: FetchImpl;
    signal?: AbortSignal;
    timeoutMs?: number;
  } = {},
): Promise<MetarFetchResult> {
  const normalized = icao.trim();
  if (!/^[A-Z]{4}$/.test(normalized)) {
    return { status: "invalid-request", message: "ICAO must be four uppercase letters." };
  }

  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let result = await fetchOnce(normalized, fetchImpl, options.signal, timeoutMs);
  if (shouldRetry(result)) {
    await waitForRetry();
    result = await fetchOnce(normalized, fetchImpl, options.signal, timeoutMs);
  }
  return result;
}

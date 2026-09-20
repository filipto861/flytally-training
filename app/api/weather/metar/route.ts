import {
  getServerCachedMetar,
  pruneServerCache,
  setServerCachedMetar,
} from "../../../../lib/weather/metar-cache.ts";
import { fetchAviationWeatherMetar } from "../../../../lib/weather/aviation-weather-provider.ts";
import type { MetarFetchResult } from "../../../../lib/weather/metar-types.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

function errorResponse(result: Exclude<MetarFetchResult, { status: "ready" }>): Response {
  switch (result.status) {
    case "no-report":
      return new Response(null, { status: 204, headers: NO_STORE_HEADERS });
    case "invalid-request":
      return Response.json({ error: "invalid-request", message: result.message }, { status: 400, headers: NO_STORE_HEADERS });
    case "rate-limited":
      return Response.json({ error: "rate-limited" }, { status: 429, headers: NO_STORE_HEADERS });
    case "timeout":
      return Response.json({ error: "timeout" }, { status: 504, headers: NO_STORE_HEADERS });
    case "provider-unavailable":
      return Response.json({ error: "provider-unavailable" }, { status: 502, headers: NO_STORE_HEADERS });
    case "network-error":
      return Response.json({ error: "network-error", message: result.message }, { status: 502, headers: NO_STORE_HEADERS });
    case "malformed-response":
      return Response.json({ error: "malformed-response", message: result.message }, { status: 502, headers: NO_STORE_HEADERS });
  }
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const icao = (url.searchParams.get("icao") ?? "").trim().toUpperCase();
  if (!/^[A-Z]{4}$/.test(icao)) {
    return Response.json(
      { error: "invalid-icao" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const cached = getServerCachedMetar(icao);
  if (cached?.status === "ready") {
    return Response.json(cached.snapshot, {
      headers: {
        ...NO_STORE_HEADERS,
        "X-Metar-Source": "server-cache",
      },
    });
  }

  pruneServerCache();
  const result = await fetchAviationWeatherMetar(icao);
  if (result.status !== "ready") return errorResponse(result);

  setServerCachedMetar(icao, result);
  return Response.json(result.snapshot, {
    headers: {
      ...NO_STORE_HEADERS,
      "X-Metar-Source": "aviationweather.gov",
    },
  });
}

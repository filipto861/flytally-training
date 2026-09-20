import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchAviationWeatherMetar,
  type FetchImpl,
} from "../lib/weather/aviation-weather-provider.ts";

const validRecord = {
  station_id: "LKPR",
  raw_text: "LKPR 201630Z 25011KT 9999 FEW040 16/08 Q1017",
  observation_time: "2026-09-20T16:30:00Z",
  temp: 16,
  dewp: 8,
  altim: 1017,
  wind_dir_degrees: 250,
  wind_speed_kt: 11,
  wind_gust_kt: 18,
};

const jsonFetch = (body: unknown, status = 200, inspect?: (input: RequestInfo | URL, init?: RequestInit) => void): FetchImpl =>
  (async (input: RequestInfo | URL, init?: RequestInit) => {
    inspect?.(input, init);
    return new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }) as FetchImpl;

test("B9-B provider returns a normalized ready snapshot for valid ICAO", async () => {
  const result = await fetchAviationWeatherMetar("LKPR", { fetchImpl: jsonFetch([validRecord]) });
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  assert.equal(result.snapshot.station, "LKPR");
  assert.equal(result.snapshot.temperatureC, 16);
  assert.equal(result.snapshot.qnhHpa, 1017);
  assert.ok(Math.abs((result.snapshot.altimeterInHg ?? 0) - 30.03) < 0.05);
});

test("B9-B provider rejects malformed ICAO locally", async () => {
  for (const icao of ["lkpr", "LKP", "LK1R", "ABCDE"]) {
    let calls = 0;
    const result = await fetchAviationWeatherMetar(icao, {
      fetchImpl: jsonFetch([validRecord], 200, () => { calls += 1; }),
    });
    assert.equal(result.status, "invalid-request");
    assert.equal(calls, 0);
  }
});

test("B9-B provider maps HTTP 204 to no-report", async () => {
  const result = await fetchAviationWeatherMetar("LKPR", { fetchImpl: jsonFetch(null, 204) });
  assert.equal(result.status, "no-report");
});

test("B9-B provider maps HTTP 400 to invalid-request without retry", async () => {
  let calls = 0;
  const result = await fetchAviationWeatherMetar("LKPR", {
    fetchImpl: jsonFetch({}, 400, () => { calls += 1; }),
  });
  assert.equal(result.status, "invalid-request");
  assert.equal(calls, 1);
});

test("B9-B provider never retries rate limiting", async () => {
  let calls = 0;
  const result = await fetchAviationWeatherMetar("LKPR", {
    fetchImpl: jsonFetch({}, 429, () => { calls += 1; }),
  });
  assert.equal(result.status, "rate-limited");
  assert.equal(calls, 1);
});

test("B9-B provider retries HTTP 500 exactly once", async () => {
  let calls = 0;
  const fetchImpl = (async () => {
    calls += 1;
    return new Response(null, { status: 500 });
  }) as FetchImpl;
  const result = await fetchAviationWeatherMetar("LKPR", { fetchImpl });
  assert.equal(result.status, "provider-unavailable");
  assert.equal(calls, 2);
});

test("B9-B provider retries HTTP 502 exactly once", async () => {
  let calls = 0;
  const fetchImpl = (async () => {
    calls += 1;
    return new Response(null, { status: 502 });
  }) as FetchImpl;
  const result = await fetchAviationWeatherMetar("LKPR", { fetchImpl });
  assert.equal(result.status, "provider-unavailable");
  assert.equal(calls, 2);
});

test("B9-B provider retries timeout exactly once", async () => {
  let calls = 0;
  const fetchImpl = ((_: RequestInfo | URL, init?: RequestInit) => {
    calls += 1;
    return new Promise<Response>((_, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      }, { once: true });
    });
  }) as FetchImpl;
  const result = await fetchAviationWeatherMetar("LKPR", { fetchImpl, timeoutMs: 5 });
  assert.equal(result.status, "timeout");
  assert.equal(calls, 2);
});

test("B9-B provider rejects malformed JSON", async () => {
  const fetchImpl = (async () => new Response("{", {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })) as FetchImpl;
  const result = await fetchAviationWeatherMetar("LKPR", { fetchImpl });
  assert.equal(result.status, "malformed-response");
});

test("B9-B provider accepts reports without temperature", async () => {
  const { temp: _temp, ...withoutTemperature } = validRecord;
  const result = await fetchAviationWeatherMetar("LKPR", { fetchImpl: jsonFetch([withoutTemperature]) });
  assert.equal(result.status, "ready");
  if (result.status === "ready") assert.equal(result.snapshot.temperatureC, undefined);
});

test("B9-B provider recognizes variable wind", async () => {
  const result = await fetchAviationWeatherMetar("LKPR", {
    fetchImpl: jsonFetch([{ ...validRecord, wind_dir_degrees: "VRB" }]),
  });
  assert.equal(result.status, "ready");
  if (result.status === "ready") {
    assert.equal(result.snapshot.windVariable, true);
    assert.equal(result.snapshot.windDirectionTrueDeg, undefined);
  }
});

test("B9-B provider recognizes calm wind", async () => {
  const result = await fetchAviationWeatherMetar("LKPR", {
    fetchImpl: jsonFetch([{ ...validRecord, wind_speed_kt: 0, wind_gust_kt: undefined }]),
  });
  assert.equal(result.status, "ready");
  if (result.status === "ready") assert.equal(result.snapshot.windCalm, true);
});

test("B9-B provider parses gusts", async () => {
  const result = await fetchAviationWeatherMetar("LKPR", { fetchImpl: jsonFetch([validRecord]) });
  assert.equal(result.status, "ready");
  if (result.status === "ready") assert.equal(result.snapshot.windGustKt, 18);
});

test("B9-B provider sends the required FlyTally User-Agent", async () => {
  let userAgent: string | null = null;
  await fetchAviationWeatherMetar("LKPR", {
    fetchImpl: jsonFetch([validRecord], 200, (_input, init) => {
      userAgent = new Headers(init?.headers).get("User-Agent");
    }),
  });
  assert.equal(userAgent, "FlyTally-Training/0.0.1 (training-only)");
});

test("B9-B provider request contains only station/query metadata and no user identity", async () => {
  let requestedUrl = "";
  let headers = new Headers();
  await fetchAviationWeatherMetar("LKPR", {
    fetchImpl: jsonFetch([validRecord], 200, (input, init) => {
      requestedUrl = String(input);
      headers = new Headers(init?.headers);
    }),
  });
  const url = new URL(requestedUrl);
  assert.equal(url.origin, "https://aviationweather.gov");
  assert.equal(url.searchParams.get("ids"), "LKPR");
  assert.equal(url.searchParams.get("format"), "json");
  assert.equal(url.searchParams.get("taf"), "false");
  assert.equal(headers.get("Authorization"), null);
  assert.equal(headers.get("Cookie"), null);
});

import assert from "node:assert/strict";
import test from "node:test";

import { GET, dynamic, runtime } from "../app/api/weather/metar/route.ts";
import { clearServerCacheForTesting } from "../lib/weather/metar-cache.ts";

const validRecord = {
  station_id: "LKPR",
  raw_text: "LKPR 201630Z 25011KT 9999 16/08 Q1017",
  observation_time: "2026-09-20T16:30:00Z",
  temp: 16,
  dewp: 8,
  altim: 1017,
  wind_dir_degrees: 250,
  wind_speed_kt: 11,
};

async function withFetch<T>(fetchImpl: typeof fetch, run: () => Promise<T>): Promise<T> {
  const original = globalThis.fetch;
  globalThis.fetch = fetchImpl;
  try {
    return await run();
  } finally {
    globalThis.fetch = original;
  }
}

const jsonFetch = (body: unknown, status = 200, inspect?: (input: RequestInfo | URL, init?: RequestInit) => void): typeof fetch =>
  (async (input: RequestInfo | URL, init?: RequestInit) => {
    inspect?.(input, init);
    return new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

test("B9-B route returns normalized METAR snapshot", async () => {
  clearServerCacheForTesting();
  await withFetch(jsonFetch([validRecord]), async () => {
    const response = await GET(new Request("http://localhost/api/weather/metar?icao=LKPR"));
    assert.equal(response.status, 200);
    const body = await response.json() as { station: string; temperatureC: number };
    assert.equal(body.station, "LKPR");
    assert.equal(body.temperatureC, 16);
  });
});

test("B9-B route normalizes lowercase ICAO and rejects malformed ICAO", async () => {
  clearServerCacheForTesting();
  await withFetch(jsonFetch([validRecord]), async () => {
    const lower = await GET(new Request("http://localhost/api/weather/metar?icao=lkpr"));
    assert.equal(lower.status, 200);
  });
  const invalid = await GET(new Request("http://localhost/api/weather/metar?icao=LP"));
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { error: "invalid-icao" });
});

test("B9-B route serves a second request from the server cache", async () => {
  clearServerCacheForTesting();
  let calls = 0;
  await withFetch(jsonFetch([validRecord], 200, () => { calls += 1; }), async () => {
    const first = await GET(new Request("http://localhost/api/weather/metar?icao=LKPR"));
    const second = await GET(new Request("http://localhost/api/weather/metar?icao=LKPR"));
    assert.equal(first.headers.get("X-Metar-Source"), "aviationweather.gov");
    assert.equal(second.headers.get("X-Metar-Source"), "server-cache");
    assert.equal(calls, 1);
  });
});

test("B9-B route marks provider responses with their source", async () => {
  clearServerCacheForTesting();
  await withFetch(jsonFetch([validRecord]), async () => {
    const response = await GET(new Request("http://localhost/api/weather/metar?icao=LKPR"));
    assert.equal(response.headers.get("X-Metar-Source"), "aviationweather.gov");
  });
});

test("B9-B route always disables browser/proxy caching", async () => {
  clearServerCacheForTesting();
  await withFetch(jsonFetch([validRecord]), async () => {
    const response = await GET(new Request("http://localhost/api/weather/metar?icao=LKPR"));
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  });
});

test("B9-B route maps provider outage to HTTP 502", async () => {
  clearServerCacheForTesting();
  await withFetch((async () => new Response(null, { status: 500 })) as typeof fetch, async () => {
    const response = await GET(new Request("http://localhost/api/weather/metar?icao=LKPR"));
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: "provider-unavailable" });
  });
});

test("B9-B route forwards only the ICAO to Aviation Weather", async () => {
  clearServerCacheForTesting();
  let providerUrl = "";
  let providerHeaders = new Headers();
  await withFetch(jsonFetch([validRecord], 200, (input, init) => {
    providerUrl = String(input);
    providerHeaders = new Headers(init?.headers);
  }), async () => {
    await GET(new Request("http://localhost/api/weather/metar?icao=LKPR", {
      headers: {
        Cookie: "session=private",
        Authorization: "Bearer private",
      },
    }));
  });
  assert.equal(new URL(providerUrl).searchParams.get("ids"), "LKPR");
  assert.equal(providerHeaders.get("Cookie"), null);
  assert.equal(providerHeaders.get("Authorization"), null);
});

test("B9-B METAR route is dynamic Node runtime, not Edge", () => {
  assert.equal(runtime, "nodejs");
  assert.equal(dynamic, "force-dynamic");
});

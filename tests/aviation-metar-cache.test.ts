import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_EXPIRED_MS,
  CLIENT_KEY_PREFIX,
  CLIENT_STALE_MS,
  CLIENT_TTL_MS,
  SERVER_MAX_ENTRIES,
  SERVER_TTL_MS,
  classifyFreshness,
  clearClientCachedMetar,
  clearServerCacheForTesting,
  getClientCachedMetar,
  getServerCachedMetar,
  pruneServerCache,
  setClientCachedMetar,
  setServerCachedMetar,
} from "../lib/weather/metar-cache.ts";
import type { MetarSnapshot } from "../lib/weather/metar-types.ts";

const snapshot: MetarSnapshot = {
  station: "LKPR",
  observedAt: "2026-09-20T16:30:00.000Z",
  fetchedAt: "2026-09-20T16:31:00.000Z",
  rawText: "LKPR 201630Z 25011KT 9999 16/08 Q1017",
  temperatureC: 16,
  qnhHpa: 1017,
  altimeterInHg: 30.03,
  windDirectionTrueDeg: 250,
  windSpeedKt: 11,
  windVariable: false,
  windCalm: false,
  source: "aviationweather.gov",
};

class MemoryStorage implements Storage {
  #map = new Map<string, string>();
  get length() { return this.#map.size; }
  clear() { this.#map.clear(); }
  getItem(key: string) { return this.#map.get(key) ?? null; }
  key(index: number) { return [...this.#map.keys()][index] ?? null; }
  removeItem(key: string) { this.#map.delete(key); }
  setItem(key: string, value: string) { this.#map.set(key, value); }
}

function installWindow(storage = new MemoryStorage()): MemoryStorage {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storage },
  });
  return storage;
}

function removeWindow(): void {
  delete (globalThis as typeof globalThis & { window?: unknown }).window;
}

test("B9-B server cache returns a hit inside its TTL", () => {
  clearServerCacheForTesting();
  setServerCachedMetar("LKPR", { status: "ready", snapshot });
  assert.equal(getServerCachedMetar("lkpr")?.status, "ready");
});

test("B9-B server cache expires entries after five minutes", () => {
  clearServerCacheForTesting();
  setServerCachedMetar("LKPR", { status: "ready", snapshot });
  pruneServerCache(Date.now() + SERVER_TTL_MS + 1);
  assert.equal(getServerCachedMetar("LKPR"), null);
});

test("B9-B server cache evicts the least recently used entry above 200 stations", () => {
  clearServerCacheForTesting();
  for (let index = 0; index <= SERVER_MAX_ENTRIES; index += 1) {
    setServerCachedMetar(`T${String(index).padStart(3, "0")}`, { status: "ready", snapshot });
  }
  assert.equal(getServerCachedMetar("T000"), null);
  assert.equal(getServerCachedMetar(`T${String(SERVER_MAX_ENTRIES).padStart(3, "0")}`)?.status, "ready");
});

test("B9-B client cache round-trips a normalized snapshot", () => {
  const storage = installWindow();
  try {
    setClientCachedMetar("lkpr", snapshot);
    const cached = getClientCachedMetar("LKPR");
    assert.equal(cached?.snapshot.station, "LKPR");
    assert.ok(Number.isFinite(cached?.cachedAt));
    assert.ok(storage.getItem(`${CLIENT_KEY_PREFIX}LKPR`));
  } finally {
    removeWindow();
  }
});

test("B9-B client freshness boundaries classify live cached stale and expired", () => {
  const now = 10_000_000_000;
  assert.equal(classifyFreshness(now - CLIENT_TTL_MS + 1, now), "live");
  assert.equal(classifyFreshness(now - CLIENT_TTL_MS, now), "cached");
  assert.equal(classifyFreshness(now - CLIENT_STALE_MS, now), "stale");
  assert.equal(classifyFreshness(now - CLIENT_EXPIRED_MS, now), "expired");
});

test("B9-B malformed localStorage is ignored and removed", () => {
  const storage = installWindow();
  try {
    storage.setItem(`${CLIENT_KEY_PREFIX}LKPR`, "{");
    assert.equal(getClientCachedMetar("LKPR"), null);
    assert.equal(storage.getItem(`${CLIENT_KEY_PREFIX}LKPR`), null);
  } finally {
    removeWindow();
  }
});

test("B9-B client cache helpers are SSR-safe without window", () => {
  removeWindow();
  assert.equal(getClientCachedMetar("LKPR"), null);
  assert.doesNotThrow(() => setClientCachedMetar("LKPR", snapshot));
  assert.doesNotThrow(() => clearClientCachedMetar());
});

test("B9-B client cache can clear one station or every FlyTally METAR entry", () => {
  const storage = installWindow();
  try {
    setClientCachedMetar("LKPR", snapshot);
    setClientCachedMetar("EDDF", { ...snapshot, station: "EDDF" });
    storage.setItem("unrelated", "keep");
    clearClientCachedMetar("LKPR");
    assert.equal(getClientCachedMetar("LKPR"), null);
    assert.ok(getClientCachedMetar("EDDF"));
    clearClientCachedMetar();
    assert.equal(getClientCachedMetar("EDDF"), null);
    assert.equal(storage.getItem("unrelated"), "keep");
  } finally {
    removeWindow();
  }
});

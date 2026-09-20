import type { MetarCacheEntry, MetarFetchResult, MetarFreshness, MetarSnapshot } from "./metar-types.ts";
import { isMetarSnapshot } from "./metar-snapshot-helpers.ts";

export const SERVER_TTL_MS = 5 * 60 * 1000;
export const SERVER_MAX_ENTRIES = 200;
export const CLIENT_TTL_MS = 10 * 60 * 1000;
export const CLIENT_STALE_MS = 2 * 60 * 60 * 1000;
export const CLIENT_EXPIRED_MS = 12 * 60 * 60 * 1000;
export const CLIENT_KEY_PREFIX = "flytally:metar:v1:";

type ServerEntry = {
  readonly result: MetarFetchResult;
  readonly cachedAt: number;
};

const serverCache = new Map<string, ServerEntry>();

function normalizeIcao(icao: string): string {
  return icao.trim().toUpperCase();
}

export function pruneServerCache(now = Date.now()): void {
  for (const [icao, entry] of serverCache) {
    if (now - entry.cachedAt >= SERVER_TTL_MS) serverCache.delete(icao);
  }
  while (serverCache.size > SERVER_MAX_ENTRIES) {
    const oldest = serverCache.keys().next().value as string | undefined;
    if (!oldest) break;
    serverCache.delete(oldest);
  }
}

export function getServerCachedMetar(icao: string): MetarFetchResult | null {
  const key = normalizeIcao(icao);
  const entry = serverCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt >= SERVER_TTL_MS) {
    serverCache.delete(key);
    return null;
  }
  serverCache.delete(key);
  serverCache.set(key, entry);
  return entry.result;
}

export function setServerCachedMetar(icao: string, result: MetarFetchResult): void {
  const key = normalizeIcao(icao);
  serverCache.delete(key);
  serverCache.set(key, { result, cachedAt: Date.now() });
  pruneServerCache();
}

export function clearServerCacheForTesting(): void {
  serverCache.clear();
}

export function classifyFreshness(cachedAt: number, now = Date.now()): MetarFreshness {
  const age = Math.max(0, now - cachedAt);
  if (age < CLIENT_TTL_MS) return "live";
  if (age < CLIENT_STALE_MS) return "cached";
  if (age < CLIENT_EXPIRED_MS) return "stale";
  return "expired";
}

function clientStorage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function clientKey(icao: string): string {
  return `${CLIENT_KEY_PREFIX}${normalizeIcao(icao)}`;
}

export function getClientCachedMetar(icao: string): MetarCacheEntry | null {
  const storage = clientStorage();
  if (!storage) return null;
  const key = clientKey(icao);
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed
      || typeof parsed !== "object"
      || !Number.isFinite((parsed as { cachedAt?: unknown }).cachedAt)
      || !isMetarSnapshot((parsed as { snapshot?: unknown }).snapshot)
    ) {
      storage.removeItem(key);
      return null;
    }
    return parsed as MetarCacheEntry;
  } catch {
    try {
      storage.removeItem(key);
    } catch {}
    return null;
  }
}

export function setClientCachedMetar(icao: string, snapshot: MetarSnapshot): void {
  const storage = clientStorage();
  if (!storage) return;
  try {
    storage.setItem(clientKey(icao), JSON.stringify({ snapshot, cachedAt: Date.now() } satisfies MetarCacheEntry));
  } catch {}
}

export function clearClientCachedMetar(icao?: string): void {
  const storage = clientStorage();
  if (!storage) return;
  try {
    if (icao) {
      storage.removeItem(clientKey(icao));
      return;
    }
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(CLIENT_KEY_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => storage.removeItem(key));
  } catch {}
}

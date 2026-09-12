const serviceWorker = String.raw`
const FLIGHT_CACHE = "flytally-flight-v2";
const STATIC_CACHE = "flytally-static-v3";
const SHELL_CACHE = "flytally-shell-v1";
const SHELL_ASSETS = ["/manifest.webmanifest", "/pwa-icon"];
const FLIGHT_PATH = /\/aircraft\/[^/]+\/fly\/?$/;

async function cacheShell() {
  const cache = await caches.open(SHELL_CACHE);
  await Promise.allSettled(SHELL_ASSETS.map(async (path) => {
    const response = await fetch(path, { cache: "reload", credentials: "same-origin" });
    if (response.ok) await cache.put(path, response.clone());
  }));
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheShell().finally(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith("flytally-") && ![FLIGHT_CACHE, STATIC_CACHE, SHELL_CACHE].includes(name)).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

function canonicalFlightRequest(rawUrl) {
  const source = new URL(rawUrl, self.location.origin);
  if (source.origin !== self.location.origin || !FLIGHT_PATH.test(source.pathname)) return undefined;
  const canonical = new URL(source.pathname, source.origin);
  const variant = source.searchParams.get("variant");
  if (variant) canonical.searchParams.set("variant", variant);
  return new Request(canonical.toString(), { credentials: "same-origin" });
}

async function cacheAsset(url) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const response = await fetch(url, { credentials: "same-origin" });
    if (response.ok) await cache.put(url, response.clone());
  } catch {}
}

async function cacheFlightPage(rawUrl) {
  try {
    const source = new URL(rawUrl, self.location.origin);
    const cacheKey = canonicalFlightRequest(source.toString());
    if (!cacheKey) return false;
    const request = new Request(source.toString(), { credentials: "same-origin" });
    const response = await fetch(request);
    if (!response.ok) return false;
    const flightCache = await caches.open(FLIGHT_CACHE);
    await flightCache.put(cacheKey, response.clone());
    const html = await response.text();
    const assets = [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"?#]+(?:\?[^"#]*)?)"/g)].map((match) => new URL(match[1], self.location.origin).toString());
    await Promise.all([...new Set(assets)].map(cacheAsset));
    return true;
  } catch {
    return false;
  }
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_FLIGHT_PAGE" && typeof event.data.url === "string") {
    event.waitUntil((async () => {
      const ok = await cacheFlightPage(event.data.url);
      event.ports?.[0]?.postMessage({ type: "CACHE_FLIGHT_PAGE_RESULT", ok });
    })());
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(url.pathname, response.clone());
      return response;
    })());
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })());
    return;
  }

  if (request.mode === "navigate" && FLIGHT_PATH.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(FLIGHT_CACHE);
      const cacheKey = canonicalFlightRequest(request.url);
      if (!cacheKey) return fetch(request);
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(cacheKey, response.clone());
        return response;
      } catch {
        const cached = await cache.match(cacheKey);
        if (cached) return cached;
        return new Response("FlyTally Flight Deck is not cached for this aircraft configuration on this device yet.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    })());
  }
});
`;

export const dynamic = "force-static";

export async function GET() {
  return new Response(serviceWorker, {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Type": "application/javascript; charset=utf-8",
      "Service-Worker-Allowed": "/",
    },
  });
}

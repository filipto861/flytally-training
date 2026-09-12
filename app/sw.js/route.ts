const serviceWorker = String.raw`
const FLIGHT_CACHE = "flytally-flight-v1";
const STATIC_CACHE = "flytally-static-v1";
const FLIGHT_PATH = /\/aircraft\/[^/]+\/fly\/?$/;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith("flytally-") && ![FLIGHT_CACHE, STATIC_CACHE].includes(name)).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function cacheAsset(url) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const response = await fetch(url, { credentials: "same-origin" });
    if (response.ok) await cache.put(url, response.clone());
  } catch {}
}

async function cacheFlightPage(rawUrl) {
  const url = new URL(rawUrl, self.location.origin);
  if (url.origin !== self.location.origin || !FLIGHT_PATH.test(url.pathname)) return;
  const request = new Request(url.toString(), { credentials: "same-origin" });
  const response = await fetch(request);
  if (!response.ok) return;
  const flightCache = await caches.open(FLIGHT_CACHE);
  await flightCache.put(request, response.clone());
  const html = await response.text();
  const assets = [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"?#]+(?:\?[^"#]*)?)"/g)].map((match) => new URL(match[1], self.location.origin).toString());
  await Promise.all([...new Set(assets)].map(cacheAsset));
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_FLIGHT_PAGE" && typeof event.data.url === "string") {
    event.waitUntil(cacheFlightPage(event.data.url));
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

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
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        const cached = await cache.match(request, { ignoreSearch: true });
        if (cached) return cached;
        return new Response("FlyTally Flight Deck is not cached on this device yet.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
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

# M58 — Mobile PWA install and offline shell

M58 finishes the next mobile/PWA layer without changing aircraft content or operational calculations.

## Scope

- The aircraft library can offer installation on supported mobile browsers.
- Chromium-family browsers use the native `beforeinstallprompt` flow when the browser exposes it.
- iPhone/iPad users get the explicit Safari **Share → Add to Home Screen** instruction instead of a fake install prompt.
- The prompt is hidden when Training is already running in standalone mode and can be dismissed persistently on the device.
- Installation UI stays out of the Fly cockpit surface.

## App identity

The web manifest now has an explicit application id and scope and uses a same-origin `/pwa-icon` asset. The root metadata also advertises Apple standalone capability. `/pwa-icon` proxies the canonical FlyTally mark from `fly-tally.com`; Training therefore does not redraw or approximate the brand asset and the service worker can cache it as a same-origin resource.

## Offline boundary

The service worker precaches only PWA support assets (`/manifest.webmanifest` and `/pwa-icon`) into a dedicated shell cache. The existing operational Fly cache remains configuration-aware and is still populated explicitly through `CACHE_FLIGHT_PAGE`. M58 does not introduce blanket caching for authenticated learner or administration pages.

Static Next.js chunks remain cache-first after they have been discovered through a prepared Fly page. The existing variant-safe offline fallback is unchanged.

## Mobile presentation

The install affordance is an in-flow library card with 44 px minimum controls and no fixed overlay, so it does not compete with the mobile bottom navigation or cockpit controls. M56/M57 safe-area, compact-header and screen-space rules remain in force.

## Acceptance boundary

Automated coverage verifies metadata, the canonical icon proxy, install-event handling, iOS guidance, mobile touch targets and the continued Fly-only navigation cache contract. A final real-device check is still required for Safari Add to Home Screen, standalone launch chrome and a true offline reload because those behaviors cannot be physically exercised by repository CI.

# M56 — Mobile app UI

M56 deliberately shifts the roadmap back to pilot-facing UI instead of platform consolidation.

## Scope

- Treat the aircraft workspace as a mobile application surface rather than a responsive website.
- Respect iOS/installed-PWA safe areas at both the top header and bottom controls.
- Replace the floating mobile navigation pill with a full-width native-style bottom tab bar.
- Keep the website footer out of the signed-in/aircraft workspace while retaining it on non-aircraft surfaces.
- Establish one explicit sticky hierarchy in Fly: global header, Fly tool tabs, then the local checklist/emergency control.
- Keep sticky checklist actions and performance results above the bottom tab bar.
- Reduce decorative elevation on mobile cards without changing content hierarchy or touch targets.

## Non-goals

- No FlyTally platform merge, shared-domain routing or Logbook integration.
- No aircraft-data, procedure, performance, interpolation or applicability changes.
- No navigation destinations are added or removed.
- Desktop layout remains unchanged outside the mobile breakpoint.

## Acceptance

Automated source contracts cover safe-area usage, bottom-nav geometry, sticky offsets and aircraft-agnostic styling. Final physical acceptance still requires an iPhone/PWA pass because browser chrome, installed mode and safe-area behavior cannot be proven by CI alone.

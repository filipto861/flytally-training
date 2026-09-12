# M53 — Operational Fly data boundary and offline hardening

M53 makes the existing Fly deck smaller and safer without adding another cockpit tool.

## Operational data boundary

The server now maps published/configuration-filtered content to dedicated Fly DTOs before it crosses into the client FlightDeck.

### Checklist

Fly receives only:

- aircraft/title identity;
- phase id/title;
- item id, challenge and response;
- operational WARNING/CAUTION notices.

Training-only explanation, verification, procedure links, source labels, estimated lesson time and note commentary are removed before serialization.

### Performance

Fly receives only the fields the calculator engine needs:

- dataset id/title/kind/interpolation policy;
- axes and output definitions;
- numeric/source rows.

Reference description, notes, applicability metadata and source drawers are not sent to the cockpit client. Configuration applicability is resolved before this mapping.

### Emergency

Validated universal abnormal/emergency content is configuration-filtered first and then mapped directly to an operational QRH DTO. The client receives only:

- procedure id/title/category/phase;
- operational notices and configuration/authority boundary notes;
- stage labels;
- exact ordered `expectedResponse` actions;
- source chapter/page references required by the collapsed authority panel.

Training fields such as setup, objectives, debrief, prompt, explanation, difficulty, minutes, summary and scoring mechanics never cross the Fly client boundary.

## Offline hardening

The service-worker cache moves to v2 and uses a canonical Fly cache key that preserves the selected aircraft variant while dropping unrelated query parameters. This prevents an offline request for one variant from falling back to a cached page for another variant.

`Offline ready` is no longer optimistic. The client requests caching through a `MessageChannel` and waits for a positive service-worker acknowledgement (with a Cache Storage verification fallback for an upgrading worker) before displaying the ready state.

Static Next.js assets are still cached for the Fly route, and offline navigation remains network-first with an exact configuration-safe cache fallback.

## Non-goals

M53 does not add any new Fly tabs, change source aircraft data, change M52 interpolation policy, or alter Learn/Reference training content.

# M7 — Persistence & FlyTally Identity

M7 replaces browser-only progress as the source of truth for signed-in users while retaining local progress as an offline/anonymous cache.

## Data flow

`training UI -> progress client -> /api/progress -> verified Training session -> TrainingProgressRepository -> Training PostgreSQL`

The same `TrainingProgressEvent` emitted by M6 remains the domain event. M7 adds stable event ids for idempotent sync.

## PostgreSQL records

`training_progress_events` stores append-only attempts and completions by account subject and aircraft id. A unique `(account_subject, event_id)` constraint makes local-to-account sync retry-safe.

`training_aircraft_state` stores the latest activity pointer for each account/aircraft pair so cross-device continuation has a stable resume state.

The schema is created lazily by the server-side repository and is never evaluated during Next.js build-time module loading.

## Local migration

Existing M6 localStorage events are assigned stable ids once, retained as a local cache, and uploaded after a FlyTally account session becomes available. Remote events then refresh the local cache. Anonymous/offline use continues to work.

## Separation from content

Progress references aircraft/content by stable ids but does not own technical content and does not depend on the content approval lifecycle. M8 can move aircraft training content into PostgreSQL independently.

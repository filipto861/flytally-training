# v3.1 M2C — PostgreSQL second-aircraft acceptance

## Purpose

M2C turns the multi-aircraft calculator work into an end-to-end governed persistence test rather than relying only on TypeScript contracts and in-memory fixtures.

The disposable acceptance aircraft publishes:

- universal checklists and procedures,
- a takeoff distance-factor dataset using `massBand` and `dampPenalty`,
- a landing distance-factor dataset using `runwayCondition`, `multiplier` and a declared temperature constraint,
- a generic landing metric lookup using `landingMass`, `referenceVelocity` and `approachVelocity`,
- Weight & Balance with lb / in / lb·in / US gal pilot-facing units.

None of these performance semantics require learner-facing aircraft branches or the historical `weight`, `surface`, `vref`, `vapp`, `wet8` or `wet20` conventions.

## Acceptance flow

The existing destructive harness now validates and publishes those payloads through the normal governed lifecycle, publishes the synthetic aircraft, reads everything through `PostgresTrainingContentRepository`, applies the selected variant, then executes the generic performance and W&B runtime against the database-returned JSON.

The synthetic aircraft is removed by cascade in `finally`.

## Evidence boundary

The ordinary unit suite exercises the identical fixture after a JSON serialize/parse round-trip. This proves the contracts and generic runtime in normal CI.

M2 is **not** considered fully closed until `npm run test:no-code-aircraft` succeeds against an explicitly confirmed disposable PostgreSQL database. This run performs writes and cleanup and therefore remains behind the existing explicit destructive-test confirmation.


## Final evidence — 2026-09-18

M2C is closed.

GitHub Actions run **35375263162** completed successfully against the explicitly approved disposable Neon branch `FlyTally Training Acceptance / no-code-acceptance-20260910`.

The final run passed the endpoint pinning guard, installed the locked dependency set, executed `npm run test:no-code-aircraft`, published/read back the synthetic second aircraft through PostgreSQL, executed the generic performance and Weight & Balance runtime from the stored payloads, and completed cleanup.

During closure, the destructive harness also exposed and fixed three fixture-governance defects rather than bypassing them: every referenced variant is registered, operational content uses operational source authority, and embedded payload provenance is bound to the registered manual family. The final read-back also confirms Weight & Balance capability discovery.

**M2 acceptance status: PASS.**

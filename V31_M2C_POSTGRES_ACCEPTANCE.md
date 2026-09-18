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

# v3.1 M5 — Real second-aircraft operational acceptance

## M5A — runtime boundaries and performance migration adapter

**Status: implemented; full M5 acceptance remains in progress.**

M5 uses the production second-aircraft package accepted in M4 and validates learner behavior rather than only governed data presence.

### Production shape entering M5

The real package publishes eight universal domains:

- checklists
- procedures
- performance
- weight-balance
- limitations
- systems
- abnormal
- knowledge

It intentionally does **not** publish every possible Training domain. That makes it useful for sparse-module acceptance: Home / Learn / Reference must derive their UI from capabilities and must not synthesize missing Quick Start, cockpit orientation, flows or avionics content.

### Flight Deck metadata defect found by M5

M5 found a generic bug in the server-to-Flight-Deck mapper: `toOperationalPerformanceDatasets` copied axes, outputs and rows but dropped v3.1 `phase` and `calculator` metadata.

That meant a correctly published declarative calculator could lose its contract before reaching Fly.

M5A fixes the boundary by preserving both fields in the operational transport shape. This is required for every future aircraft, not only the production second aircraft.

### Pre-v3.1 runway-grid migration boundary

The production second-aircraft performance package predates the M2 declarative calculator contract. Its takeoff and landing runway grids use the old structural convention:

- `airportAltitudeFt`
- `isaDeviationC`
- `surface`
- `oatC`
- `groundRunM`
- `distance50ftM`

M5A introduces one isolated compatibility adapter that recognizes only this already-published legacy shape and materializes an explicit `runway-distance-grid` contract in memory.

The adapter:

- has no aircraft/manufacturer/model checks,
- never changes source rows,
- never changes interpolation policy,
- never extrapolates,
- leaves already-declarative datasets untouched,
- routes the migrated grid through the same `DeclarativePerformanceWorkspace` used by new Studio-authored aircraft.

New content is **not** allowed to depend on this convention; Studio continues to publish explicit calculator bindings.

### Runtime guards added

M5A adds regressions for:

- declarative metadata surviving Flight Deck transport,
- a legacy runway grid entering the declarative runtime without data mutation,
- already-declarative data remaining untouched,
- sparse capability discovery,
- per-aircraft progress isolation,
- capability-driven Home / Fly / Learn / Reference,
- configuration-driven Fly filtering,
- no second-aircraft identity in learner/core code.

## Remaining M5

M5 still needs final operational acceptance evidence for:

1. real configuration applicability,
2. reference/learning sparse-domain behavior,
3. representative Performance calculations against the published source grid,
4. Weight & Balance representative calculation,
5. final Home / Fly / Learn / Reference acceptance boundary.

M5 is not closed until those checks are recorded and green.

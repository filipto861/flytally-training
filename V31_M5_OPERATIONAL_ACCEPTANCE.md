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


## M5B — real source-backed operational values

Production read-only inspection and the controlled flight-manual source were reduced to a small deterministic acceptance fixture. The fixture is test evidence only and is never imported by learner runtime code.

### Configuration / applicability

The production aircraft has one explicit selectable configuration, `sn809-2025`. With no query parameter, the generic single-variant selection rule selects it automatically. Published performance and W&B data are scoped to that variant.

Acceptance proves:

- the configured aircraft receives the S/N-specific datasets,
- the stored engine/propeller equipment is present in the resolved configuration,
- a different configuration receives neither the performance grids nor the W&B payload.

### Runway-grid calculations

Representative effective production rows for a concrete runway at sea level / ISA are:

| Operation | OAT | Ground run | Distance over 50 ft |
| --- | ---: | ---: | ---: |
| Takeoff | 15 °C | 140 m | 380 m |
| Landing | 15 °C | 90 m | 290 m |

Both exact-row calculations are asserted through the generic runtime after the v3.1 compatibility materialization.

The takeoff fixture also carries the 0 / 2,000 ft and ISA / ISA+10 bounding rows. At 1,000 ft and 18 °C, the source-authorized bounded interpolation resolves ISA+5 and produces 155 m ground run / 420 m over 50 ft. A 3,000 ft request against that reduced acceptance envelope is rejected rather than extrapolated.

### Weight & Balance

The effective production W&B data used in the acceptance fixture include:

- empty mass 382 kg,
- empty arm 744.15 mm,
- MTOW/MLW 600 kg,
- CG envelope 750–885 mm,
- pilot/passenger arm 1,156 mm,
- rear baggage arm 1,806 mm,
- wing baggage arm 1,036 mm,
- fuel arm 606 mm,
- fuel density 0.725 kg/l.

Representative loading:

- pilot 80 kg,
- passenger 70 kg,
- rear baggage 10 kg,
- takeoff fuel 60 l,
- landing fuel 30 l.

Generic W&B runtime result:

- takeoff 585.5 kg / 857.534 mm CG,
- landing 563.75 kg / 867.238 mm CG,
- both inside mass and CG limits.

This proves the real second-aircraft loading data execute through the same generic normalized W&B engine as the M2 synthetic acceptance aircraft.

## Remaining M5 closure

The numerical/configuration runtime is now covered. M5 closure still records the route/capability acceptance as one explicit matrix and confirms that the merged runtime build/deployment is healthy before advancing to M6.


## M5C — learner route / sparse capability matrix ✅

The effective production domain set is:

`checklists · procedures · performance · weight-balance · limitations · systems · abnormal · knowledge`

The generic capability model therefore produces the following real-aircraft learner surface without synthesizing absent modules:

| Surface | Available from the production package |
| --- | --- |
| **Home** | Fly · Learn · Reference · Abnormal & Emergency |
| **Fly** | Checklist · Performance · Emergency |
| **Learn / Start here** | Checklist training |
| **Learn / Study by area** | Systems · Procedures · Knowledge |
| **Reference / Quick access** | Quick Reference · Abnormal & Emergency |
| **Reference / Tools** | Performance · Weight & Balance · Limitations |
| **Intentionally absent** | Quick Start · Cockpit Orientation · Flows · Avionics |

Quick Reference is available because both Performance and Limitations are published. No placeholder route is created for a missing learner domain.

### Progress

Training progress remains isolated by `aircraftId` in both browser persistence and PostgreSQL state/event queries. The M5 regression suite proves that events from the reference aircraft do not enter the second-aircraft summary or storage namespace.

### Configuration

The real aircraft has one selectable variant. The generic variant resolver therefore auto-selects it when no variant query is supplied. Variant-scoped production content is admitted for that configuration and rejected for an unrelated configuration.

Read-only production inspection found 35 applicability blocks across the current live abnormal, knowledge, limitations, performance, systems and W&B payloads; all are represented as governed data rather than learner code branches.

### Acceptance method

There is no browser automation connector available in this development session, so M5 does not claim a manual click-through session. The operational acceptance evidence is instead composed of:

- read-only inspection of the effective production PostgreSQL package,
- source-backed real-aircraft fixtures copied from those effective published payloads,
- the same generic runtime functions used by learner routes,
- route/capability regression guards,
- TypeScript, unit/regression and production-build CI.

This is sufficient to verify the architecture/runtime boundary without pretending a browser session occurred.

## Final M5 result

M5 found and fixed one genuine generic runtime defect: the server-to-Fly mapper had been dropping declarative `phase` / `calculator` metadata.

After the fix:

- declared calculator metadata survives the Fly transport boundary,
- the real pre-v3.1 runway grids enter the declarative workspace through an isolated compatibility adapter,
- exact and bounded source-backed runway calculations pass,
- extrapolation remains rejected,
- the real W&B package calculates correctly,
- configuration applicability fails closed,
- sparse Home / Fly / Learn / Reference surfaces derive from published capabilities,
- progress remains aircraft-scoped,
- no second-aircraft-specific learner/core branch is introduced.

**M5 acceptance: PASS.**

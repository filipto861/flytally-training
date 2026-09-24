# FlyTally Training Roadmap

**Status:** Active  
**Owner:** Filip Točík  
**Last updated:** 2026-09-24

> This file is the single authoritative product/implementation roadmap for FlyTally Training.
> Historical milestone/specification documents may remain in the repository as implementation evidence,
> but they are not roadmaps and must not override this file or current executable contracts.

## Product direction

FlyTally Training now has two explicit product modes:

- **LEARN** — aircraft knowledge, systems, procedures, limitations, reference and training.
- **EFB** — operational flight tools: Flight Brief, Performance, operational checklist/QRH and future W&B.

Core ownership rule:

> **Active Flight defines what flight. Performance defines what calculation.**

The product must keep learning state separate from operational flight state. Source-backed aviation data remains fail-closed: no silent extrapolation, fabricated values, active-runway guessing, or unsupported corrections.

## Current baseline

Reference aircraft: **Learjet 35A/36A**

Completed foundations:

- governed aircraft performance configuration;
- real airport/runway-end domain with OurAirports provenance;
- Active Flight creation without mandatory runway/flaps;
- operation-owned Takeoff setup;
- AviationWeather.gov METAR integration;
- source-backed Takeoff N1 / V1 / VR / V2 / Takeoff Distance;
- explicit Calculate/Recalculate workflow;
- persisted Takeoff result with dependency-based stale detection;
- responsive UX6 shell on desktop, iPad and mobile.

Latest completed functional phase:

- **B4 Integrated Takeoff Performance — merged via PR #210**
- **P1.1 LEARN / EFB product mode split — merged via PR #211**
- **P1.1 production follow-up — merged via PR #213**; EFB top-bar Active Flight status now reconciles local/anonymous and server state consistently.
- P1.1 final follow-up gate: 1032 Node tests passed, 1 skipped, build passed, Playwright 360/360.
- **P1.2 Versioned Performance Snapshot V2 — merged via PR #214**; Takeoff now persists V2 snapshots with explicit provenance and operation-scoped validity inputs, while Landing V2 contract/storage identity is defined for B5.
- P1.2 final gate: 1041 Node tests passed, 1 skipped, build passed, Playwright 360/360.
- **P1.3 Canonical Performance operation controller — merged via PR #215**; Takeoff operation state now has one controller for setup, AVAILABLE/APPLIED weather, validity, calculation and V2 persistence.
- P1.3 final gate: 1050 Node tests passed, 1 skipped, build passed, Playwright 364/364.

## Phase 1 — LEARN / EFB separation and Performance operation architecture

Architecture is frozen. Implement sequentially; do not combine phases into one PR.

### P1.1 — LEARN / EFB product mode split — COMPLETE · PR #211 + follow-up PR #213

Goal: make user intent explicit before entering the aircraft workspace.

LEARN contains only learning/knowledge surfaces:
- Learn home / training;
- Systems;
- Procedures;
- Limitations;
- Reference;
- scenarios/orientation where applicable.

EFB contains only operational surfaces:
- Flight Brief;
- Performance;
- operational checklist;
- QRH / abnormal quick reference;
- future W&B when source-backed.

Rules:
- aircraft/variant is shared context, not an EFB destination;
- legacy routes remain compatible;
- no Performance math/storage changes in P1.1;
- preserve UX6 visual language and responsive behavior.

### P1.2 — Versioned Performance Snapshot V2 — COMPLETE · PR #214

Introduce:
- `schemaVersion: 2`;
- `TakeoffSnapshotV2`;
- `LandingSnapshotV2`;
- separate operation storage identity;
- explicit source/input/result/validity contracts.

Legacy v1 migration rule:
- preserve known QNH/OAT/result values;
- do not fabricate weather observation identity;
- mark weather provenance as legacy/unknown;
- migrated legacy result may be shown as historical/stored but requires recalculation before it becomes fully CURRENT V2 operational data;
- retain v1 storage key as read/migration fallback.

`dependencySnapshotId` is audit/debug metadata only, not an operation validity dependency.

### P1.3 — Canonical Performance operation controller — COMPLETE · PR #215

Introduce one shared operation state owner, conceptually:

- `usePerformanceOperation("TAKEOFF")`;
- `usePerformanceOperation("LANDING")`.

Owns:
- setup;
- applied weather;
- available weather observation;
- result snapshot;
- validity/diff;
- calculate/recalculate;
- manual override;
- apply latest METAR.

Weather rule:
- AVAILABLE observation and APPLIED weather are separate;
- before calculation, clean AUTO bindings may follow latest METAR;
- after calculation, newer METAR must not silently replace applied inputs;
- show **NEWER WEATHER AVAILABLE** and require explicit **APPLY & RECALCULATE**;
- manual overrides remain sticky;
- displayed wind must correspond to APPLIED weather, not merely latest fetched METAR.

No Takeoff wind correction math in this phase.

### P1.4 — Flight Brief becomes EFB home — IN PROGRESS · PR #216

Flight Brief is the EFB landing surface.

It may initiate Performance through the same canonical operation controller/snapshot, but it does not own a second calculator or persistence model.

Target behavior:
- Takeoff card: runway, N1, V1, VR, V2, TOD, validity state;
- Calculate/Edit opens shared responsive sheet/drawer;
- dedicated Performance page remains available;
- desktop side drawer; iPad/mobile responsive sheet/full-height treatment.

## B5 — Integrated Landing Performance — NEXT AFTER PHASE 1

Destination-owned Landing workflow reusing the same operation architecture:

- destination RunwayEnd;
- destination METAR;
- Landing weight;
- governed Flaps 40 configuration;
- explicit Calculate Landing;
- independent Landing snapshot/invalidation;
- Flight Brief integration.

Existing source-backed Learjet data available now:
- VREF vs gross weight;
- Landing Climb Speed vs gross weight;
- Approach Climb Speed vs gross weight;
- Factored Landing Distance Flaps 40 vs pressure altitude / OAT / gross weight.

Do not add unsupported wind/slope/declared-distance corrections until source extraction is complete.

## Takeoff wind correction — PLANNED AFTER PHASE 1

Source topology is frozen as two independent post-baseline transforms:

- `(zeroWindDistanceFt, runwayWindComponentKt) -> correctedTakeoffDistanceFt`
- `(zeroWindV1Kias, runwayWindComponentKt) -> correctedV1Kias`

Requirements:
- digitize directly from the highest-quality AFM/FlightSafety chart;
- verify multiple zero-wind ordinates;
- explicitly re-check the suspicious 8,000/10,000 ft region before authoring production data;
- extract headwind and tailwind envelopes independently;
- do not assume symmetry;
- validate against FlightSafety worked examples;
- no extrapolation outside published source envelope.

Diagnostic measurements made during architecture review are topology evidence only, not production data.

## Partial Power / Reduced Thrust Takeoff — PLANNED

Raw source extraction may proceed independently after Phase 1.

Required source datasets:
- no thrust reversers;
- Aeronca thrust reversers;
- TR-4000 thrust reversers.

Source procedure:
1. determine highest allowable Assumed Temperature from runway/weight constraints;
2. determine V1 using that Assumed Temperature;
3. determine reduced N1 from Ambient Temperature + Assumed Temperature;
4. enforce aircraft/configuration applicability and source limits.

Solver/runtime waits until:
- Snapshot V2/weather applied-state exists;
- wind datasets are authoritative;
- applicability contract is complete;
- declared-distance/TORA workflow is frozen.

## Runway declared distances

Physical runway surface length is not TORA/ASDA/TODA/LDA.

Until an authoritative declared-distance source exists:
- display physical runway length only as context;
- do not silently treat it as TORA;
- runway-limited/Partial Power calculations must use an explicit declared-distance input or future authoritative provider.

## Later product work

After Landing + wind + Partial Power:
- Flight Brief Takeoff/Landing convergence;
- source-backed operational W&B where available;
- navigation/icon cleanup;
- second/third aircraft acceptance against the same LEARN/EFB and Performance contracts;
- legacy compatibility cleanup once migration telemetry/tests prove it is safe.

## Global acceptance principles

- one authoritative roadmap: this file;
- aircraft-agnostic runtime, aircraft-specific governed data;
- explicit Calculate action;
- no hidden recalculation;
- immutable calculation snapshots;
- operation-scoped invalidation;
- source provenance visible and auditable;
- manual overrides explicit and sticky;
- no arbitrary METAR operational-expiry thresholds;
- no silent extrapolation;
- no fabricated aviation authority;
- desktop/iPad/mobile acceptance required before merge.

## Active implementation order

1. **P1.1 — LEARN / EFB split + Active Flight top-bar reconciliation** — COMPLETE · PR #211 + PR #213
2. **P1.2 — Snapshot V2** — COMPLETE · PR #214
3. **P1.3 — canonical Performance operation controller** — COMPLETE · PR #215
4. **P1.4 — Flight Brief EFB home** — IN PROGRESS · PR #216
5. B5 — Landing integration
6. Takeoff wind source extraction + runtime
7. Partial Power source extraction + solver/runtime
8. Declared-distance provider/input hardening

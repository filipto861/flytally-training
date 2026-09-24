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
- operation-owned Takeoff and Landing setup;
- AviationWeather.gov METAR integration;
- source-backed Takeoff N1 / V1 / VR / V2 / Takeoff Distance;
- source-backed Landing VREF / Landing Climb / Approach Climb / Factored Landing Distance;
- explicit Calculate/Recalculate workflow;
- persisted versioned Takeoff and Landing results with dependency-based stale detection;
- shared responsive Performance editor from dedicated Performance and Flight Brief;
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
- **P1.4 Flight Brief EFB home — merged via PR #216**; Flight Brief now surfaces canonical Takeoff status/results and opens the shared responsive Performance editor without creating a second calculator or persistence model.
- P1.4 final gate: 1057 Node tests passed, 1 skipped, build passed, Playwright 368/368.
- **B5 Integrated Landing Performance — merged via PR #217**; destination-owned Landing now shares the canonical Performance architecture while retaining independent setup, snapshot and invalidation.
- B5 final gate on head `b4472795223c6815c0a55e016ea8708a9632b523`: 1066 Node total / 1065 passed / 0 failed / 1 skipped, production build passed, full Playwright 372 passed with 8 stale-assumption failures, exact targeted rerun 8/8 passed after test-only correction. Production smoke passed after merge commit `839dc30b4bf9261d43737566e6c653322c56984f`.

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

### P1.4 — Flight Brief becomes EFB home — COMPLETE · PR #216

Flight Brief is the EFB landing surface.

It may initiate Performance through the same canonical operation controller/snapshot, but it does not own a second calculator or persistence model.

Target behavior:
- Takeoff card: runway, N1, V1, VR, V2, TOD, validity state;
- Calculate/Edit opens shared responsive sheet/drawer;
- dedicated Performance page remains available;
- desktop side drawer; iPad/mobile responsive sheet/full-height treatment.

## B5 — Integrated Landing Performance — COMPLETE · PR #217

Destination-owned Landing workflow reusing the same operation architecture:

- destination RunwayEnd;
- destination METAR;
- Landing weight;
- governed Flaps 40 configuration;
- explicit Calculate Landing;
- independent Landing snapshot/invalidation;
- Flight Brief integration.

Canonical source-backed outputs:
- VREF vs gross weight;
- Landing Climb Speed vs gross weight;
- Approach Climb Speed vs gross weight;
- Factored Landing Distance Flaps 40 vs pressure altitude / OAT / gross weight.

B5 intentionally does not apply unsupported wind/slope/declared-distance corrections.

## B6 — Takeoff wind correction — COMPLETE · PR #218

B6 acceptance complete (2026-09-24). Gate progression: generic runtime **38/38 PASS**; source-grid gate **48/48 PASS**; canonical operation gate **81/81 PASS**; post-race-fix targeted gate **35/35 PASS**; production build PASS; targeted responsive Playwright **4/4 PASS**; final full Node suite **1092 total / 1091 PASS / 0 FAIL / 1 SKIP**; final production build PASS; full Playwright **384/384 PASS** across desktop, mobile, iPad landscape and iPad portrait.

Source topology is frozen as two independent post-baseline transforms:

- `(zeroWindDistanceFt, runwayWindComponentKt) -> correctedTakeoffDistanceFt`
- `(zeroWindV1Kias, runwayWindComponentKt) -> correctedV1Kias`

The baseline remains the existing governed zero-wind dry-runway calculation. Wind correction is applied only after that baseline resolves successfully.

### B6.1 — source extraction and correction contract

- source chart: Learjet 35A/36A AFM takeoff-distance and V1 wind panels as reproduced in FlightSafety Chapter 20 / Figures 20-2 and 20-3;
- preserve the chart wind convention explicitly: tailwind negative input, headwind positive input;
- digitize headwind and tailwind envelopes independently;
- verify several zero-wind ordinates across the chart, not a single worked example;
- explicitly re-check the suspicious 8,000/10,000 ft takeoff-distance region before authoring production data;
- include source provenance and extraction notes with the governed data;
- no extrapolation beyond the published chart envelope.

### B6.2 — generic correction runtime

- runtime remains aircraft-agnostic;
- introduce a declarative post-baseline transform contract rather than Learjet-specific math;
- independently evaluate distance and V1 wind corrections;
- exact source points and bounded interpolation only;
- fail closed for unsupported baseline/wind combinations;
- preserve uncorrected VR, V2 and N1 behavior.

### B6.3 — operation integration

- use the already-computed APPLIED runway wind component from the canonical Takeoff operation controller;
- snapshot stores the corrected operational outputs and sufficient provenance/input identity to invalidate when applied wind changes;
- newer AVAILABLE weather must still require explicit apply/recalculate after a result exists;
- manual weather override remains sticky;
- zero-wind result must be identical to the existing B4/P1 baseline.

### B6.4 — acceptance

- source-node tests for both distance and V1 transforms;
- interpolation tests for headwind and tailwind separately;
- zero-wind identity tests across multiple baseline ordinates;
- no-extrapolation tests at wind and baseline-distance/V1 bounds;
- FlightSafety worked-example cross-check where the source gives enough information;
- snapshot invalidation on applied-wind change;
- regression coverage proving VR/V2/N1 and Landing are unchanged;
- desktop/iPad/mobile Playwright acceptance before merge.

## Partial Power / Reduced Thrust Takeoff — PP.3 SOURCE/RUNTIME BOUNDARY COMPLETE · PR #222

Raw source extraction may proceed independently after B6 source/runtime boundaries are frozen.

Required source datasets:
- no thrust reversers;
- Aeronca thrust reversers;
- TR-4000 thrust reversers.

Source procedure:
1. determine highest allowable Assumed Temperature from runway/weight constraints;
2. determine V1 using that Assumed Temperature;
3. determine reduced N1 from Ambient Temperature + Assumed Temperature;
4. enforce aircraft/configuration applicability and source limits.

Solver/runtime prerequisites:
- Snapshot V2/weather applied-state — COMPLETE;
- verified Flaps 8 wind datasets — COMPLETE; Flaps 20 nonzero-wind remains fail-closed;
- declared-distance TORA/ASDA workflow — COMPLETE · PR #220;
- Takeoff Weight Limits at ambient and assumed temperature — STAGED in PP.2;
- P-6/P-6.1 parenthesized N1 semantics — unresolved and still fail-closed for operational N1 use.

## Runway declared distances — COMPLETE · PR #220

Physical runway surface length is not TORA/ASDA/TODA/LDA.

The generic declared-distance contract requires explicit per-value provenance and provides a fail-closed Learjet takeoff constraint of `min(TORA, ASDA)`. This contract is not a dependency of the existing full-rated Takeoff calculation.

Current UX follow-up on `feat/performance-interpolation-loading`:
- selecting a runway prefills the visible TORA field from the bundled airport database physical runway length as a **suggestion only**;
- the suggestion is explicitly labeled as non-authoritative and does not enter the declared-distance contract until the pilot confirms or edits it;
- ASDA is moved out of the primary setup grid into declared-distance details;
- ASDA is never silently assumed equal to TORA because a separately declared ASDA may differ;
- a future authoritative declared-distance provider can replace the suggestion through the existing provider boundary.

For the Learjet 35/36 takeoff-field-length chart topology, usable takeoff runway remains limited by the lower of authoritative/confirmed TORA and ASDA; TODA is not substituted.

## Continuous performance interpolation + calculation feedback — COMPLETE · PR #223

User-facing goal: ordinary in-envelope inputs must not be forced onto table breakpoints.

Rules:
- every numeric source grid declared `linear-explicit` uses bounded interpolation between complete published source corners;
- fractional pressure altitude, OAT, weight and supported wind values are accepted inside the source envelope;
- Takeoff Distance / V1 Flaps 8 wind transforms retain signed-wind interpolation between their published headwind/tailwind nodes;
- Partial Power assumed temperature is searched continuously at 0.1°C resolution across the published Takeoff Weight Limit envelope instead of only at table temperature nodes;
- Aeronca reduced N1 may follow the W1072-authorized bounded interpolation already established in PP.3;
- runway length is a continuous constraint, not a lookup breakpoint;
- sparse source regions still fail closed;
- negative derived pressure altitude uses the published **S.L. chart floor** rather than failing below the first table row;
- no arbitrary mathematical extrapolation beyond an authoritative source envelope;
- where a checklist table is narrower than the underlying AFM chart, extend the governed dataset from the AFM chart instead of extrapolating the checklist-table edge;
- missing configuration-specific source data is not fabricated. In particular, Flaps 20 nonzero-wind Takeoff correction remains fail-closed until a verified source is digitized.

UX:
- Calculate/Recalculate yields one animation frame before synchronous computation so the disabled loading state is visible;
- Takeoff and Landing Calculate actions expose `aria-busy`, “Calculating…” and a spinner while calculation is pending;
- duplicate calculation clicks are blocked while pending.

## Later product work

After wind + Partial Power:
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
- no silent or unsupported extrapolation;
- source-envelope extensions must come from the AFM/manual chart where available;
- no fabricated aviation authority;
- desktop/iPad/mobile acceptance required before merge.

## Active implementation order

1. **P1.1 — LEARN / EFB split + Active Flight top-bar reconciliation** — COMPLETE · PR #211 + PR #213
2. **P1.2 — Snapshot V2** — COMPLETE · PR #214
3. **P1.3 — canonical Performance operation controller** — COMPLETE · PR #215
4. **P1.4 — Flight Brief EFB home** — COMPLETE · PR #216
5. **B5 — Landing integration** — COMPLETE · PR #217
6. **B6 — Takeoff wind correction** — COMPLETE · PR #218
   - B6.1 source extraction + correction contract — COMPLETE
   - B6.2 generic correction runtime — COMPLETE
   - B6.3 canonical Takeoff operation integration — COMPLETE
   - B6.4 acceptance — COMPLETE
7. **Partial Power source extraction** — COMPLETE · PR #219
   - source contract + applicability inventory — COMPLETE
   - three configuration-specific N1 schedules — COMPLETE
   - assumed-temperature source semantics captured without guessing unresolved parentheses
   - local gate: typecheck PASS + 8/8 targeted source tests
   - solver remains blocked on declared-distance TORA/ASDA workflow
8. **Declared-distance provider/input hardening (TORA + ASDA)** — COMPLETE · PR #220
   - generic declared-distance/provenance contract — COMPLETE
   - fail-closed `min(TORA, ASDA)` takeoff constraint — COMPLETE
   - optional operation-owned manual TORA/ASDA inputs — COMPLETE
   - provider-neutral adapter with identity/provenance validation — COMPLETE
   - full-rated Takeoff remains independent of declared distances
   - acceptance: typecheck PASS · 31/31 targeted · 4/4 targeted Playwright · 1118 Node / 1117 PASS / 1 SKIP · 388/388 full Playwright
9. **Partial Power assumed-temperature prerequisites / solver contract** — COMPLETE · PR #221
   - Takeoff Weight Limits Flaps 8° / 20° — ACCEPTED locally
   - prerequisite gate: typecheck PASS + 69/69 targeted tests
   - generic assumed-temperature selector contract — ACCEPTED locally (90/90 PP.2/B6/B7/B8/PP.1 gate)
   - explicit lower-of-TORA/ASDA, ambient + assumed weight-limit checks, no invented temperatures
   - Learjet candidate adapter with Flaps 8 B6 wind preservation / Flaps 20 nonzero-wind fail-closed — ACCEPTED locally
   - local adapter gate: typecheck PASS + 100/100 targeted tests
   - adapter remains N1-free and operational Partial Power N1 stays blocked on unresolved P-6/P-6.1 parenthesized semantics
10. **Partial Power reduced-N1 source/runtime boundary** — COMPLETE · PR #222
   - preserve explicit thrust-reverser configuration identity
   - exact-source-cell boundary — COMPLETE
   - anti-ice OFF and TR-4000 <=3000 ft limits enforced
   - FAA-approved AFMS W1072 Figure 5 bounded Aeronca interpolation — COMPLETE
   - Aeronca-specific full-rated Takeoff N1 P-5.1 dataset — COMPLETE
   - Aeronca candidate/N1 integration with 7.7 N1-point limit — COMPLETE as source-supported only
   - no-reverser and TR-4000 interpolation remain unauthorized
   - unresolved parenthesized cells remain fail-closed
   - acceptance: 56/56 targeted · full Node 1181 total / 1180 PASS / 1 SKIP · production build PASS
11. **Continuous Performance interpolation + calculate feedback** — COMPLETE · PR #223
   - bounded interpolation for all currently governed numeric grids remains enabled
   - Partial Power assumed-temperature search uses 0.1°C bounded interpolation rather than table-node stepping
   - fractional wind / weight / runway constraints covered by regression tests
   - TORA airport-db prefill is suggestion-only until verified; ASDA moved to advanced details
   - Takeoff + Landing calculate buttons paint disabled loading feedback before synchronous work
   - no extrapolation; Flaps 20 nonzero-wind remains source-blocked
   - acceptance: targeted 134/134 · full Node 1186 total / 1185 PASS / 1 SKIP · build PASS · targeted browser 8/8 · full Playwright 388/388
12. **Sea-level performance floor + source-envelope completion** — IN PROGRESS · `fix/performance-sea-level-floor`
   - negative derived pressure altitude uses 0 ft / S.L. as the Takeoff source floor
   - UI keeps actual derived PA visible and separately shows the performance PA used
   - LFMN-like -100 ft PA regression must resolve N1/V1/TOD instead of Out of range
   - ordinary in-envelope values continue bounded interpolation
   - follow-up source work: digitize wider AFM chart envelopes (for example the Flaps 8 Takeoff chart altitude scale beyond the narrower checklist table) rather than inventing unrestricted linear extrapolation

13. **Partial Power operational enablement** — SOURCE REVIEW / CONFIGURATION-SPECIFIC
   - P-6/P-6.1 explicitly impose a 7.7% N1 reduction limit for no-reverser/Aeronca schedules
   - FlightSafety separately states <=25% rated-takeoff-thrust reduction; do not invent an N1-to-thrust conversion
   - Aeronca has W1072 interpolation authority and is the first candidate for operational enablement after remaining applicability interpretation is closed
   - no-reverser parenthesized/interpolation semantics and TR-4000 source gaps remain fail-closed

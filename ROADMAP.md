# FlyTally Training Roadmap

**Status:** Active  
**Owner:** Filip Točík  
**Last updated:** 2026-09-25

> This file is the single authoritative product/implementation roadmap for FlyTally Training.
> Historical milestone/specification documents are retained through Git history and pull requests rather than the active tree.
> They are not roadmaps and must not override this file or current executable contracts.

## Progress overview

| Area | Status | Current state |
| --- | :---: | --- |
| Core architecture / governed content | ✅ | Production foundation complete |
| Multi-aircraft / no-code runtime | ✅ | Generic runtime and governed DB architecture established |
| LEARN / EFB product shell | ✅ | Live in production |
| Active Flight / Flight Brief | ✅ | Live in production |
| Takeoff + Landing Performance | ✅ | Source-backed operational workflow live |
| Partial Power / Reduced Thrust | ⚠️ | Source-backed training preview live; operational enablement remains source-blocked |
| Operational CHECKLIST | ✅ | CL-102B package live; shared Active Flight session synchronized |
| Operational QRH | 🚧 | QRH.2 source-faithful contract complete; QRH.3 CL-102B digitization/publication is next |
| REF / Limitations | ⏳ | Governed limitations content still to be populated |
| Climb + Cruise Reference | ⏳ | Planned, source-gated |
| SimBrief Active Flight import | ⏳ | Planned |
| Documentation consolidation | ✅ | Complete — four-file documentation surface verified |

**Legend:** ✅ complete/live · 🚧 in progress · ⏳ planned · ⚠️ blocked/limited

## Roadmap governance

Roadmap discipline is mandatory for this project:

- every implementation step must be recorded here before or when work starts;
- every newly discovered idea, follow-up, product improvement, source gap, technical debt item or deferred decision must be added here so it cannot be lost between chats or development sessions;
- active work must use an explicit status such as **PLANNED**, **IN PROGRESS**, **BLOCKED**, or **COMPLETE**;
- when work is completed, this roadmap must be updated to **COMPLETE** and record the relevant PR/merge and acceptance gate where applicable;
- a feature is not considered fully closed until its roadmap status is updated;
- if implementation reveals additional work, that follow-up must be added as a separate roadmap item rather than left only in chat, code comments or PR discussion;
- **ROADMAP.md and CHANGELOG.md are mandatory project controls**: the roadmap records intended direction/status, while the changelog records what actually changed and reached an accepted/production state;
- before starting material work, confirm it is represented in the roadmap; before closing/merging/deploying material work, update the roadmap status and append the corresponding changelog entry;
- chat history, PR descriptions and commit history are supporting evidence only; they do not replace roadmap or changelog maintenance;
- when roadmap direction changes, preserve the prior decision/history rather than silently rewriting it away, so future development can reconstruct why the project moved in a given direction.

## Documentation consolidation — COMPLETE · PR #236

Goal: keep repository documentation easy to navigate and continuously maintainable.

- repository Markdown surface reduced to four maintained files only: `README.md`, `ROADMAP.md`, `CHANGELOG.md`, `TECHNICAL_DOCUMENTATION.md`;
- `README.md` is the short repository entry point;
- `ROADMAP.md` remains the authoritative direction/status control;
- `CHANGELOG.md` remains the authoritative accepted/released history;
- `TECHNICAL_DOCUMENTATION.md` now consolidates current technical/product architecture, content/source governance, identity, persistence/privacy, Active Flight, operational checklist/fast path, performance, W&B, UX/PWA, admin, deployment, security/compliance and Learjet reference-aircraft contracts;
- superseded milestone/specification Markdown files were removed from the active tree after their still-current contracts were incorporated; exact historical wording remains available through Git history and PRs;
- documentation-contract tests were redirected from retired milestone files to the consolidated technical reference or to the executable runtime contract itself;
- the progress/status table near the top of this roadmap is now the concise project overview requested by the product owner;
- acceptance complete: typecheck PASS; full Node suite 1220 total / 1219 PASS / 0 FAIL / 1 SKIP; production build PASS; Playwright not required because the PR changes documentation and documentation-contract tests only, with no runtime/UI behavior change.

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
- **B6 Takeoff wind correction — merged via PR #218**; source-backed signed runway-wind corrections are integrated for supported Flaps 8 Takeoff V1 and distance.
- **Partial Power source extraction — merged via PR #219**.
- **Declared-distance workflow — merged via PR #220**.
- **Partial Power assumed-temperature solver — merged via PR #221**.
- **Partial Power reduced-N1 source/runtime boundary — merged via PR #222**; Aeronca source-supported evaluation exists but remains operationally blocked by unresolved thrust-limit validation.
- **Continuous Performance interpolation + calculation feedback — merged via PR #223**.
- **Sea-level performance floor — merged via PR #224**; negative derived PA retains its observed value for display while Takeoff performance uses the published 0 ft / S.L. source floor. Acceptance: targeted 76/76 PASS, full Node 1191 total / 1190 PASS / 0 FAIL / 1 SKIP, production build PASS, full Playwright 388/388 PASS, production readiness HTTP 200.

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

The detailed future sequence is tracked in **Active implementation order** below. Current planned follow-up is:
- Performance source-envelope completion;
- Partial Power / Derated Takeoff operational source closure and pilot UI;
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
   - at this phase boundary the solver remained blocked on declared-distance TORA/ASDA; that prerequisite was subsequently completed in PR #220
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
   - at PP.2 completion the adapter intentionally remained N1-free; reduced-N1 source/runtime work followed in PR #222, while unresolved configuration-specific source semantics remain fail-closed
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
12. **Sea-level performance floor** — COMPLETE · PR #224
   - negative derived pressure altitude uses 0 ft / S.L. as the Takeoff source floor
   - UI keeps actual derived PA visible and separately shows the performance PA used
   - LFMN-like -100 ft PA resolves N1/V1/TOD instead of Out of range
   - ordinary in-envelope values continue bounded interpolation
   - no upper-altitude clamping or arbitrary extrapolation was introduced
   - acceptance: targeted 76/76 PASS · full Node 1191 total / 1190 PASS / 0 FAIL / 1 SKIP · production build PASS · full Playwright 388/388 PASS · production readiness HTTP 200
   - merged to `main` in PR #224; production merge commit `7d90482dcb909e159fbfe95a94bc315e971b9374`

13. **Performance source-envelope completion** — DEFERRED · authoritative Section V source pages unavailable
   - keep the currently digitized Learjet source envelopes as the governed operational limits
   - use bounded interpolation between published source nodes when all required source corners exist
   - do not extrapolate beyond the current published/encoded envelope merely to increase coverage
   - values outside the governed source envelope remain unavailable / fail-closed
   - reopen this phase only if the applicable authoritative AFM/AFMS performance pages become available

14. **Partial Power / Derated Takeoff operational enablement + pilot UI** — IN PROGRESS · source-gated
   - **14.1 Thrust-mode UI + source-supported training preview — COMPLETE · PR #226 · LIVE IN PRODUCTION**
     - explicit **Full Rated / Partial Power / Assumed Temperature** selector added; Full Rated remains the safe default
     - Partial Power requires explicit thrust-reverser configuration and never infers it from aircraft name, serial number or simulator variant
     - current preview supports the existing Aeronca source-backed path; no-reverser and TR-4000 remain fail-closed
     - required eligibility confirmations are surfaced in the pilot UI: dry hard-paved runway, anti-skid operative, anti-ice OFF and full-rated-thrust takeoff within the preceding 30 days
     - TORA + ASDA and source-backed runway wind are required before preview calculation
     - source-supported result presents Assumed Temperature, target N1, V1, VR, V2, corrected Takeoff Distance, Full Rated N1 reference and the governing declared-distance limit
     - the result is explicitly labeled **SOURCE-SUPPORTED TRAINING PREVIEW** and is not written into the operational Takeoff Snapshot V2
     - targeted helper/controller/UI regression tests added
     - first local gate exposed a Node ESM JSON-fixture import incompatibility before the new preview cases executed; test/runtime boundary was corrected so the Node-testable preview core is JSON-import-free and tests load JSON fixtures explicitly through fs
     - targeted verification after the fix: typecheck PASS · PP.2/PP.3/PP.4 targeted suite **42/42 PASS** · production build PASS
     - first full repository verify: **1197 total / 1194 PASS / 2 FAIL / 1 SKIP**; both failures were stale source-text assertions caused by the intentional split Full Rated/Partial Power calculation gates and the shared displayed-calculation METAR atomicity guard, not runtime calculation failures
     - stale DD.4 and P1.3 regression assertions updated to the new controller contract
     - final full repository verify after the assertion fixes: **1197 total / 1196 PASS / 0 FAIL / 1 SKIP** · production build PASS
     - full Playwright browser acceptance on the runtime implementation: **388/388 PASS**
     - automated acceptance is green; product owner explicitly approved production merge on 2026-09-24 without a separate pre-merge manual Partial Power UI smoke
     - merged to `main` in PR #226 · merge commit `b1c508fe4fcbe6e2fa185f4694e3c4818745ed83`
     - production deployment `dpl_BDEuUEKaGrqokzYkyyb8YrPs1Vyn` reached **READY** and is aliased to `training.fly-tally.com`
     - production readiness smoke: HTTP 200 · `status=ready` · operational profile true · source-governed release profile true
     - **follow-up:** manual-weather Partial Power currently has no manual runway-wind input. Add either explicit manual wind entry or an explicit source-safe zero-wind confirmation path before treating manual weather as complete for Partial Power
     - **follow-up:** Partial Power UI should aggregate and display **all current blockers at once** (configuration, eligibility, wind/flap/source limitations) instead of stopping on the first failure; this must remain explanatory only and must not weaken fail-closed behavior
   - **14.1a EFB simplification pass — COMPLETE · PR #227 · LIVE IN PRODUCTION**
     - Partial Power setup reduced to pilot-facing essentials; explanatory helper copy and training-style prose removed from the primary workflow
     - the single currently supported source path is now one explicit mode option: **Partial Power · Aeronca**; selecting that mode binds the Aeronca source schedule and the separate thrust-reverser selector is removed
     - compact eligibility controls retained: **Dry hard-paved**, **Anti-skid operative**, **Full-rated <30 days**
     - Partial Power keeps TORA + ASDA directly visible; verbose declared-distance explanation is removed
     - result keeps only a concise **TRAINING · 25% LIMIT UNVERIFIED** header badge instead of a separate warning panel or paragraph copy
     - weather source provenance is retained as concise metadata; explanatory prose is removed
     - existing fail-closed runtime behavior and source constraints are unchanged
     - source-text regression tests updated to assert behavior rather than removed explanatory wording
     - targeted acceptance: typecheck PASS · PP.4/DD targeted suite **12/12 PASS** · production build PASS
     - full repository verify: **1197 total / 1196 PASS / 0 FAIL / 1 SKIP** · production build PASS
     - full Playwright browser acceptance: **388/388 PASS**
     - product owner explicitly approved production merge on 2026-09-25 without a separate local manual desktop smoke
     - merged to `main` in PR #227 · merge commit `49e0f7c5497397fd706f011cafe086762fdc233b`
     - production deployment `dpl_ZCCsG6c7QzQY7t73uW3HnAbkA5nv` reached **READY** and is aliased to `training.fly-tally.com`
     - production readiness smoke: HTTP 200 · `status=ready` · operational profile true · source-governed release profile true
   - **14.1b Partial Power EFB hard simplification — COMPLETE · PR #228 · LIVE IN PRODUCTION**
     - TORA remains always directly editable so intersection departures can be entered without a separate workflow
     - duplicate ASDA entry removed from the primary Partial Power flow; when no independent ASDA override is entered, **ASDA = TORA** is used as the conservative takeoff-field assumption so `min(TORA, ASDA)` cannot exceed TORA
     - optional compact **ASDA override** disclosure retained for independently known declared-distance data
     - Partial Power eligibility checkboxes removed from the pilot workflow; selecting **Partial Power · Aeronca** evaluates the training preview under the published prerequisite assumptions, while Anti-ice remains a real explicit calculation/configuration input
     - keep the result visibly training/source-limited until 14.2 closes the independent 25% rated-thrust requirement
     - METAR is automatic by default: fetch/apply on airport selection, poll every 5 minutes, and automatically update an existing calculation when a newer observation changes source-backed inputs; manual QNH/OAT edits remain sticky overrides with a compact **AUTO METAR** reset
     - remove remaining action/provenance helper copy that does not contribute to the calculation or a blocking state
     - implementation includes updated PP/DD/weather regression contracts and browser acceptance for automatic METAR behavior
     - first targeted local gate: typecheck **FAIL (2 errors)** · targeted suite **21/24 PASS / 3 FAIL** · build compiled but failed TypeScript
       - obsolete Flight Brief reference to `newerWeatherAvailable` after AUTO-METAR contract change
       - captured departure ICAO remained typed as optional inside the async METAR refresh closure
       - three source-text regression assertions still expected removed UI/old controller markers
     - corrective commits remove the obsolete Flight Brief notice, capture a non-optional METAR station value, and align DD/P1.3 tests with the simplified contract
     - targeted re-run after fixes: typecheck PASS · PP/DD/P1.3 targeted suite **24/24 PASS** · production build PASS
     - first full verify after targeted green: **1197 total / 1195 PASS / 1 FAIL / 1 SKIP**; the only failure was a stale B4 source-text assertion still expecting the removed manual METAR action
     - B4 assertion updated to the AUTO-METAR contract; no performance/runtime calculation failure was reported
     - first full Playwright run was invalidated by local-server environment contamination: Playwright reused an already-running local server, so fixture and FT_NEW_SHELL webServer env were not applied; broad failures included missing Browser CI fixture, wrong flag-off behavior, and authenticated API behavior
     - Playwright config hardened: existing local servers are no longer reused by default; explicit reuse now requires `PW_REUSE_EXISTING_SERVER=1`
     - **no second full-suite rerun required for 14.1b**; acceptance may close with targeted unit/browser verification of the corrected contracts plus production readiness smoke
     - targeted closeout unit gate after B4 correction: **28/28 PASS**
     - targeted AUTO-METAR Playwright attempt did not start because port 3000 was already occupied; this is an environment/startup conflict, not a browser-test failure. Playwright correctly refused to reuse the existing server after the config hardening.
     - product owner explicitly approved production merge on 2026-09-25 without rerunning the blocked targeted browser pair; production smoke will be used as the remaining deployment acceptance check
     - merged to `main` in PR #228 · merge commit `a87dca16cf38e2a540bd58f9d0f3a9c53d926d60`
     - production deployment `dpl_37E5teXinHi2rEdj3bXXsz1BdgxH` reached **READY** and is aliased to `training.fly-tally.com`
     - production readiness smoke: HTTP 200 · `status=ready` · operational profile true · source-governed release profile true
   - **14.2 Independent 25% rated-thrust source closure — BLOCKED**
     - FlightSafety requires thrust reduction <=25% of rated takeoff thrust for the existing ambient condition
     - CL-102B P-6/P-6.1 provide configuration-specific reduced-N1 schedules and a 7.7 N1-point cap, but no verified N1-to-rated-thrust relationship has been found
     - AFMS W1072 authorizes Aeronca Partial Power N1 interpolation and directs crews back to the basic AFM Partial Power procedure; it does not independently close the 25% check
   - **14.3 Operational Snapshot V2 + stale dependency integration — BLOCKED UNTIL 14.2**
     - the production training preview intentionally remains ephemeral and does not write an operational Takeoff snapshot
     - operational thrust-mode persistence and validity dependencies will be implemented only after the independent 25% rated-thrust source check is closed
   - **14.4 Operational enablement — BLOCKED UNTIL 14.2**

   - add an explicit Takeoff thrust-mode selector to the operational Performance UI:
     - **Full Rated** — current behavior
     - **Partial Power / Assumed Temperature** — source-governed reduced-thrust path
   - keep Full Rated as the safe default; selecting Partial Power must be an explicit pilot action
   - Partial Power setup must surface/validate the required inputs and eligibility:
     - confirmed/authoritative TORA
     - separately declared ASDA
     - dry hard-paved runway
     - anti-skid operative
     - bleed-air anti-ice OFF
     - full-rated-thrust takeoff within the preceding 30 days
     - applicable thrust-reverser configuration
   - reuse the existing source-backed assumed-temperature engine:
     - search bounded assumed temperature at 0.1°C resolution
     - enforce ambient and assumed-temperature Takeoff Weight Limits
     - enforce usable runway as `min(TORA, ASDA)`
     - calculate source-backed V1 and Takeoff Distance
     - preserve supported wind correction and fail closed where a configuration-specific correction source is missing
   - pilot result should clearly distinguish Full Rated from Partial Power and, when source-authorized, present:
     - Assumed Temperature
     - reduced/target N1
     - V1
     - VR
     - V2
     - corrected Takeoff Distance
     - Full Rated N1 as reference/context where useful
   - persist thrust mode and every Partial Power validity dependency in the Takeoff snapshot so any relevant input/source/configuration drift marks the result stale
   - Aeronca source/runtime support already exists and enforces the P-6.1 maximum 7.7 N1-point reduction
   - **blocking source issue:** FlightSafety separately states <=25% rated-takeoff-thrust reduction; do not invent an N1-to-thrust conversion. Operational Partial Power must remain fail-closed until this check can be validated from an authoritative applicable source or its correct source-defined method is established
   - no-reverser parenthesized/interpolation semantics remain unresolved and fail-closed
   - TR-4000 source gaps remain fail-closed
   - Flaps 20 nonzero-wind Partial Power remains fail-closed until a verified wind-correction source is digitized
   - acceptance before merge: source/provenance review, targeted solver/runtime tests, snapshot invalidation tests, full Node suite, production build, desktop/mobile/iPad Playwright, and manual production smoke

15. **Post-Partial-Power product work** — PLANNED
   - **15.1 SimBrief Active Flight import + weight prefill — PLANNED**
     - add a user-configurable Navigraph Alias / SimBrief Pilot ID
     - use the supported latest-OFP fetch path with JSON v2 only in response to an explicit pilot import/refresh action; do not background-poll SimBrief
     - one action should import the latest planned flight into the Active Flight workflow and prefill supported fields such as departure, destination and planned takeoff weight
     - use SimBrief Estimated TOW as the Takeoff weight prefill when present, preserving the OFP weight unit and converting only through existing unit-safe helpers
     - imported values remain pilot-editable; a manual Takeoff weight override must not be silently overwritten without a new explicit SimBrief import/refresh action
     - preserve provenance so the UI can distinguish SimBrief-prefilled values from pilot-entered values without adding explanatory clutter
     - validate that the imported aircraft/profile is compatible with the currently selected Training aircraft; fail closed rather than silently mapping an unrelated SimBrief airframe
     - no periodic SimBrief polling; live METAR remains owned by the existing AviationWeather.gov workflow
   - **15.2 Learjet climb + cruise Reference performance — PLANNED · source-gated**
     - place this under **Reference**, not the Takeoff/Landing Performance workspace
     - climb reference: altitude/weight-driven source-backed time, distance and fuel to climb, including FC-200 / FC-530 applicability where the source distinguishes them
     - preserve the published climb schedule and source assumptions; no invented optimum-climb logic outside source data
     - cruise reference should let the pilot choose altitude, weight/temperature inputs as required by the source, then choose a published cruise regime
     - planned cruise regimes: two-engine Normal Cruise, High-Speed Cruise, Long-Range Cruise and Single-Engine Long-Range Cruise where source data is available
     - output only source-supported values such as KTAS, fuel flow and published power/N1 setting where available
     - keep Rosemount/non-Rosemount applicability separated if the source tables differ
     - use bounded interpolation only where source geometry supports it; never extrapolate beyond published rows
     - first implementation step is a source inventory/digitization pass against the best available Learjet manuals before UI/runtime work
   - **15.3 EFB / FLY content-completeness audit — AUDIT COMPLETE · IMPLEMENTATION PLANNED**
     - audit scope: EFB side-nav **FLY**, fast-path **CHECKLIST / QRH / PERF / REF**, and the corresponding Learjet 35A governed data dependencies
     - historical cause confirmed: the M39 Learjet clean reset intentionally retired the previous Learjet checklist/procedure/system/performance/limitation/abnormal payloads; the current rebuild has since restored bundled Takeoff/Landing performance, but the operational fast-path still depends on separately published governed modules for CHECKLIST, QRH and REF
     - **15.3a FLY route dead-end — COMPLETE · PR #229 · LIVE IN PRODUCTION**
       - new-shell EFB navigation currently sends **FLY** to `/aircraft/:id/fly`
       - that route still uses the older strict Flight Deck composition and calls `notFound()` when no operationally-ready published checklist/performance/abnormal module survives readiness gating
       - unlike the current EFB Flight Brief/PERF path, the legacy FLY route does not merge the Learjet bundled performance package, so the aircraft can have working Takeoff/Landing performance and still have a dead FLY destination
       - fix the new-shell FLY destination so it opens a valid EFB Flight Deck using the current new-shell data composition; preserve fail-closed behavior per individual missing module instead of making the entire destination disappear
       - preserve legacy/flag-off behavior separately; do not weaken source-authority or freshness gates for checklist/QRH data
       - implementation: new-shell `/fly` now stays reachable even when DB operational modules are sparse, merges the current bundled Learjet Performance package into the Flight Deck, and keeps checklist/QRH behind existing operational-readiness gates
       - new-shell route no longer applies the all-modules-missing `notFound()` boundary; the strict all-missing 404 remains flag-off/legacy only
       - Flight Deck now renders an explicit fail-closed empty state if an aircraft genuinely has no operational modules
       - targeted regression coverage added in `tests/p1-5-fly-route.test.ts`; M53 operational-boundary expectation updated for the bundled-performance merge
       - local acceptance: typecheck PASS · targeted 15.3a/M53/UX6 suite **15/15 PASS** · production build PASS
       - merged to `main` in PR #229 · merge commit `22e5e4a23f1eda93429486585e78fb6c9743f84b`
       - production deployment `dpl_C45SzjJxxoJKqRjqMNM1yZ75o1Ve` reached **READY** and is aliased to `training.fly-tally.com`
       - production FLY smoke: `/aircraft/learjet-35a/fly` HTTP 200 and renders the new-shell `data-ft-fly-page` workspace with Performance content
       - production readiness smoke: HTTP 200 · `status=ready` · operational profile true · source-governed release profile true
     - **15.3b CHECKLIST fast path — COMPLETE · LIVE IN PRODUCTION**
       - runtime/UI is implemented and functional; the governed universal `checklists` payload is now published in production
       - CL-102B Normal Procedures N-2 through N-18 have been digitized into `aircraft-data/learjet-35a/checklists/normal-checklist.ts` using the universal checklist contract
       - N-15 Landing Speeds/Distances remains owned by Performance and is intentionally not duplicated into checklist content
       - source provenance is embedded at phase/item level using `CL-102B`; a reviewed source manifest records Change 2, the source fingerprint and the OPERATING_REFERENCE authority boundary
       - current `fc530-standard` applicability is source/configuration driven: Rosemount wording and FC-530 trim checks are selected; non-Rosemount alternatives are filtered out
       - generic thrust-reverser and drag-chute checks fail closed while those equipment states remain `unknown`
       - TR-4000/Aeronca model-specific actions are intentionally omitted until the simulator thrust-reverser model is positively identified; FC-200-only items are omitted for the current FC-530 target
       - the serial-number-specific FL410 oxygen-mask item is deferred until checklist applicability can represent aircraft serial/effectivity explicitly
       - source-visible optional-equipment qualifiers remain literal `if installed` wording where no registered configuration key exists; no new applicability identifiers are invented
       - guarded publisher `tooling/publish-learjet-checklist.ts` validates the payload, registers CL-102B/source reference if absent, then creates/approves/publishes the governed `checklists:bundle` only with explicit `CONFIRM_LEARJET_CHECKLIST_PUBLISH=yes`
       - focused regression coverage validates universal schema, unique IDs, source identity/fingerprint, target-profile filtering, registered applicability identifiers, source-critical Power/panel/start handoff items and the explicit publication guard
       - through-flight ◆ markers and Normal Procedure bold-emphasis semantics are not inferred because the parsed source does not preserve a reliable item-level mapping and the current checklist contract has no explicit field for those semantics
       - focused acceptance gate PASS (2026-09-25): `npm run typecheck` PASS · targeted checklist/runtime/P5 suite **32/32 PASS** · production `npm run build` PASS
       - the only build warning is the pre-existing non-blocking Turbopack workspace-root/package-lock warning outside the repository
       - PR #230 merged to `main` as `1d0adda4139149be1a2e8f99a87d7696dfce889f`; reviewed CL-102B checklist content is now governed and live in production
       - first explicit publisher run failed **before any database action** because `tsx` transformed the script as CommonJS and rejected top-level `await`; this is a tooling/runtime defect, not a checklist-content validation failure
       - **15.3b.1 Checklist publisher CJS runtime hotfix — COMPLETE · PR #231 · MERGED**
         - publisher now runs through an explicit `async main()` entrypoint; no top-level `await` remains
         - regression coverage invokes the exact Node/tsx runtime command with confirmation removed and requires the script to reach the confirmation guard with exit code 2
         - the regression explicitly rejects the prior `Top-level await is currently not supported` transform failure
         - focused acceptance PASS (2026-09-25): typecheck PASS · publisher/checklist suite **10/10 PASS** · production build PASS
         - merged to `main` as `7fd163ee1e3ac6feddaaaf66101e07b1c9db3e70`
       - **15.3b.2 Checklist publisher local environment loading — COMPLETE · PR #232 · MERGED**
         - the guarded publisher is a plain Node/tsx command, so unlike `next build` it does not automatically load `.env.local`
         - npm publisher command now uses Node 24 `--env-file-if-exists=.env.local`, preserving local production DB configuration without copying secrets into the shell
         - missing `.env.local` remains harmless; the explicit publish confirmation guard still executes first
         - the real-runtime regression now includes the env-file flag and rejects unsupported-option/runtime-transform regressions
         - focused acceptance PASS (2026-09-25): typecheck PASS · publisher/checklist suite **10/10 PASS** · production build PASS
         - merged to `main` as `c6609df49d5ec9e2f7a7bda7715564f20ca564a6`
         - historical local publish path was later superseded by 15.3b.4 because the production database credential is intentionally non-pullable
       - **15.3b.3 Production DB credential handoff for one-shot checklist publication — BLOCKED / SUPERSEDED BY 15.3b.4**
         - explicit publish now reaches the runtime guard correctly, but local `.env.local` does not contain `TRAINING_DATABASE_URL`
         - linking the repository and using Vercel `env run -e production` still cannot supply the database credential because the Production project marks it as a non-pullable Secret
         - production itself remains healthy and database-backed; this is a release-path limitation, not a database outage or checklist-content failure
         - do not copy or expose the Production DB secret merely to complete this release
       - **15.3b.4 Authenticated production-runtime checklist release — COMPLETE · PR #233 · LIVE IN PRODUCTION**
         - added shared server-only `publishLearjetChecklistRelease()` helper that owns payload validation, exact CL-102B manifest/fingerprint checks, source registration/reference creation, idempotence and the governed draft → approval → publication lifecycle
         - the CLI publisher now delegates to the same helper; there is no second weaker publication implementation
         - added authenticated Training-admin server action `publishLearjetChecklistReleaseAction`; administrator authorization is checked before the explicit confirmation value
         - Admin → Platform tools now exposes **Publish reviewed Learjet checklist** with a required confirmation checkbox
         - the action runs inside the production runtime, so it uses the already-configured protected `TRAINING_DATABASE_URL` without pulling or exposing the secret locally
         - release result is idempotent for an identical payload and revalidates Learjet admin, checklist and FLY surfaces
         - focused tests cover shared governance helper ownership, CLI guard preservation, admin gating/confirmation, runtime revalidation and absence of DB-secret handling in the action
         - focused acceptance PASS (2026-09-25): typecheck PASS · checklist/admin suite **11/11 PASS** · production build PASS
         - merged to `main` as `4229882b17022879485f70aaff5742215c3e7e33`
         - production deployment `dpl_AswMNS8dfQegSArqTh3Qkjg3y1E4` reached **READY**
         - authenticated administrator publication completed successfully in production
         - production FLY smoke for `fc530-standard`: CHECKLIST is populated; `Exterior Preflight`, `Cabin Preflight`, `Before Starting Engines`, `Starting Engines`, `Runway Lineup` and `Quick Turnaround` are present; `Checklist unavailable` is absent
         - production readiness smoke: HTTP 200 · `status=ready` · operational true · source-governed release true
       - **15.3b.5 EFB checklist session unification — COMPLETE · LIVE IN PRODUCTION**
         - production acceptance bug addressed by making the new-shell EFB use the Fast Path provider as the single checklist state owner for the main Flight Deck, top progress indicator and fast-path drawer; legacy flag-off local checklist persistence remains isolated
         - completed items and selected phase now synchronize bidirectionally between the main Flight Deck and CHECKLIST drawer
         - CHECKLIST drawer now exposes reset-phase and two-step reset-all controls, phase completion markers and a next-phase affordance
         - fast-path CURRENT STEP now follows the selected phase rather than mixing the global first-unchecked item with another displayed phase
         - EFB canonical persistence now uses localStorage scoped by the current Active Flight ID; same-flight progress survives tab/browser navigation on the same device, while a new Active Flight receives an isolated clean session
         - one-time migration imports the pre-existing unscoped canonical session (sessionStorage) or legacy operational state into the new scoped session and consumes the old key so it cannot seed later flights repeatedly
         - Learn checklist-training persistence remains unscoped/session-based and separate from Active Flight operational state
         - focused coverage added for Active Flight key isolation, one-time migration, shared Flight Deck/Fast Path ownership, reset controls and browser synchronization
         - first focused gate: session/runtime cases passed, but typecheck/build exposed one callback-narrowing error in Fast Path reset and P5.6 exposed one stale source-text assertion after the intended e2e test rename
         - both gate findings are fixed without changing runtime behavior: reset callback now captures the already-validated phase id, and P5.6 expects the new flight-scoped migration test title
         - focused acceptance PASS (2026-09-25): typecheck PASS · targeted session/P5/15.3b.5 suite **30/30 PASS** · production build PASS
         - targeted Playwright 15.3b.5 smoke was not executed because local port 3000 was already occupied; this is an environment blocker from the two-server Playwright harness, not a test failure
         - merged to `main` in PR #234 · merge commit `7b1465f8ae4bef755e7ccb800a4b874a4716ff72`
         - production deployment `dpl_AMMSPGwSp84CDa5WQUUn9HcDS5Gq` reached **READY** and is aliased to `training.fly-tally.com`
         - product-owner production smoke PASS: main checklist ↔ fast-path synchronization, phase synchronization, reset controls and persistence behavior confirmed
     - **15.3c QRH fast path — IN PROGRESS**
       - runtime/UI is implemented and deliberately fails closed unless the published abnormal module is fresh and all linked sources are CONTROLLING or OPERATING_REFERENCE
       - there is no Learjet bundled QRH/emergency fallback
       - **QRH.1 source inventory + contract-gap audit — COMPLETE · PR #237**
         - CL-102B Change 2 is the operating-reference source; the AFM remains controlling in a conflict
         - Emergency section inventory: E-i/E-ii introduction, E-1/E-2 index, source procedures from E-4 onward; 11 index categories / 30 indexed procedure titles
         - Abnormal section inventory: A-i/A-ii introduction, A-1/A-1.1/A-2/A-3 index, source procedures from A-4 onward; 13 index categories / 65 indexed procedure-title entries including configuration-specific thrust-reverser branches
         - LOEP effectivity splits are captured explicitly for serial/AMK families, Rosemount pitot-static and no-reverser/Aeronca/TR-4000 configurations
         - CL-102B defines memory items by boxed presentation and requires page-level effectivity review; neither semantic may be inferred from title text
         - current universal abnormal contract is training-first: it requires difficulty/minutes/setup/objectives/debrief/prompt/explanation even though the source QRH does not supply those fields
         - current operational QRH projection has no explicit Emergency-vs-Abnormal procedure class, hard-codes the visible EMERGENCY label, and infers immediate/memory presentation from stage-label text
         - current flat `expectedResponse[]` can carry action text but cannot faithfully model source conditional branches/substeps such as E-4 without flattening semantics
         - current applicability model can represent equipment/modification state but has no first-class aircraft serial-number range; serial/AMK source effectivity must therefore remain fail-closed until explicitly mapped
         - structured source inventory is committed in `aircraft-data/learjet-35a/qrh/source-inventory.ts`; it is audit evidence only and is not publishable operational content
         - acceptance: typecheck PASS · focused QRH.1 suite 4/4 PASS · full Node suite 1224 total / 1223 PASS / 0 FAIL / 1 SKIP · production build PASS · Playwright not required because QRH.1 changes source inventory, tests and roadmap only
       - **QRH.2 contract hardening — COMPLETE · PR #238**
         - evolve the generic abnormal/emergency contract without Learjet-specific runtime branches
         - add explicit procedure class (Emergency / Abnormal), explicit memory-item semantics and source-faithful conditional/substep structure
         - separate source-exact operational procedure data from optional Training scenario metadata so QRH publication does not require invented training prose
         - preserve existing scenario-training compatibility through an explicit training projection/overlay rather than weakening source-governed QRH data
         - define a fail-closed mapping strategy for serial/AMK effectivity before any variant-specific Learjet procedure is published
         - implementation delivers a versioned v2 operational-first contract, explicit procedure class/memory semantics, nested condition branches, source effectivity mapping gate, optional Training overlay, section introductions and backward-compatible legacy projection
         - aircraft search indexes v2 source structure without depending on training-only metadata; deterministic browser acceptance now exercises v2 Emergency/Abnormal class, memory items and conditional branches directly
         - acceptance on head `59bc099`: typecheck PASS · targeted QRH/P5/P6 suite 43/43 PASS · full Node suite 1232 total / 1231 PASS / 0 FAIL / 1 SKIP · production build PASS · targeted Playwright QRH acceptance 8/8 PASS across desktop Chromium, mobile Chromium, iPad landscape and iPad portrait
       - **QRH.3 source digitization/publication — IN PROGRESS**
         - digitize applicable CL-102B Emergency and Abnormal procedure content only after QRH.2 contract semantics are accepted
         - preserve exact page-level provenance, WARNING/CAUTION/NOTE, memory items, conditional branches and effectivity
         - **QRH.3A Emergency source batch 1 — COMPLETE · PR #239:** CL-102B E-i/E-4/E-5/E-9/E-10/E-11 digitized into the generic v2 contract (Emergency section guidance, DOOR LIGHT, AC INVERTER FAILURE — TOTAL, GENERATOR FAILURE (DUAL), ENGINE FAILURE); source-boxed Engine Failure memory items are explicit at action level; all reviewed pages are ALL-aircraft effectivity
         - real CL-102B source review exposed informational/non-action procedure lines; the generic QRH step contract now carries an `information` step through validation, search, operational projection and presentation instead of falsely coercing those lines into crew actions
         - QRH.3A remains deliberately unbundled/unpublished until the complete applicable Learjet QRH package and effectivity mapping pass are ready; partial content must not become a production fallback
         - QRH.3A acceptance on head `9809c04`: typecheck PASS · targeted QRH/P5/P6/W2 suite 58/58 PASS · full Node suite 1239 total / 1238 PASS / 0 FAIL / 1 SKIP · production build PASS · targeted Playwright QRH acceptance 8/8 PASS across desktop Chromium, mobile Chromium, iPad landscape and iPad portrait
         - **QRH.3B Engine emergency source batch — COMPLETE · PR #240:** source-reviewed E-12 ENGINE FIRE — SHUTDOWN and E-19 OIL PRESSURE LIGHT(S) are staged; branch-level memory semantics are explicit so only the boxed E-12 branch is classified as memory
         - E-13 AIRSTART ENVELOPE remains fail-closed: its graphical operating envelope is not flattened into text; generic source-figure support must be defined before it is digitized
         - QRH.3B acceptance on head `ba2447a`: typecheck PASS · targeted QRH/P5/P6/W2 suite 64/64 PASS · full Node suite 1245 total / 1244 PASS / 0 FAIL / 1 SKIP · production build PASS · targeted Playwright QRH acceptance 8/8 PASS across desktop Chromium, mobile Chromium, iPad landscape and iPad portrait
         - **QRH.3C Airstart source batch — COMPLETE · PR #241:** source-reviewed textual procedures E-14–E-18 are staged separately from their unresolved E-13 graphical prerequisite; no memory items are inferred because visual review shows no boxed memory presentation on these pages
         - QRH.3C explicitly blocks operational publication on E-13: all four airstart procedures carry the unresolved graphical-envelope dependency while preserving their textual source content and ALL-aircraft effectivity
         - QRH.3C acceptance on head `98785d6`: typecheck PASS · targeted QRH/P5/P6/W2 suite 70/70 PASS · full Node suite 1251 total / 1250 PASS / 0 FAIL / 1 SKIP · production build PASS · Playwright not required because QRH.3C changes staged source content/tests/roadmap only and introduces no runtime/UI behavior change
         - **QRH.3D ALL-aircraft mid-section Emergency batch — COMPLETE · PR #242:** staged the reviewed ALL-aircraft procedures from E-21 and E-25 through E-33, preserving visual boxed-memory boundaries and nested decision structure
         - E-20/E-20.1/E-20.2 BLEED AIR LIGHT and the E-22/E-22.1/E-23/E-23.1/E-24 CABIN/COCKPIT FIRE family remain explicitly fail-closed because source applicability depends on serial ranges/AMK state that the current generic configuration contract cannot prove
         - QRH.3D acceptance on head `2993d3e`: typecheck PASS · targeted QRH/P5/P6/W2 suite 76/76 PASS · full Node suite 1257 total / 1256 PASS / 0 FAIL / 1 SKIP · production build PASS · Playwright not required because the final PR changes staged source content/tests/roadmap only and introduces no runtime/UI behavior change
         - **QRH.3E end-section / effectivity architecture — NEXT:** review E-34/E-35 thrust-reverser emergency families and define the smallest generic serial/effectivity extension needed to unlock the remaining E-20 and E-22/E-23 source families without aircraft-specific runtime logic
         - publish through the governed abnormal-domain lifecycle and verify operational-readiness gating
       - **QRH.4 cockpit acceptance — PLANNED**
         - verify fast-path category/procedure navigation, Emergency-vs-Abnormal distinction, memory-item emphasis, configuration filtering and source/authority disclosure on desktop/mobile/iPad
         - full Node/build/Playwright plus authenticated production publication/smoke before closure
     - **15.3d PERF fast path — POPULATED / PARTIAL CONTENT COMPLETE**
       - current Learjet bundled performance package contains the implemented Takeoff/Landing datasets and calculator definitions, so PERF does not depend solely on a DB-published performance bundle
       - current package covers Takeoff N1, takeoff weight limits, V1/VR/V2, takeoff distance/wind support, VREF, approach/landing climb speeds and landing distance within their governed source envelopes
       - remaining performance-content gap is primarily the planned 15.2 Climb/Cruise Reference work plus already-tracked source-envelope gaps; do not duplicate those into the Takeoff/Landing PERF workflow
     - **15.3e REF fast path — CONTENT GAP CONFIRMED**
       - REF is implemented but its source of truth is the governed published universal `limitations` payload; there is no Learjet bundled limitations fallback
       - the current AFM source set contains FAA-approved FM-102 Section I Limitations material and should be the controlling basis for the initial REF dataset, with configuration/effectivity and temporary-change applicability handled explicitly
       - next step: inventory/digitize high-value cockpit limitations first (speeds, weights, altitude, configuration/system restrictions and other source-defined operating limits), publish the universal limitations payload, then expand coverage systematically
     - **15.3f EFB content acceptance — PLANNED**
       - add a Learjet production-content acceptance check that distinguishes UI/runtime availability from actual non-empty governed data
       - acceptance must assert: FLY opens; CHECKLIST has at least one applicable phase/item; QRH has at least one source-authoritative applicable scenario; PERF has calculator/dataset coverage; REF has at least one applicable limitation group/item
       - missing data must surface as a tracked content gap rather than allowing a visually functional but empty EFB slot to be treated as complete
   - Flight Brief Takeoff/Landing convergence
   - source-backed operational W&B where available
   - navigation/icon cleanup
   - second/third aircraft acceptance against the same LEARN/EFB and Performance contracts
   - legacy compatibility cleanup once migration telemetry/tests prove it is safe

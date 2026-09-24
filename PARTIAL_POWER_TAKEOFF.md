# Partial Power / Reduced Thrust Takeoff

**Status:** PP.3 reduced-N1 source/runtime boundary complete · PR #222  
**Branch:** `feat/partial-power-reduced-n1-boundary`  
**Scope:** Learjet 35A/36A source-backed Partial Power prerequisites and solver contract. No operational Partial Power output is enabled yet.

## Purpose

Define the source-backed data and applicability boundaries required before FlyTally can calculate a Learjet 35A/36A Partial Power / Reduced Thrust Takeoff.

The source procedure is an assumed-temperature procedure:

1. determine the highest Assumed Temperature permitted by the runway/weight constraints;
2. determine V1 from the Takeoff Speeds & Distances data using that Assumed Temperature;
3. determine reduced takeoff N1 from Ambient Temperature + Assumed Temperature;
4. enforce source configuration/effectivity and operating limitations.

The existing full-power Takeoff calculator remains authoritative until every required Partial Power dependency is available.

## Source inventory

### CL-102B Quick Reference Handbook

The performance section provides three distinct **PARTIAL POWER TAKEOFF N1 SETTING — ANTI-ICE OFF** tables:

| Configuration | CL-102B page | Table domain |
| --- | --- | --- |
| Without thrust reversers | P-6 | Ambient Temperature × Assumed Temperature → reduced N1 |
| Aeronca thrust reversers | P-6.1 | Ambient Temperature × Assumed Temperature → reduced N1 |
| TR-4000 thrust reversers | P-6.2 | Ambient Temperature × Assumed Temperature → reduced N1 |

CL-102B also explicitly lists P-5/P-6, P-5.1/P-6.1 and P-5.2/P-6.2 as separate aircraft-effectivity pages for those three thrust-reverser configurations.

For all three P-6 variants, the documented determination sequence is:

1. **TAKEOFF SPEEDS & DISTANCES** — determine the Assumed Temperature, defined there as the highest temperature allowed for runway length and takeoff weight;
2. **TAKEOFF SPEEDS & DISTANCES** — using the Assumed Temperature, calculate V1;
3. **PARTIAL POWER TAKEOFF N1 SETTING** — using Ambient Temperature and Assumed Temperature, determine reduced N1.

Additional CL-102B limitations visible in the source:

- P-6 and P-6.1 state: **Thrust reduction must not exceed 7.7% N1.**
- P-6.2 states that the table is for pressure altitudes up to **3000 ft**; above 3000 ft the FAA Approved Airplane Flight Manual is required.
- the tables are explicitly **ANTI-ICE OFF**.

### FlightSafety Learjet 35/36 Pilot Training Manual

The FlightSafety performance chapter states that an assumed-temperature N1 may be used only when performance weight limitations at both ambient and assumed temperatures equal or exceed actual takeoff weight.

It also states that reduced-thrust takeoff may be used only when:

- runway surface is hard-paved and dry;
- bleed-air anti-ice systems are OFF;
- anti-skid is ON and operative;
- thrust reduction does not exceed 25% of rated takeoff thrust for the existing ambient conditions;
- a full rated-thrust takeoff has been accomplished within the preceding 30 days.

The manual directs the pilot to the approved AFM for the actual Partial Power thrust-setting procedure.

## Existing FlyTally data that may be reusable

The current Learjet package already contains source-backed zero-wind Takeoff Distance and V1 grids for Flaps 8° and 20°.

The source wording explicitly instructs the pilot to use the **Assumed Temperature** in the TAKEOFF SPEEDS & DISTANCES data to calculate V1. The existing V1 and Takeoff Distance grids therefore form the source topology for evaluating an assumed-temperature candidate. Existing B6 wind correction remains a post-baseline transform and must be applied to both distance and V1 whenever the source-backed wind correction is available.

### New PP.2 prerequisite — Takeoff Weight Limits

FlightSafety states that an assumed-temperature N1 may be used only when **performance weight limitations at both ambient and assumed temperatures equal or exceed actual takeoff weight**.

The existing package did not contain the required Takeoff Weight Limits schedules. PP.2 therefore adds two governed CL-102B datasets before any operational solver is enabled:

- `learjet-35a-takeoff-weight-limit-flaps8` — CL-102B P-7;
- `learjet-35a-takeoff-weight-limit-flaps20` — CL-102B P-13.

Both preserve the published pressure-altitude / temperature geometry, the explicit 18,300 lb continuation ceiling, sparse high/hot cells, and the source baseline conditions. They use bounded interpolation only inside complete published source regions and never extrapolate.

## Declared-distance dependency — COMPLETE · PR #220

Partial Power is runway-limited. The declared-distance phase established an explicit TORA/ASDA contract with provenance and a fail-closed Learjet takeoff constraint of:

`usableTakeoffFieldLengthFt = min(TORA, ASDA)`

Physical runway surface length and TODA are not substituted. Manual TORA/ASDA input and a provider-neutral adapter boundary now exist; the existing full-rated Takeoff remains independent of these fields.

## Applicability model

The three N1 schedules are not interchangeable.

Required configuration identity:

- `none` — without thrust reversers;
- `aeronca` — Aeronca cascade thrust reversers;
- `tr4000` — Dee Howard TR-4000 target thrust reversers.

The runtime must select a schedule only from explicit aircraft configuration metadata. It must not infer thrust-reverser type from serial number, aircraft name, or visual/UI state.

## PP.1 extraction status

Visual verification against the rendered CL-102B source pages is complete for P-6, P-6.1 and P-6.2.

Three source-extract-only JSON records now preserve the tables exactly as source evidence:

- `partial-power-n1-no-reversers.json` — 128 source cells;
- `partial-power-n1-aeronca.json` — 128 source cells;
- `partial-power-n1-tr4000.json` — 94 source cells.

They are intentionally **not** registered in the operational performance package. Sparse cells remain sparse. Parenthesized cells on P-6/P-6.1 are preserved with `sourceStyle: "parenthesized"` rather than assigned an inferred operational meaning.

The Aeronca source contains one notable extra parenthesized cell at **OAT 80°F / Assumed Temperature 90°F** in addition to the ambient-equals-assumed diagonal. That distinction is preserved exactly and remains unresolved.

## Secondary cross-check — Aeronca W1072

A separate FAA-approved Aeronca thrust-reverser AFM supplement, **AFMS W1072**, is reproduced in an NTSB public docket. Its Partial Power chart includes a worked example:

- Assumed Temperature: 82°F;
- Ambient Temperature: 50°F;
- Reduced Thrust Setting: 91% N1.

This independently cross-checks the magnitude and axis orientation of the CL-102B P-6.1 Aeronca extraction. It does **not** resolve the parenthesized-cell semantics, does not authorize extrapolation, and does not establish applicability for the no-reverser or TR-4000 schedules. The CL-102B/approved-AFM source chain remains the production-data authority.

## Unresolved source questions

Do not author production N1 data until these are resolved directly from the source:

1. **Parenthesized values on P-6 / P-6.1.** The visible source table contains parenthesized N1 values, but the retrieved text does not define their exact semantics. They must not be interpreted by inference.
2. **TR-4000 reduction limit.** P-6.2 visibly carries the 3000-ft altitude note, but the retrieved page text does not state the same 7.7% N1 note shown on P-6/P-6.1. Do not apply that limit to TR-4000 unless the applicable AFM/supplement directly supports it.
3. **Above-3000-ft TR-4000 data.** P-6.2 explicitly requires the FAA Approved AFM above 3000 ft; FlyTally must fail closed there until that source is digitized.
4. **Partial Power N1 operationalization.** The P-6/P-6.1 parenthesized-cell semantics remain unresolved; those source extracts therefore remain non-operational.
5. **Assumed-temperature solver integration.** Candidate evaluation must check Takeoff Weight Limits at both ambient and assumed temperature, use explicit TORA/ASDA, and preserve the already-governed B6 wind correction.

## Planned implementation sequence

### PP.1 — source extraction — COMPLETE

- verified all three N1 tables visually against the source;
- preserved parenthesized-cell typography without assigning unsupported semantics;
- encoded separate configuration-specific source extracts;
- preserved exact source cells and sparse regions;
- added source-node, sparse-geometry, configuration-isolation and non-registration tests;
- local gate on 2026-09-24: `npm run typecheck` PASS and `tests/partial-power-source-extraction.test.ts` **8/8 PASS**.

The unresolved parenthesized-cell meaning remains an explicit production-data blocker; PP.1 completion means the source evidence has been safely captured, not that the source ambiguity has been guessed away.

### PP.2 — assumed-temperature prerequisites and contract — COMPLETE · PR #221

Prerequisite data accepted locally:
- governed Takeoff Weight Limits · Flaps 8° (P-7);
- governed Takeoff Weight Limits · Flaps 20° (P-13);
- source-node / interpolation / sparse / no-extrapolation tests;
- registration in the Learjet performance package without enabling Partial Power output;
- local prerequisite gate: typecheck PASS + PP.2/B7/B8/PP.1 targeted suite **69/69 PASS**;
- generic solver + Learjet adapter gate: typecheck PASS + **100/100 PASS**.

Generic assumed-temperature selector is now staged in `lib/performance/assumed-temperature.ts`. It:
- accepts explicit TORA and ASDA and uses the lower value;
- requires the ambient performance weight limit to cover actual takeoff weight;
- requires each assumed-temperature candidate to cover actual takeoff weight;
- selects only from explicit source-supported candidate evaluations supplied by the aircraft adapter;
- requires a candidate above ambient temperature;
- never invents intermediate temperatures or extrapolates;
- preserves the selected candidate's source dataset identities;
- returns V1 and corrected takeoff distance, but deliberately does not return reduced N1.

The Learjet adapter is accepted locally in `aircraft-data/learjet-35a/performance/partial-power-adapter.ts`. It:
- evaluates only the published Takeoff Weight Limit temperature-axis candidates above ambient;
- binds Flaps 8° / 20° to their separate weight-limit, V1 and takeoff-distance sources;
- preserves the verified B6 Flaps 8 wind transforms for both V1 and distance;
- permits Flaps 20 only at zero wind while its nonzero-wind correction source remains unverified;
- requires explicit TORA + ASDA;
- propagates the dry hard-paved runway, anti-ice OFF, anti-skid operative and recent full-rated-takeoff eligibility checks;
- remains N1-free while P-6/P-6.1 parenthesized semantics are unresolved.

Aircraft adapter inputs are:

- ambient temperature;
- pressure altitude;
- takeoff weight;
- flaps;
- applied runway wind;
- declared TORA;
- declared ASDA;
- thrust-reverser configuration;
- anti-ice / anti-skid / runway-surface eligibility.

The solver must return no solution when any required operational dependency is unavailable or unsupported.

### PP.3 — reduced-N1 source/runtime boundary — COMPLETE · PR #222

Declared-distance TORA/ASDA is frozen by PR #220 and the assumed-temperature candidate engine is merged via PR #221. Operational Partial Power output remains blocked on the reduced-N1 source/runtime boundary.

The first PP.3 local gate is accepted: typecheck PASS + **18/18** PP.3/PP.1 targeted tests.

A fail-closed source boundary is staged in `lib/performance/partial-power-n1.ts`. It deliberately:
- accepts exact ambient/assumed-temperature source coordinates for all three schedules;
- rejects assumed temperature at or below ambient for reduced-thrust use;
- blocks every parenthesized source cell instead of assigning unsupported semantics;
- enforces anti-ice OFF;
- enforces the P-6.2 TR-4000 pressure-altitude limit;
- keeps all three source extracts unregistered from the operational performance package.

### Aeronca interpolation authority

An additional source review found **FAA-approved AFMS W1072 Figure 5** for the Aeronca thrust-reverser nozzle. The published worked example uses:
- Assumed Temperature: **82°F**;
- Ambient Temperature: **50°F**;
- Reduced Thrust Setting: **91% N1**.

Because 82°F is not a CL-102B P-6.1 table breakpoint, that FAA-approved continuous chart is direct evidence that interpolation is intended for the Aeronca schedule. PP.3 therefore stages bounded interpolation for **Aeronca only**, using the P-6.1 numerical grid as the source lattice and the W1072 chart/example as interpolation authority.

The interpolation remains fail-closed:
- no extrapolation;
- every required source corner must exist;
- no interpolation region may touch a parenthesized source cell;
- no-reverser and TR-4000 interpolation remain unauthorized.

### Aeronca full-rated N1 prerequisite

The 7.7 N1-point reduction limit on P-6.1 must be measured against the **Aeronca-specific full-rated takeoff N1 schedule**, not the existing standard/no-reverser Takeoff N1 dataset. CL-102B P-5.1 is therefore staged as a separate governed dataset:
- `learjet-35a-takeoff-n1-aeronca-anti-ice-off`;
- exact source nodes only where published;
- sparse high-temperature regions preserved fail-closed;
- parenthesized fractional-altitude caps are not extended beyond the last explicit 1,000-ft node;
- the parsed 5°F/-15°C, 6,000-ft OCR error is corrected to **95.1% N1** after visual source verification.

The Learjet Aeronca integration now evaluates the PP.2 runway/weight/V1/distance candidate set against:
1. P-5.1 full-rated N1 at ambient OAT/pressure altitude;
2. P-6.1 reduced N1 at ambient + assumed temperature;
3. the P-6.1 maximum **7.7 N1-point** reduction.

It returns `source-supported`, not operational `ready`. FlightSafety also requires thrust reduction not to exceed **25% of rated takeoff thrust for the existing ambient condition**. The current source package does not yet contain a validated N1-to-rated-thrust relationship for that independent check, so operational use remains explicitly blocked.

Current source review still contains no authoritative legend defining the P-6/P-6.1 parentheses. Until such a definition is found, those cells remain blocked.

PP.3 final acceptance on 2026-09-24:
- targeted PP.2/PP.3/PP.1 regression: **56/56 PASS**;
- full Node suite: **1181 total / 1180 PASS / 0 FAIL / 1 SKIP**;
- production build: **PASS**;
- no UI or current operational Takeoff path was enabled by PP.3.

The remaining blocker is deliberately outside PP.3: the FlightSafety requirement that thrust reduction not exceed **25% of rated takeoff thrust for the existing ambient condition**. No N1-percent shortcut is permitted without source-backed evidence establishing that relationship.

For eventual operational enablement:
1. find the highest source-supported Assumed Temperature satisfying the runway and weight constraint;
2. calculate V1 using that Assumed Temperature;
3. calculate reduced N1 from the applicable configuration-specific N1 schedule;
4. apply all source limits and fail-closed boundaries;
5. persist the assumed temperature, configuration identity, TORA, ASDA, applied wind and source dataset identities in Snapshot V2.

### PP.4 — operational enablement / acceptance — BLOCKED ON SOURCE

Do not begin operational UI/Snapshot enablement until the independent 25% rated-takeoff-thrust requirement can be evaluated from authoritative source data.

Required acceptance will include:

- exact source-node tests for all three N1 schedules;
- bounded interpolation tests only where explicitly authorized;
- no-extrapolation tests;
- configuration-isolation tests;
- TORA/ASDA declared-distance dependency tests;
- ambient-vs-assumed-temperature distinction;
- zero Partial Power leakage into full-rated Takeoff;
- Takeoff Snapshot V2 invalidation on declared distance, wind, weight, configuration or weather change;
- desktop/iPad/mobile browser acceptance before merge.

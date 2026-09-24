# Partial Power / Reduced Thrust Takeoff

**Status:** PP.1 source extraction complete · PR #219  
**Branch:** `feat/partial-power-source-contract`  
**Scope:** Learjet 35A/36A source contract only. No operational solver is enabled by this document.

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

The source wording explicitly instructs the pilot to use the **Assumed Temperature** in the TAKEOFF SPEEDS & DISTANCES data to calculate V1. That makes the existing V1 source topology a candidate for reuse with Assumed Temperature as the temperature input, subject to acceptance tests proving the published source coordinates and applicability align.

The same Takeoff Speeds & Distances data are also the source of the runway/weight Assumed Temperature constraint. That constraint must not be implemented by treating physical runway surface length as a declared takeoff distance.

## Declared-distance blocker

Partial Power is runway-limited. The existing airport dataset exposes physical runway surface length only.

The FlightSafety performance chapter defines Takeoff Field Length as the greatest of 115% all-engine takeoff distance, accelerate-stop distance, and engine-out accelerate-go distance. It further states that, for the Learjet 35/36 charts, field length is governed by accelerate-stop or accelerate-go and that **usable runway for takeoff is limited by the lower of TORA and ASDA**. TODA is not used for the Learjet 35/36 takeoff-distance calculation.

Therefore:

- physical runway surface length must not silently become either TORA or ASDA;
- the Partial Power solver must not choose an Assumed Temperature until explicit authoritative **TORA and ASDA** inputs exist;
- the runway constraint used by this chart topology is `min(TORA, ASDA)`, not physical surface length and not TODA;
- source extraction and generic runtime contracts may proceed before that provider/input is implemented;
- operational Partial Power calculation remains fail-closed until both declared-distance dependencies are satisfied.

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
4. **Assumed-temperature runway solver.** This requires explicit declared-distance input and must preserve the already-governed B6 wind correction rather than silently solving against zero-wind physical runway length.

## Planned implementation sequence

### PP.1 — source extraction — COMPLETE

- verified all three N1 tables visually against the source;
- preserved parenthesized-cell typography without assigning unsupported semantics;
- encoded separate configuration-specific source extracts;
- preserved exact source cells and sparse regions;
- added source-node, sparse-geometry, configuration-isolation and non-registration tests;
- local gate on 2026-09-24: `npm run typecheck` PASS and `tests/partial-power-source-extraction.test.ts` **8/8 PASS**.

The unresolved parenthesized-cell meaning remains an explicit production-data blocker; PP.1 completion means the source evidence has been safely captured, not that the source ambiguity has been guessed away.

### PP.2 — assumed-temperature contract

Define an aircraft-agnostic solver contract with explicit inputs for:

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

### PP.3 — solver/runtime

Only after the declared-distance TORA/ASDA workflow is frozen:

1. find the highest source-supported Assumed Temperature satisfying the runway and weight constraint;
2. calculate V1 using that Assumed Temperature;
3. calculate reduced N1 from the applicable configuration-specific N1 schedule;
4. apply all source limits and fail-closed boundaries;
5. persist the assumed temperature, configuration identity, TORA, ASDA, applied wind and source dataset identities in Snapshot V2.

### PP.4 — acceptance

Required acceptance includes:

- exact source-node tests for all three N1 schedules;
- bounded interpolation tests only where explicitly authorized;
- no-extrapolation tests;
- configuration-isolation tests;
- TORA/ASDA declared-distance dependency tests;
- ambient-vs-assumed-temperature distinction;
- zero Partial Power leakage into full-rated Takeoff;
- Takeoff Snapshot V2 invalidation on declared distance, wind, weight, configuration or weather change;
- desktop/iPad/mobile browser acceptance before merge.

# UX6.6 — Performance + Flight Redesign

**Status:** ACTIVE — IMPLEMENTATION READY FOR TECHNICAL/PREVIEW GATE  
**Depends on:** UX6.5 Procedures stack  
**Branch:** `feat/ux6-6-performance-flight`

## Purpose

Convert the real Performance and Flight workspaces to the approved UX6 page archetypes while preserving P2/D0 runtime ownership, storage, calculation and lifecycle behavior.

## Performance

### Target interaction
- inputs and calculated results are distinct workspace panes;
- Active Flight supplies aircraft/runway/weight/configuration dependency values;
- only source-required environment inputs remain editable here;
- result output becomes the dominant visual region after calculation;
- stale/recalculation state remains explicit;
- source/calculation context remains available without dominating the primary result.

### Preserved behavior
- `computePerformance()` remains the calculation runtime;
- `readPerformanceResult()` / `writePerformanceResult()` remain storage owners;
- `buildPerformanceContext()` and `isContextValid()` remain validity owners;
- `FtPerformanceInvalidation` remains the recalculation/stale surface;
- `FtPerformanceStrip` remains the result projection;
- no hard-coded example performance values enter production code.

## Flight

### Target interaction
- Active Flight lifecycle state is the first visual priority;
- departure/destination and lifecycle context scan before secondary details;
- Flight Brief is grouped as a readiness/dependency workspace;
- recent/archive state is visually subordinate;
- existing create/update/end lifecycle actions remain unchanged.

### Preserved behavior
- `FtActiveFlight` remains lifecycle/action owner;
- `FtFlightBrief` remains current-context brief owner;
- `FtRecentFlights` remains recent/archive presentation owner;
- performance dependency continues to use the existing P2 result;
- no independent flight state model is introduced.

## Acceptance

Before UX6.6 can be marked complete:

- `tests/redesign-ux6-performance-flight.test.ts` green;
- P1/P2/D0 contract tests green;
- full Node suite green;
- TypeScript green;
- Next build green;
- browser acceptance on desktop/mobile/iPad landscape/iPad portrait;
- light/dark visual check;
- no horizontal overflow;
- no fake performance/result values;
- stale performance remains visually explicit;
- Flight lifecycle state remains data-driven.

## Next

After UX6.6 acceptance:

> **UX6.7 — Aircraft/Library + Training + Reference + Systems**

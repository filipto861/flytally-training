# v3.1 M1 — Multi-aircraft architecture audit

## Verdict

The current Training architecture is suitable for multi-aircraft scale, but a real second aircraft should not be onboarded until the operational calculator contracts stop inferring semantics from Learjet-shaped field names.

Aircraft identity, publication, applicability, sparse-module navigation, progress and source governance are already aircraft-scoped and database-backed. The main remaining coupling is semantic rather than identity-based: generic calculator code currently recognises particular performance concepts from fixed axis/output keys and fixed correction rules.

## Proven generic boundaries

- Aircraft catalogue entries are database-governed; the compiled static catalogue remains empty.
- Learner routes are parameterised by `[aircraftId]`; a new aircraft does not require a new Next.js route.
- Published module discovery is sparse. Missing domains are omitted instead of creating placeholder curriculum.
- Variant/equipment applicability is data-driven and fails closed on unregistered identifiers.
- Progress persistence is scoped by `aircraft_id`; state from one aircraft cannot become another aircraft's progress.
- Content Studio, manual revisions, provenance, approval and publication operate on arbitrary aircraft IDs.
- The PostgreSQL no-code harness already proves creation, publication and read-back of a synthetic second aircraft without learner-facing aircraft literals or source branches.
- Flight Deck receives aircraft data through generic checklist/performance/abnormal contracts and stores local operational state per aircraft + variant.

## Blocking debt before the real second aircraft

### P0 — performance semantics are still encoded in application code

`lib/performance-calculator.ts` and its learner/Flight Deck UIs currently recognise operations through fixed conventions such as:

- `airportAltitudeFt`, `isaDeviationC`, `surface`
- `groundRunM`, `distance50ftM`
- `weight`, `vref`, `vapp`
- correction outputs such as `wet8`, `wet20`, `moderate`, `heavy`, `compactedSnow`, `wetIce`
- a hard-coded 4.4 °C / 40 °F restriction for selected landing factors
- fixed ft/lb/m/KIAS presentation in several calculator paths

There is no aircraft-ID branch, but the generic runtime is still discovering meaning from a data vocabulary created around the current reference aircraft. That is not sufficient for repeatable no-code aircraft onboarding.

**Required v3.1 correction:** performance datasets must declare their operational role, inputs, outputs, units, permitted interpolation and correction/constraint rules explicitly. Generic runtime/UI code may render and execute those declarations, but may not infer aircraft semantics from a particular key name.

### P1 — Weight & Balance uses a fixed SI authoring contract

The current W&B model is structurally generic, but its contract is expressed as `massKg`, `armMm`, `momentKgMm` and `fuel-litres`. This is safe mathematically but not yet source-format agnostic.

**Required v3.1 correction:** keep one normalized internal calculation system if desired, while making source/display units declarative so an aircraft documented in lb/in/US gal does not require source values to be manually transformed outside the governed content model.

### P1 — legacy content adapters remain

`learning`, `normal-flight`, `orientation` and `reference-knowledge` remain migration adapters for the Learjet-era content set.

**Boundary:** the second aircraft must be publishable without depending on those adapters. New aircraft work should use first-class universal domains.

### P1 — no-code acceptance is synthetic and intentionally sparse

The existing PostgreSQL acceptance harness is valuable, but it does not yet prove a deep operational second aircraft with a calculator vocabulary different from the reference aircraft.

**Required v3.1 correction:** after the generic calculator contract is complete, extend acceptance with a non-Learjet-shaped fixture and then onboard one real second aircraft through Studio/data only.

## M2 entry criteria

M2 may begin from this audit with the following non-negotiable rules:

1. No learner-facing branch on aircraft ID, manufacturer, model, engine count or category.
2. No performance operation may depend on magic axis/output names in generic UI/runtime code.
3. Units and input labels used by operational calculators must come from governed data contracts.
4. Sparse aircraft remain valid; no universal module becomes mandatory merely to support the reference aircraft.
5. Existing Learjet behaviour must be reproduced by data declarations before old semantic assumptions are removed.
6. Source governance, bounded interpolation and fail-closed/no-extrapolation behaviour remain intact.

## v3.1 acceptance target

v3.1 is complete when:

- a structurally different second aircraft can be created and published through the existing governed admin/database path,
- its learner pages, Fly deck, progress and applicable calculators render without aircraft-specific React/Next.js code,
- its performance dataset may use a vocabulary and units different from the Learjet dataset because semantics are declared explicitly,
- Learjet still passes all existing regression and operational safety tests,
- adding a third sparse aircraft is demonstrably a content/admin operation rather than application development.

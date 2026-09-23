# FlyTally Training — Roadmap

**Status:** Active  
**Last updated:** 2026-09-23  
**Owner:** Filip Točík

This is the single authoritative implementation roadmap for FlyTally Training. Historical milestone, redesign and phase-planning documents were removed from the repository to avoid competing plans. Stable architecture, development, deployment and content contracts remain in their dedicated documents.

## Product direction

FlyTally Training is being separated into two explicit aircraft modes:

- **LEARN** — aircraft knowledge and training.
- **EFB** — operational tools for the current flight.

The aircraft/variant is shared context above both modes. LEARN must not leak Active Flight operational state. EFB must not mix in training-navigation concepts.

### LEARN

Target content:
- aircraft overview/knowledge;
- systems;
- procedures;
- limitations;
- reference;
- training/scenarios/orientation;
- progress where appropriate.

### EFB

Target operational workspace:
- **Flight Brief** as the EFB home;
- Performance;
- Checklist;
- QRH / Abnormal;
- future source-backed operational tools such as W&B.

Flight Brief may initiate a Performance calculation, but Performance remains the single owner of calculation state, persistence and runtime logic.

---

## Completed foundation

### Integrated Performance foundation — complete

- **B1 — Governed aircraft configuration** ✅
  - Takeoff configuration comes from aircraft performance metadata.
  - Learjet 35A Takeoff: Flaps 8° / 20°, governed anti-ice input.
  - Landing: governed Flaps 40°.

- **B2 — Airport / Runway domain hardening** ✅
  - direction-specific RunwayEnd model;
  - OurAirports-backed airport/runway data;
  - source provenance;
  - physical runway length explicitly distinguished from declared TORA.

- **B3 — Active Flight refactor** ✅
  - Active Flight creation requires flight context, not Takeoff/Landing setup;
  - runway/flaps/config no longer required at creation;
  - planning weight remains general flight context.

- **B4 — Integrated Takeoff Performance** ✅
  - operation-owned departure runway;
  - Takeoff weight;
  - governed flaps and anti-ice;
  - departure METAR;
  - QNH/OAT inputs;
  - pressure altitude;
  - runway wind components;
  - explicit Calculate;
  - persisted Takeoff result;
  - dependency-based stale/recalculation behavior.

B4 merged in PR #210.

---

# Current implementation phase — P1: LEARN / EFB separation + Performance Snapshot V2

P1 is frozen as four sequential PRs. Do not combine them into one large change.

## P1.1 — LEARN / EFB product-mode split — IN PROGRESS

Goal: make user intent explicit before entering the aircraft workspace.

Required behavior:
- aircraft entry offers a clear choice: **LEARN** or **EFB**;
- LEARN navigation contains training/knowledge destinations only;
- EFB navigation contains operational destinations only;
- Flight Brief becomes the primary EFB destination;
- aircraft/variant remains shared context rather than an EFB page;
- preserve existing routes through compatibility behavior where practical;
- preserve UX6 visual language;
- no Performance math/storage changes.

Acceptance:
- no Active Flight widgets in LEARN;
- no Systems/Training-style navigation in EFB;
- desktop, iPad and mobile remain practical;
- existing source-governance/fail-closed behavior unchanged.

## P1.2 — Versioned Performance Snapshot V2 — PLANNED

Introduce explicit operation snapshots:

- `schemaVersion: 2`;
- `TakeoffSnapshotV2`;
- `LandingSnapshotV2`;
- operation identity: `TAKEOFF | LANDING`;
- separate storage identity per operation.

Snapshot must capture:
- calculation identity;
- Active Flight identity;
- aircraft/variant;
- runway reference/provenance;
- operation weight/configuration;
- applied weather bindings;
- AUTO/MANUAL field provenance;
- weather observation reference when known;
- derived inputs actually used;
- performance source/dataset references;
- calculated outputs and timestamp.

Validity is derived from explicit operation dependencies. The legacy global `dependencySnapshotId` is audit/debug metadata only and is not a Takeoff/Landing validity dependency.

### Legacy v1 migration rule

Legacy v1 results contain QNH/OAT but no durable weather observation provenance.

Migration must:
- preserve known historical values and outputs;
- set weather observation reference to unknown/null;
- never fabricate a METAR observation ID;
- display the migrated result as stored/historical;
- require recalculation before it becomes a fully CURRENT V2 operational snapshot;
- keep the legacy `:v1:` storage key as a read/migration fallback during this phase.

## P1.3 — Canonical Performance operation controller — PLANNED

Extract canonical operation state from presentation components.

Target API concept:
- `usePerformanceOperation("TAKEOFF")`;
- `usePerformanceOperation("LANDING")`.

Single owner for:
- setup;
- applied weather;
- available weather observation;
- result snapshot;
- validity;
- dependency diff;
- Calculate/Recalculate;
- manual weather overrides;
- Apply Latest METAR.

Weather model:
- **AVAILABLE observation** = latest METAR known to the app;
- **APPLIED weather** = values intentionally bound to the operation.

Before calculation, clean AUTO fields may follow the latest observation. After a result exists, newer weather must not silently alter the applied calculation context. Show **NEWER WEATHER AVAILABLE** and require explicit **APPLY & RECALCULATE**.

QNH/OAT/wind provenance becomes durable. Derived wind displayed for an operation must come from the applied observation, not an unrelated latest observation.

No Takeoff Distance/V1 wind correction math in this PR.

## P1.4 — Flight Brief becomes EFB home — PLANNED

Flight Brief becomes the EFB landing surface.

It presents canonical Takeoff/Landing operation snapshots and can open the same Performance workflow through a responsive sheet/drawer.

Rules:
- no second calculator;
- no duplicated state machine;
- no duplicated persistence;
- dedicated Performance page remains available;
- Flight Brief can initiate calculation but does not own the calculation engine.

Responsive direction:
- desktop: side sheet/drawer;
- iPad/mobile: bottom/full-height sheet as appropriate.

---

# Next phase — B5 Landing integration

After P1.4, integrate Landing using the same operation architecture.

Existing source-backed Learjet 35A data:
- VREF — gross-weight axis;
- Landing Climb Speed — gross-weight axis;
- Approach Climb Speed — gross-weight axis;
- Factored Landing Distance Flaps 40° — pressure altitude × OAT × gross weight.

Workflow:
- destination airport;
- destination RunwayEnd;
- destination weather;
- Landing weight;
- governed Landing configuration;
- explicit Calculate Landing;
- immutable Landing snapshot;
- Flight Brief synchronization.

Takeoff and Landing remain independent lifecycles. Destination changes must not invalidate Takeoff; departure changes must not invalidate Landing.

Unsupported corrections remain unavailable/fail-closed.

---

# Source-data follow-up tracks

## Wind correction extraction

Runtime waits until source extraction is authoritative.

Frozen runtime topology:

- Takeoff Distance: `(zeroWindDistanceFt, runwayWindComponentKt) -> correctedTakeoffDistanceFt`
- V1: `(zeroWindV1Kias, runwayWindComponentKt) -> correctedV1Kias`

These are separate source-backed 2D transforms. Do not use a guessed constant percentage, ft/kt or KIAS/kt correction.

Before digitizing:
- return to the actual/highest-quality AFM chart;
- independently verify Figure 5-25 and Figure 5-26 geometry;
- specifically re-check the previously suspicious 8,000/10,000 ft diagnostic region;
- extract headwind and tailwind envelopes separately;
- do not assume symmetry;
- validate against FlightSafety worked examples;
- fail closed outside the source envelope.

Approximate values measured during architecture review are topology evidence only and must never be copied into production datasets.

## Partial Power / Reduced Thrust Takeoff

Source data exists but is not yet digitized in the repository.

Prepare separate governed datasets for:
- aircraft without thrust reversers;
- Aeronca thrust reversers;
- TR-4000 thrust reversers.

Source workflow:
1. determine highest allowable Assumed Temperature from Takeoff Speeds & Distances for runway available and actual Takeoff weight;
2. compute V1 at that Assumed Temperature;
3. compute Partial Power N1 from Ambient Temperature + Assumed Temperature.

Solver/runtime waits until:
- Snapshot V2/applied-weather architecture exists;
- wind source data is authoritative;
- applicability is complete;
- declared-distance/TORA workflow is frozen.

No extrapolation or synthetic derate formula.

---

# Declared runway distances

Physical runway surface length is not TORA/ASDA/TODA/LDA.

Until an authoritative declared-distance provider is available:
- display physical length only as contextual airport data;
- do not silently use it as certified runway available;
- runway-limited/Partial Power calculations must require an explicitly sourced or pilot-entered declared available distance under a governed contract.

Future provider/domain work may add TORA/TODA/ASDA/LDA with provenance.

---

# Later work

After Landing, wind and Partial Power:
- Flight Brief synchronization hardening;
- runway declared-distance provider;
- additional source-backed Takeoff/Landing corrections;
- navigation icon refinement;
- multi-aircraft operational acceptance;
- legacy compatibility cleanup once migration evidence permits deletion.

---

## Global engineering rules

These remain non-negotiable:

- source-backed aviation values only;
- fail closed outside source envelope;
- no uncontrolled extrapolation;
- bounded interpolation only when explicitly allowed;
- no fake aviation authority;
- explicit Calculate action;
- immutable result snapshots;
- operation-scoped invalidation;
- source age is not the same as calculation validity;
- newer METAR never silently mutates a deliberate result;
- no automatic active-runway guessing;
- no hardcoded Learjet-only behavior in generic React/runtime code;
- physical runway length is not declared TORA;
- desktop/iPad/mobile acceptance remains mandatory;
- UX6 visual language remains the production design baseline.

---

## Roadmap maintenance rule

This file is the only roadmap/phase-planning document in the repository.

When priorities or architecture change:
1. update this file in the same PR that changes the plan;
2. do not create parallel milestone/roadmap Markdown files;
3. use GitHub issues/PRs for implementation discussion and execution history;
4. keep stable technical contracts in the dedicated architecture/development documents.

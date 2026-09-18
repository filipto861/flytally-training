# FlyTally Training Roadmap

## Release strategy

FlyTally Training is being built toward one complete first product release: **v1.0**.

The capabilities below are not separate public v0.x products. They are internal implementation milestones that together form v1.0. We may deliver them incrementally to production while developing, but FlyTally Training is not considered feature-complete until the full v1.0 acceptance scope is satisfied.

## Reference aircraft

**Learjet 35/36** is the v1.0 reference implementation and testbed.

Every major v1.0 capability must work end-to-end on the Learjet before v1.0 is declared complete. The Learjet is not allowed to become a hard-coded special case: subsequent aircraft must fit the same product and content model.

## Product objective

The target user is a simulator pilot learning a new aircraft/add-on.

The product should make it possible to move from an unfamiliar aircraft to a competent first simulator flight in roughly **2-4 focused hours**, without requiring the user to read the full source manual first.

The default normal learning journey always starts **Cold & Dark** and ends **Shutdown / Cold & Dark**.

The primary path is practical:

`Choose aircraft -> Quick Start -> First Flight from Cold & Dark -> Practice -> Reference -> Progress`

Manual chapter order remains available as reference structure, but it must not define the main learner journey.

## v1.0 internal implementation milestones

### M1 — Product shell and aircraft experience

- aircraft library
- aircraft detail page
- Start Here experience
- Quick Start entry point
- Learn / Checklist / Practice / Reference / Progress information architecture
- source/manual metadata visible without dominating the pilot workflow

**Learjet acceptance:** Learjet 35/36 is discoverable, its controlled training source is registered, and the pilot can enter the practical training path immediately.

### M2 — First Flight and normal checklist engine

- complete guided normal flight from Cold & Dark to Shutdown
- simulator-oriented checklist derived from available source material
- phase-by-phase flow
- item completion and reset
- concise Why? explanation per action where useful
- source reference per technical item
- individual phase practice

Checklist modes required for v1.0:
- Learn
- Practice
- Flow
- Challenge & Response

**Learjet acceptance:** a pilot can complete one normal sector from a fully cold cockpit to shutdown using the Training UI.

### M3 — Cockpit orientation

- cockpit regions/panels
- checklist/procedure item -> cockpit location mapping
- Show me interaction
- image/diagram hotspot support
- independent cockpit orientation practice

A 3D cockpit is not required.

**Learjet acceptance:** key controls used by the normal flow can be located from the training interface.

### M4 — Essential systems and Quick Start learning

Short pilot-focused lessons rather than manual reproductions.

Each system follows a consistent structure:
- what it does
- what feeds/powers it
- what the pilot controls
- what the pilot monitors
- normal configuration
- important failure implications
- short knowledge check
- source references

Learjet baseline systems:
- electrical
- fuel
- powerplant
- hydraulics
- pneumatics / bleed air
- pressurization
- flight controls
- anti-ice / rain protection
- landing gear and brakes

**Learjet acceptance:** essential systems can be learned quickly enough to support the First Flight and abnormal training paths.

### M5 — Abnormal and emergency practice

- scenario-based abnormal/emergency training
- recognition
- aircraft-control priority
- immediate actions
- checklist/procedure continuation
- targeted repeat practice

Learjet target scenarios include, where supported by the available source set:
- engine failure
- engine fire
- rejected takeoff
- generator/electrical failure
- hydraulic failure
- pressurization failure / decompression
- anti-ice related failures
- landing gear / flap abnormalities

**Learjet acceptance:** the pilot can practice representative high-value failures without reading an entire emergency chapter first.

### M6 — Quick Reference, knowledge and progress

Quick Reference:
- important speeds
- limitations
- engine limits
- fuel capacities
- pressurization references
- memory items
- system summaries
- checklist quick access
- controlled source/manual references
- compact FLY mode for use while flying the simulator

Knowledge:
- source-linked question bank
- short quizzes by system/procedure
- immediate explanations
- weak-area review
- memory/procedure recall

Progress:
- aircraft completion state
- checklist/procedure attempts
- quiz attempts and scores
- weak-area identification
- recently practiced items

**Learjet acceptance:** progress across the complete Learjet learning path can be measured and revisited.

### M7 — Persistence and FlyTally identity

- PostgreSQL-backed product data
- persistent user progress
- cross-device continuation
- aircraft learning state
- checklist/procedure attempts
- quiz history
- stable FlyTally user identity

Training should share identity with FlyTally Logbook through an explicit account/session contract. Do not copy Logbook internals or directly couple the two databases.

**Learjet acceptance:** a user can leave Training and return later without losing Learjet progress.

### M8 — Content engine and aircraft administration

The product must make the second aircraft materially easier to add than the first.

Required administration workflow:
- create aircraft/type and variants
- upload/register manuals
- immutable manual revisions
- revision metadata
- source references by revision / section / page
- AI-assisted extraction into draft content
- draft lesson/procedure/checklist/question generation
- human review/edit
- explicit approval
- publish
- revision-change detection
- stale-content review workflow

AI may draft and structure. It may not silently publish technical content or become the source of authority.

**Learjet acceptance:** the Learjet content set can be managed through the same content model intended for future aircraft rather than only through hard-coded source files.

## v1.0 definition of done

FlyTally Training v1.0 is complete only when the Learjet 35/36 demonstrates all of the following in production:

- Quick Start
- cockpit orientation
- complete Cold & Dark -> Shutdown First Flight
- normal simulator checklist
- Learn / Practice / Flow / Challenge & Response checklist modes
- essential systems
- abnormal/emergency scenarios
- Quick Reference / FLY mode
- quizzes and weak-area review
- persistent progress
- source provenance and manual revision control
- content administration / approval workflow
- stable FlyTally identity boundary
- responsive production UX on `training.fly-tally.com`

## Explicitly outside v1.0

- flight-school administration
- organizations, instructors and students
- regulatory training records or certificates
- LMS/SCORM enterprise workflows
- native mobile applications
- 3D cockpit rendering
- direct MSFS/X-Plane telemetry or switch-state tracking
- multiplayer crew synchronization
- voice recognition as a required workflow

These may be evaluated after the individual simulator-training product is proven.

## Cross-product release track — authoritative from 18 September 2026

The aircraft-training milestone history below remains valid. For shared FlyTally releases, this track is authoritative.

### v2.8 — Compliance & Safety Foundation ✅

Completed across Training and Logbook, including source-authority/freshness fail-closed behavior, privacy self-service, cross-product erasure, security and release audit controls.

### v2.9 — Commercial & External Validation — technical implementation complete ✅

Training participates in one shared FlyTally launch boundary. C1 keeps the canonical legal/commercial state in Logbook, requires an explicit source/publication-rights review for Training content, and does not add a duplicate Training launch flag.

C2 covers the versioned commercial legal publication boundary. C3 ✅ adds shared provider-agnostic entitlements: Logbook remains the authority, Training validates signed entitlement-bearing identity assertions and enforces `training.access` without knowing a billing provider. C4 ✅ adds the shared signature-assurance/regulatory-validation boundary without claiming QES, manufacturer or authority approval; external validation evidence remains pending. C5 ✅ adds the shared brand/public-claims boundary and canonical claims link without claiming trademark, manufacturer or authority approval; external evidence remains pending. C6 ✅ binds Training to the canonical final release audit without duplicating launch state. The current commercial verdict remains blocked pending real external evidence and commercial-runtime decisions.

### v3.0 — UX & Product Consolidation ✅

Before adding another aircraft, consolidate the product experience across FlyTally Logbook and Training.

Training keeps the existing aircraft-agnostic `Home / Fly / Learn / Reference` model. v3.0 focuses on task hierarchy, progressive disclosure, terminology, cockpit-use density, mobile behavior and removal of avoidable friction. The first U1 change keeps aircraft selection ahead of the optional PWA install prompt.

The shared sequence is U0 audit → U1 navigation/task hierarchy → U2 Licences & recency → U3 Aircraft/Data/Settings → U4 flight workflow clarity → U5 Training learner polish ✅ → U6 mobile/accessibility acceptance ✅.

U6 closes v3.0 with keyboard skip navigation, touch-target and safe-area hardening, overflow containment, reduced-motion support and forced-colors fallbacks while preserving the operational Fly deck and the aircraft-agnostic content model.

### v3.1 — Multi-aircraft product scale — current

Return to the original post-v1 objective after UX consolidation: prove repeatable no-code multi-aircraft onboarding and product scale without weakening source governance or Flight Deck safety.

The v3.1 sequence is:

- **M1 — architecture audit ✅**: confirm which boundaries are already genuinely aircraft-agnostic and identify semantic coupling that would block a real second aircraft. The audit found the database/admin/applicability/progress/navigation foundations ready; the principal blocker is the Learjet-shaped performance calculator vocabulary.
- **M2 — generic operational calculator contracts ✅**: **M2A ✅** adds governed declarative phase/calculator metadata and arbitrary aircraft-owned field keys; **M2B1 ✅** executes declared factors, constraints and generic metrics; **M2B2 ✅** renders governed labels/units/metrics in Performance and Fly and adds declarative W&B presentation units; **M2C ✅** proves the complete path through governed PostgreSQL publication/read-back with deliberately non-Learjet performance vocabulary and non-SI W&B presentation. Final disposable acceptance run **35375263162** completed successfully on the approved `FlyTally Training Acceptance / no-code-acceptance-20260910` branch.
- **M3 — Studio hardening for repeatable aircraft packages ✅**: **M3A ✅** adds common/variant equipment and registered applicability pickers; **M3B ✅** adds guided performance/W&B composition plus exact registered source insertion with automatic provenance linking; **M3C ✅** makes unrestricted applicability valid without raw JSON, introduces one shared package-release readiness gate (contracts, current applicability, source authority/provenance and freshness), wires that gate into Studio and server-side catalogue publication, and extends the disposable no-code acceptance harness to require package readiness before release. **M4 next** onboards the first real structurally different aircraft through Studio/data only.
- **M4 — real second-aircraft onboarding ✅**: the production BRISTELL LSA package (S/N 809/2025 · OK-EUI 10) is published entirely as governed aircraft/source/configuration/content data. It has 3 controlled source revisions, 42 exact references and 8 approved/source-linked live modules with no open stale-source flags; the learner/core repository contains no BRISTELL/Rotax/KW-21/S/N-specific branch or registration.
- **M5 — second-aircraft operational acceptance ✅**: **M5A ✅** fixes the generic Flight Deck metadata boundary and routes already-published pre-v3.1 runway grids through one isolated aircraft-neutral declarative compatibility adapter. **M5B ✅** verifies the real production second-aircraft configuration/applicability, exact and bounded runway-grid calculations, W&B loading, sparse capability discovery and per-aircraft progress behavior against source-backed values. Home / Fly / Learn / Reference remain capability-driven with no aircraft-specific learner code. **M6 next** proves the third-aircraft path is now predominantly content/admin work.
- **M6 — scale closure**: prove a third sparse aircraft remains a content/admin operation and close v3.1 without aircraft-specific learner code.

The detailed M1 findings and M2 entry criteria are recorded in `V31_M1_MULTI_AIRCRAFT_ARCHITECTURE_AUDIT.md`.

## After v1.0

The first post-v1.0 objective is **multi-aircraft scaling**: prove that the same content/admin architecture can bring additional aircraft online efficiently without weakening the Learjet-quality standard.

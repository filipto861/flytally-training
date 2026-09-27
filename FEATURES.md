# FlyTally Training Feature List

**Status:** Canonical product capability inventory  
**Owner:** Filip Točík  
**Last reconciled:** 27 September 2026

This document answers **what FlyTally Training has, intentionally constrains, or plans to have**.

It does not define implementation order; that belongs in `ROADMAP.md`. Completed implementation history belongs in `CHANGELOG.md`. Current technical contracts belong in `TECHNICAL_DOCUMENTATION.md`.

Status terms:

- **IMPLEMENTED** — capability/runtime exists for its stated scope.
- **IMPLEMENTED / CONTENT-LIMITED** — platform exists, but aircraft/source coverage is intentionally incomplete.
- **SOURCE-GATED** — completion requires authoritative source evidence.
- **PLANNED** — accepted product direction, not yet implemented for the stated scope.

## Product contexts — IMPLEMENTED

FlyTally Training has two explicit contexts:

### LEARN

Aircraft learning/reference workspace for:

- aircraft knowledge;
- Systems;
- Procedures;
- Limitations;
- Reference;
- Training/scenarios/progress where source-backed content exists.

### EFB

Operational-reference workspace for:

- Active Flight;
- Flight Brief;
- Takeoff/Landing Performance;
- operational Checklist;
- QRH / Abnormal / Emergency;
- operational Reference;
- future aircraft-specific source-backed Weight & Balance.

LEARN and EFB remain distinct contexts. Training is not an approved EFB and does not replace the current AFM/QRH.

## Aircraft platform and governed content — IMPLEMENTED

- Aircraft catalogue/library driven by governed data.
- Aircraft variants and configuration/effectivity model.
- Generic aircraft applicability filtering.
- Serial-number, modification/equipment and nested applicability support.
- Aircraft-specific technical content stored as data rather than aircraft-ID UI branches.
- PostgreSQL-backed governed content repository.
- Controlled manuals/source revisions and exact source references.
- Draft → review → approval → publication lifecycle.
- Source-authority/readiness checks for operational content.
- Stale-content flags when controlled source revisions change.
- Fail-closed operational reads on governance/database ambiguity.
- Generic Content Studio/admin workflows.
- Source provenance retained through published modules.
- Sparse aircraft packages supported without fabricating missing modules.

## Identity, account and privacy — IMPLEMENTED

- Explicit SSO/identity handoff from FlyTally Logbook.
- Training-owned authenticated session.
- Stable `account_subject` persistence boundary.
- No direct Logbook database dependency.
- Commercial entitlement consumed as a signed external authority snapshot rather than duplicated commercial truth.
- Learner progress/persistence owned by Training.
- Training learner-data export/delete boundary.
- Privacy-reset barrier preventing stale offline progress from resurrecting deleted state.

## Active Flight — IMPLEMENTED

- Persistent Active Flight lifecycle.
- One active flight context under the current persistence contract.
- Departure/destination, weight and explicit contextual configuration fields.
- Flight identity separated from Performance calculation state.
- Operational checklist state scoped to Active Flight identity.
- Previous/archived lifecycle transitions.
- Local/anonymous compatibility where supported by the current runtime.

### SimBrief prefill — IMPLEMENTED

- Explicit pilot-initiated Import/Refresh only.
- Navigraph Alias or SimBrief Pilot ID input.
- Same-origin, authenticated, no-store, timeout-bounded proxy.
- Normalized import of supported flight context only.
- Aircraft compatibility check.
- Pilot-editable imported values.
- Field-level provenance removed when the pilot edits an imported field.
- No background SimBrief synchronization.
- METAR/weather remains owned by the separate weather workflow.

## Flight Brief — IMPLEMENTED / CONTENT-LIMITED

- EFB home/context surface exists.
- Canonical Takeoff/Landing status/results can be surfaced without creating another calculator.
- Active Flight context remains separate from operation-owned calculations.

Current limitation:

- placeholder/unfinished areas such as Flight Considerations / Relevant Procedures are not product-complete and are scheduled for R3 convergence;
- no predictive/AI-inferred procedure relevance is an accepted capability.

## Takeoff Performance — IMPLEMENTED

Source-backed canonical operation includes, where source/applicability supports it:

- Takeoff N1;
- takeoff weight limits;
- V1;
- VR;
- V2;
- takeoff distance;
- supported wind correction;
- declared-distance constraints;
- pressure-altitude derivation/source floor;
- explicit Calculate/Recalculate;
- operation-owned setup;
- bounded interpolation inside supported source geometry;
- exact/interpolated/unavailable result semantics;
- source/provenance identity;
- versioned persisted result/snapshot state;
- dependency-based stale detection;
- AVAILABLE vs APPLIED weather separation;
- manual weather override behavior.

No unsupported extrapolation is a feature.

## Landing Performance — IMPLEMENTED

Source-backed canonical Landing operation includes, where source/applicability supports it:

- VREF;
- landing climb speed;
- approach climb speed;
- factored landing distance;
- destination/runway context;
- pressure altitude;
- explicit weather application;
- versioned operation snapshot;
- dependency-based stale detection;
- source-bound exact/interpolated/unavailable behavior.

Takeoff and Landing remain independent operations under one common architecture.

## Partial Power / Reduced Thrust — SOURCE-GATED

Implemented:

- source extraction/runtime foundations;
- configuration-specific source handling;
- source-supported training preview;
- assumed-temperature candidate/runtime work within accepted source boundaries.

Not operationally enabled:

- the unresolved independent 25% rated-thrust source requirement prevents operational completion.

FlyTally must not infer or invent that missing authority.

## Operational Checklist — IMPLEMENTED

- Source-backed governed Learjet Normal Procedures package.
- Full-page operational Checklist workspace.
- Persistent CHECKLIST Fast Path.
- One canonical checklist session shared between full-page and Fast Path surfaces.
- Active Flight-scoped persistence.
- Variant-aware checklist session identity.
- Completed-item synchronization.
- Selected-phase synchronization.
- current-step progression.
- phase reset.
- two-step reset-all.
- phase-complete/next-phase flow.
- source warning/caution presentation.
- operational presentation excludes training commentary/modes.
- responsive desktop/iPad/mobile support.
- light/dark workspace support.

## QRH / Emergency / Abnormal — IMPLEMENTED

- Explicit Emergency vs Abnormal procedure classification.
- Source-backed memory-item semantics.
- Nested/conditional source structure.
- Source notices and exact page-level provenance.
- Serial/modification/equipment effectivity.
- Fail-closed applicability filtering.
- Source-digitized graphical operating-envelope references without turning figures into unsupported computational surfaces.
- Governed complete Learjet Emergency + Abnormal package.
- QRH Fast Path presentation.
- Operational projection excludes training-only setup/objectives/debrief prose.

Product-completion note:

- formal QRH.4 cockpit/browser/production acceptance remains an R1 closure milestone.

## Reference — IMPLEMENTED / CONTENT-LIMITED

### Climb/Cruise Reference — IMPLEMENTED

- Separate Reference domain rather than Takeoff/Landing Performance.
- LEARN source-table presentation showing exact published values.
- EFB REF bounded lookup over the same accepted source datasets.
- exact vs interpolated distinction.
- no extrapolation.
- sparse/blocked/anomalous source cells remain unavailable.
- one-engine Mach/KIAS source-unit boundaries are not silently bridged.

### Learjet Limitations — CONTENT-LIMITED

- universal limitations/Reference runtime exists;
- Learjet operational limitations payload is not yet sufficiently populated for R1 closure;
- initial governed content is planned from the applicable FAA-approved FM-102 Section I source family with explicit effectivity.

## Weight & Balance platform — IMPLEMENTED / AIRCRAFT CONTENT-LIMITED

Generic platform includes:

- universal source-backed W&B content contract;
- aircraft/configuration applicability;
- empty-aircraft mass/arm/moment inputs;
- loading stations;
- takeoff mass/moment/CG calculation;
- optional landing/fuel-burn state;
- source-defined CG envelope;
- source-defined takeoff/landing mass limits;
- unit/display conversion;
- fail-closed invalid/incomplete result states;
- generic W&B route/UI;
- aircraft-agnostic tests.

### Learjet operational W&B — SOURCE-GATED

Not currently treated as operationally complete because current aircraft-specific W&B evidence is required.

Training-manual example loading/basic-empty values are not substitutes for the applicable current aircraft Weight & Balance Data / Aircraft Records.

Permanent Fast Path placement is intentionally undecided until source-backed operational W&B exists and cockpit usage justifies it.

## Operational Fast Path — IMPLEMENTED

Persistent EFB quick-access model:

`CHECKLIST / QRH / PERF / REF`

Characteristics:

- aircraft workspace remains visible;
- quick operational content opens without creating a new canonical state owner;
- Fast Path and full workspaces are intended to share domain state;
- responsive drawer/full-screen behavior exists.

Known R1 safety gap:

- effective variant/configuration resolution must be unified between the shell/Fast Path and query-selected child pages before EFB foundation closure.

## Weather and runway operational boundaries — IMPLEMENTED

- AviationWeather.gov METAR workflow.
- New weather availability does not silently overwrite applied calculation weather.
- Manual weather can remain sticky.
- live weather requests are excluded from service-worker caching.
- runway-end model with source provenance.
- declared-distance semantics separated from physical surface length.
- missing TORA/TODA/ASDA/LDA is not silently replaced by physical runway length.

## Offline / PWA — IMPLEMENTED / SAFETY-CLOSURE PLANNED

Implemented:

- explicit Flight Deck offline preparation;
- service-worker cache limited to supported operational route/assets;
- variant-safe `/fly` cache key;
- same-origin aviation support-data caching;
- static asset caching;
- weather API bypass;
- explicit offline/ready/preparing state.

R1 safety closure still required:

- cached governed operational content needs an explicit publication/source-currentness contract;
- offline availability must not be presented as proof that cached content is still current.

## Multi-aircraft / no-code platform — IMPLEMENTED FOUNDATION

Existing contracts/tests prove:

- dynamic aircraft discovery;
- empty static aircraft catalogue in generic runtime;
- database/route-parameter-driven content discovery;
- generic calculators and applicability runtime without reference-aircraft branches;
- real second-aircraft architecture acceptance fixtures;
- sparse third-aircraft package support.

### Real second-aircraft production proof — PLANNED

R4 will onboard one real second aircraft using real governed source content and prove the platform end-to-end in the production product model.

## UX and responsive product shell — IMPLEMENTED FOUNDATION

- LEARN/EFB product shell.
- Desktop workspace.
- iPad landscape/portrait responsive behavior.
- Mobile behavior.
- semantic workspace design tokens.
- light/dark themes.
- operational Checklist dark-mode support.
- touch-oriented Fast Path.

### Cockpit Workflow / Digital Binder — PLANNED

R2 will improve:

- one-action reachability;
- content dominance;
- state/scroll preservation;
- cockpit touch ergonomics;
- dark/night acceptance;

without creating a third navigation system or flattening FlyTally’s applicability/provenance semantics.

## Training depth — PLANNED

R5 may deepen:

- Systems;
- Procedures learning;
- scenarios;
- progress/evidence;
- instructional overlays;

only with source-backed boundaries and without contaminating operational QRH/checklist truth.

## Platform maturity — PLANNED

R6 includes the accepted direction for:

- publishing/admin workflow refinement;
- clearer stale-content surfacing;
- offline robustness beyond R1 safety closure;
- CI/release reliability;
- observability;
- stale branch/PR cleanup;
- controlled legacy/feature-flag retirement.

## Explicitly not claimed

FlyTally Training does not claim:

- regulator/manufacturer approval;
- replacement of current AFM/QRH;
- complete performance coverage outside published source geometry;
- current Learjet operational W&B without aircraft-specific evidence;
- operational Partial Power authority while its source gate is unresolved;
- automatic procedure relevance inferred by AI;
- cached/offline content is automatically current merely because it is available.

# FlyTally Training Roadmap

**Status:** Active  
**Owner:** Filip Točík  
**Last reconciled:** 27 September 2026

This is the canonical execution plan for `flytally-training`.

- `FEATURES.md` = what the product has, intentionally limits, or plans to have.
- `ROADMAP.md` = what happens next, in what order, with dependencies and acceptance gates.
- `CHANGELOG.md` = what actually changed.
- `TECHNICAL_DOCUMENTATION.md` = current technical/product contracts.
- `README.md` = repository entry point.

Detailed historical milestone evidence belongs in `CHANGELOG.md`, pull requests, tests and Git history. This roadmap deliberately does not repeat old PR-by-PR implementation journals.

## Status legend

- ✅ **COMPLETE** — implemented and accepted for the stated scope.
- 🚧 **ACTIVE** — current work.
- ➡️ **NEXT** — first implementation phase after ACTIVE closes.
- ⏳ **PLANNED** — accepted direction, not yet active.
- ⚠️ **SOURCE-GATED** — engineering may exist, but operational completion requires authoritative source evidence.
- 🔬 **RESEARCH** — not implementation-ready.

## Product north star

FlyTally Training has two explicit contexts:

- **LEARN** — aircraft knowledge, Systems, Procedures, Limitations, Reference and Training.
- **EFB** — Active Flight, Flight Brief, Performance, operational Checklist, QRH and operational Reference.

Core ownership rule:

> **Active Flight defines what flight. Performance defines what calculation.**

Cockpit UX direction:

> **High-value operational information should be reachable in one deliberate action without losing the current flight context.**

> **In cockpit use, content is the interface. Navigation chrome should recede behind the checklist, QRH procedure, performance result or reference data.**

The reference-video “digital binder” is a UX principle, not a paper/PDF UI to copy.

## Frozen decisions

These remain binding unless new evidence reveals a material safety, correctness or architecture problem:

- aircraft-specific technical content is governed data; generic product behavior is code;
- LEARN and EFB remain separate contexts;
- Active Flight is persistent context, never a silent global mode switch;
- CHECKLIST, QRH, PERF and REF remain separate operational domains;
- the persistent EFB Fast Path remains `CHECKLIST / QRH / PERF / REF` through R2;
- Climb/Cruise belongs to Reference, not Takeoff/Landing Performance;
- source provenance and effectivity/applicability are first-class;
- missing/ambiguous/non-applicable aviation data fails closed;
- no unsupported extrapolation or sparse-cell bridging;
- `AVAILABLE` weather is not `APPLIED` weather;
- manual weather remains sticky until explicitly changed;
- changing a Performance dependency invalidates the previous result;
- Training is not an approved EFB and does not replace current AFM/QRH;
- legacy flag-OFF behavior remains until explicit retirement acceptance;
- no predictive/AI-inferred operational procedure recommendations;
- source-blocked work does not block unrelated roadmap progress.

## Current product truth

| Area | Status | Current state |
| --- | :---: | --- |
| Governed content / source architecture | ✅ | Production foundation live |
| Multi-aircraft / no-code runtime | ✅ | Generic runtime and DB-governed aircraft model established |
| LEARN / EFB shell | ✅ | Live |
| Active Flight | ✅ | Lifecycle/persistence live |
| SimBrief Active Flight import | ✅ | Explicit pilot-initiated prefill live |
| Flight Brief | 🚧 | Live, but cockpit content model still has placeholder/unfinished areas |
| Takeoff + Landing Performance | ✅ | Canonical source-backed operational workflows live |
| Partial Power / Reduced Thrust | ⚠️ | Source-supported training preview exists; operational enablement is source-gated |
| Operational CHECKLIST | ✅ | Governed CL-102B package live; Active Flight-scoped session shared across full page/Fast Path |
| Operational QRH content/runtime | ✅ | Complete reviewed governed Learjet Emergency + Abnormal package live |
| QRH cockpit acceptance | 🚧 | Final R1 acceptance/closure still required |
| Climb + Cruise Reference | ✅ | LEARN source tables + EFB bounded lookup live |
| Learjet Limitations / REF content | ⚠️ | Universal runtime exists; target production profile is FC-530, while the reviewed FM-102 source is FC-200. Applicable FC-530 AFM source acquisition/review is source-gated |
| Generic Weight & Balance platform | ✅ | Generic contract, calculator, route and tests exist |
| Learjet operational Weight & Balance | ⚠️ | Source-gated on aircraft-specific current W&B/configuration records |
| Offline Flight Deck boundary | 🚧 | Explicit `/fly` preparation/caching exists; governed-content currency semantics need R1 closure |
| Documentation governance | ✅ | R0 rebuilt the canonical five-file control surface and reconciled roadmap/changelog drift |

## Execution order

| Order | Phase | Status | Purpose |
| ---: | --- | :---: | --- |
| 0 | **R0 — Product Truth & Governance Reset** | ✅ | Canonical capability/roadmap/change/architecture ownership restored via PR #279 |
| 1 | **R1 — EFB Safety & Foundation Closure** | 🚧 | Close effective-configuration, QRH acceptance, offline currency, EFB content-state and no-code regression gates |
| 2 | **R2 — Cockpit Workflow / Digital Binder** | ⏳ | Make cockpit use immediate, content-dominant and state-preserving without a third navigation model |
| 3 | **R3 — Active Flight / Flight Brief Convergence** | ⏳ | Make Flight Brief a meaningful contextual hub, not another duplicate dashboard |
| 4 | **R4 — Real Second-Aircraft Production Proof** | ⏳ | Prove the generic/no-code architecture with real governed source content |
| 5 | **R5 — LEARN Content & Training Depth** | ⏳ | Deepen Systems, Procedures and Training on the stable platform |
| 6 | **R6 — Platform Maturity** | ⏳ | Harden publishing, offline robustness, CI/observability, legacy retirement and repo hygiene |

Parallel to R0–R6, source-gated items remain in the **SOURCE-GATED lane** below and activate only when required evidence exists.

---

## R0 — Product Truth & Governance Reset — COMPLETE · PR #279

### Scope

- replace the old implementation-journal roadmap with this forward-looking plan;
- restore a canonical `FEATURES.md` capability inventory;
- supersede the former “exactly four Markdown files” rule with five canonical maintained documents;
- reconcile known status drift, including SimBrief, Reference, QRH, W&B platform state and PR #278;
- keep detailed completed history in `CHANGELOG.md`, PRs, tests and Git;
- preserve frozen and superseded decisions explicitly rather than silently rewriting history.

### Acceptance

- `README.md`, `ROADMAP.md`, `FEATURES.md`, `CHANGELOG.md` and `TECHNICAL_DOCUMENTATION.md` have non-overlapping documented ownership;
- documentation-contract tests enforce the five-file surface;
- no known contradiction remains between the roadmap overview and the audited `main` baseline;
- old implementation history remains recoverable from `CHANGELOG.md`/Git;
- no functional runtime behavior changes in R0.

Verification on PR #279 head `30cce334db9cda70d5dfd48ffe0be7ee5ebc87a6`:
- GitHub Actions **Verify Training PASS** (run #735);
- TypeScript **PASS**;
- full Node suite **1462 total / 1461 PASS / 0 FAIL / 1 SKIP**;
- production build **PASS**;
- Playwright **N/A** for the documentation-only R0 runtime scope;
- DB/migration **N/A**;
- deployment **N/A**.

### Superseded decision

PR #236 intentionally consolidated Training to four maintained Markdown files. R0 supersedes only the **file-count/document-ownership** part of that decision so Training can use the same canonical capability-inventory model as FlyTally Logbook. The anti-sprawl principle remains frozen.

---

## R1 — EFB Safety & Foundation Closure — ACTIVE

R1 starts only after the R0 governance reset. It is a correctness/acceptance phase, not a new architecture rewrite.

A source-applicability audit performed at R1 start corrected one important premise from R0: the production Learjet profile renders as **Learjet 35A · Flysimware FC-530** with selected variant `fc530-standard`. The reviewed FAA-approved **FM-102** source identifies itself as the Learjet 35A/36A **FC-200** AFM. CL-102B's revision log separately harmonizes its later changes with **FM-108**, and FAA airworthiness-directive service-information mapping identifies **FM-108** as the Learjet 35A/36A **FC-530** AFM family.

Therefore:

- FM-102 must **not** be treated as the controlling Limitations source for the current FC-530 production profile;
- no Limitations value may be copied from FM-102 into the FC-530 operational REF merely because it appears similar/common;
- Learjet Limitations population is moved to the SOURCE-GATED lane until the applicable FC-530 AFM/revision/supplement set is acquired and reviewed;
- this source gate does not block unrelated R1 safety closure or R2 cockpit UX work, provided missing Limitations remain explicitly unavailable rather than fabricated.

### R1.1 — Effective-configuration consistency — AVIATION-CRITICAL GATE

Confirmed audit finding: the current shell/Fast Path resolves its selected variant independently from child routes, while child pages may resolve an explicit `?variant=`.

Goal:

> One effective aircraft configuration must drive the page, Fast Path and all operational projections for the same rendered workspace.

Acceptance:

- explicit regression test proving the page and Fast Path resolve the same effective variant/configuration for a route;
- CHECKLIST/QRH/PERF/REF use the same applicability context;
- persisted operational state either scopes to or invalidates against configuration identity as appropriate;
- correcting/changing configuration cannot silently continue with stale configuration-dependent state;
- no silent fallback from an invalid explicit configuration to a generic/default configuration.

This gate closes before final QRH cockpit acceptance so the acceptance run exercises the same configuration context the pilot actually selected.

### R1.2 — QRH.4 cockpit acceptance

Scope:

- execute the existing QRH.4 acceptance contract against the real cockpit surfaces after R1.1 configuration consistency is closed;
- verify Emergency vs Abnormal distinction, memory-item emphasis, graphical source envelopes, source/authority disclosure and fail-closed configuration filtering;
- verify the actual Fast Path scroll container on desktop, mobile, iPad landscape and iPad portrait;
- verify the applicable QRH package remains source-authoritative for the selected configuration;
- complete authenticated production smoke before formal closure.

Do not redesign the QRH content contract unless acceptance reveals a genuine defect.

### R1.3 — Offline governed-content currency

Current explicit offline preparation is valuable, but a cached `/fly` page must not implicitly mean “current”.

Design and close an explicit currency contract covering:

- publication/source identity stored with prepared operational content;
- what the UI may claim when offline currentness cannot be revalidated;
- behavior after a publication becomes stale or is replaced;
- variant/configuration-safe cache identity;
- weather remains live-only/not cached;
- fail-closed handling where currentness is safety-relevant.

Do not invent arbitrary time-expiry thresholds that look like operational validity.

### R1.4 — EFB content-state acceptance

Add/execute a production-content gate that distinguishes available UI from meaningful source-backed content.

For Learjet acceptance, require:

- Checklist: at least one applicable source-backed phase/item;
- QRH: at least one source-authoritative applicable scenario and correct class/effectivity behavior;
- PERF: supported calculator/dataset coverage inside its source envelopes;
- REF: at least one applicable source-backed Reference capability is usable; the current governed Climb/Cruise Reference may satisfy this;
- if governed Limitations are not available for the selected configuration, the Limitations portion of REF must explicitly fail closed as unavailable/source-gated;
- no visually functional but empty slot may be treated as complete.

R1 does **not** fabricate or publish FC-200 FM-102 limitations for the FC-530 profile merely to satisfy this acceptance gate.

### R1.5 — Lightweight no-code architecture regression

Before R2 adds more cockpit surface:

- search generic runtime for new aircraft-ID branches;
- verify content discovery remains route/database driven;
- verify one canonical state owner per operational domain;
- keep the existing real/sparse-aircraft contract tests green.

This is a cheap architecture drift check, **not** the full R4 second-aircraft product proof.

### R1 acceptance gate

R1 closes only after:

- R1.1 effective-configuration consistency is proven by regression evidence;
- QRH.4 cockpit acceptance is executed against that effective configuration;
- offline governed-content currency has an explicit fail-closed contract;
- EFB content-state acceptance proves CHK/QRH/PERF/REF behavior without substituting missing Limitations;
- lightweight no-code architecture regression passes;
- targeted unit/contract tests PASS;
- full Node suite PASS;
- production build PASS;
- responsive cockpit Playwright PASS;
- authenticated production smoke PASS where required;
- no unresolved **non-source-gated** applicability/currency blocker remains;
- `ROADMAP.md`, `FEATURES.md` and `CHANGELOG.md` are synchronized.

Source-gated Learjet Limitations do not block R1/R2 when the application correctly exposes their unavailable state and does not imply unsupported operational completeness.

---

## R2 — Cockpit Workflow / Digital Binder — PLANNED

Goal: translate the strongest property of the cockpit reference video into FlyTally without creating a third navigation system.

### Product contract

Keep:

- full EFB workspaces for deeper work;
- persistent Fast Path `CHECKLIST / QRH / PERF / REF` for immediate access;
- canonical state shared between full and quick surfaces.

Improve:

- one-action reachability from anywhere in EFB;
- content dominance over application chrome;
- touch ergonomics;
- state/scroll/selection preservation when switching operational domains;
- visual hierarchy for source-backed operational content;
- night/dark readability;
- iPad landscape/portrait behavior.

Do not copy:

- flat paper/PDF metaphors where FlyTally can preserve richer state;
- hidden applicability;
- loss of exact/interpolated/unavailable distinctions;
- static content that discards provenance or conditional structure.

### Acceptance

- explicit reachability contract for all four Fast Path domains;
- state-preservation regressions across domain switching;
- desktop + iPad landscape + iPad portrait + mobile acceptance;
- light + dark/night acceptance;
- no duplicate canonical checklist/performance/QRH/reference state introduced.

W&B does **not** automatically become a fifth Fast Path item in R2. Reconsider placement only when source-backed operational W&B exists and real cockpit usage justifies permanent access.

---

## R3 — Active Flight / Flight Brief Convergence — PLANNED

Goal: make Flight Brief the useful contextual entry point for the active flight without becoming another calculation engine or generic dashboard.

### Rules

- display only values owned by existing canonical domains;
- Performance results stay owned by Performance;
- Active Flight stays the flight-context owner;
- no hidden recalculation;
- no AI/predictive procedure relevance;
- no duplicate persisted truth.

Current empty placeholder areas such as `Flight Considerations` and `Relevant Procedures` must not remain visible without meaningful governed content.

If `Relevant Procedures` is introduced, its contract must be deterministic and auditable (for example explicit applicability to the proven current configuration), not guessed relevance.

### Acceptance

Every displayed field must trace to an existing canonical owner/provenance. New derived/aggregated fields require an explicit contract before implementation.

---

## R4 — Real Second-Aircraft Production Proof — PLANNED

Goal: prove FlyTally Training is a platform, not a Learjet-specific application with generic-looking code.

### Scope

Onboard one real second aircraft using real, legally usable governed source content.

Acceptance must prove:

1. dynamic aircraft registration;
2. real variant/configuration structure;
3. controlled source revisions/references;
4. publication of supported universal modules;
5. learner discovery/library visibility;
6. rendering through existing routes/components;
7. generic calculator/runtime use where applicable;
8. coexistence with Learjet without aircraft-ID branches.

Sparse aircraft packages remain valid. No requirement to fabricate unsupported modules.

Selection of the second aircraft is a product/source decision made when R4 starts; do not pick one merely because data is easy to invent.

---

## R5 — LEARN Content & Training Depth — PLANNED

Goal: deepen the learning product after the operational foundation and platform proof are stable.

Candidate work:

- systematic Systems coverage;
- Procedures learning depth;
- source-backed training overlays;
- scenarios;
- progress/evidence;
- cross-linking between Aircraft, Procedures, Performance and Training where deterministic.

Rules:

- operational QRH/checklist content stays separate from instructional overlays;
- source-exact procedure logic is never rewritten into invented prose;
- `memoryItem` remains source-backed only;
- Draft/unverified content must not appear operationally authoritative.

R5 should be broken into source-backed aircraft/content milestones when activated rather than pre-planning fictitious coverage now.

---

## R6 — Platform Maturity — PLANNED

Goal: make the platform easier to operate, publish, observe and maintain at scale.

Candidate work:

- content Studio/publishing workflow improvements;
- explicit stale-content surfacing for administrators;
- offline robustness beyond the R1 safety contract;
- CI/release reliability;
- production observability;
- stale branch/PR retirement;
- documentation automation where useful;
- feature-flag/legacy retirement.

### Legacy retirement gate

Before deleting any legacy path/flag, define and prove per flag:

- replacement capability is production-live;
- required responsive/browser acceptance exists;
- no required data migration remains;
- production observation/smoke evidence is sufficient for the affected surface;
- rollback path is understood;
- retirement is explicitly recorded in roadmap/changelog.

No blanket “cleanup” retirement.

---

## SOURCE-GATED lane

These items are intentionally non-blocking for R0–R6.

### SG1 — Partial Power operational enablement — SOURCE-GATED

Existing source-supported preview/runtime work does not prove the unresolved independent 25% rated-thrust requirement.

Until authoritative source closure exists:

- no operational enablement;
- no unsupported assumed limit;
- no UI wording implying approved reduced-thrust authority.

### SG2 — Performance source-envelope extensions — SOURCE-GATED

Add new cells/regions/factors only from reviewed authoritative source evidence.

No extrapolation, anomaly repair or invented continuity.

### SG3 — Learjet Limitations / operational REF — SOURCE-GATED

The current production Learjet profile is FC-530 (`fc530-standard`).

The reviewed project AFM, FM-102 Change 14, explicitly belongs to Learjet 35A/36A aircraft with the FC-200 autopilot. It is therefore not accepted as the controlling Limitations source for the FC-530 profile.

Independent source identification is consistent that the applicable FC-530 AFM family is FM-108; CL-102B Change 2 also records harmonization with FM-108 Change 22. The actual applicable FM-108 revision/supplement/temporary-change set must be obtained and reviewed before operational Limitations publication.

Activation requirements:

- acquire a traceable applicable FC-530 AFM source set (FM-108 family) and required supplements/temporary changes;
- verify revision/effectivity against the configured aircraft/variant before extracting values;
- register the source/revision and exact source references through governed content;
- inventory Section I before digitization;
- publish only values whose applicability is proven for the target configuration;
- keep missing/uncertain items unavailable.

FM-102 may be used only as comparison/background evidence unless a separate authoritative source proves a specific datum applicable to the FC-530 configuration.

### SG4 — Learjet operational Weight & Balance — SOURCE-GATED

The generic W&B platform is implemented.

Learjet operational W&B requires aircraft-specific current evidence, including the applicable empty weight/moment/CG, interior/loading configuration and source tables/records needed for the selected aircraft.

Training-manual examples are not substitutes for the current aircraft record.

When evidence exists, decide full-workspace/Fast-Path placement from real usage rather than pre-allocating a permanent navigation slot.

---

## Known risks carried into the roadmap

| Risk | Owner phase | Required treatment |
| --- | --- | --- |
| Shell/Fast Path may resolve a different variant than a query-selected child page | R1 | Fix/test before R2 |
| Offline cached operational content has no closed currentness contract | R1 | Define and verify currency semantics |
| Reviewed FM-102 is FC-200 while production target is FC-530 | SOURCE-GATED SG3 | Acquire/review applicable FM-108 family before Limitations publication; never substitute FM-102 by assumption |
| QRH.4 is implemented substantially but not formally accepted/closed | R1 | Execute cockpit/production acceptance |
| Flight Brief contains placeholder areas | R3 | Hide until meaningful deterministic contract exists |
| Generic W&B status was absent from old overview | R0 | Corrected in FEATURES/roadmap; Learjet data remains source-gated |
| Source-gated Partial Power/performance/Limitations/W&B could distort sequencing | SOURCE-GATED lane | Keep non-blocking until evidence exists; missing content must fail closed |
| Old roadmap mixed planning with historical implementation evidence | R0 | History stays in CHANGELOG/Git |
| Superseded open branches/PRs add repository noise | R6 | Controlled retirement pass |

## Global acceptance principles

For every material milestone:

- inspect actual repo/runtime before design;
- define scope, dependencies, acceptance criteria and DO/DO NOT boundaries;
- prefer small implementation batches;
- preserve backward compatibility unless retirement is explicit;
- typecheck/targeted tests/full suite/build/Playwright/DB/production smoke according to scope;
- report unrun checks as `NOT RUN`, never implied PASS;
- update `ROADMAP.md`, `FEATURES.md` and `CHANGELOG.md` in the same work cycle when their truth changes;
- production stability and aviation/data integrity outrank schedule convenience.

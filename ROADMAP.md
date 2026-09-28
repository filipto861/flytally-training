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

Independent review plus direct repo reconciliation confirms the core defect and adds two state-integrity gaps.

Confirmed current-main facts:

- the new-shell `FtShell` resolves Fast Path configuration with `resolveSelectedVariant(undefined, aircraft.variants)`, so it does not consume the child route's explicit `?variant=`;
- child routes such as `/fly`, `/performance` and `/reference` independently resolve `searchParams.variant`;
- `FtFastPathReference` separately re-reads `window.location.search`, confirming configuration ownership is fragmented rather than canonical;
- the existing legacy `resolveSelectedVariant()` is permissive: an explicit unknown query can fall back to the sole variant or to undefined/common configuration;
- `FtSideNav` and `FtNavDrawer` already preserve the `variant` query when they navigate; the Fast Path rail itself is button-driven rather than link-driven;
- `effectiveConfigurationSnapshotIdForAircraftVariant()` is a deterministic content-derived configuration fingerprint over aircraft/variant, serial, base variant, equipment/capability tags, modifications and structured equipment state. It is separate from the Active Flight dependency snapshot;
- Performance Snapshot V2 currently validates only the variant key plus operation-specific derived/source dependencies; it does **not** currently include the effective-configuration snapshot identity;
- Checklist persistence currently keys by aircraft + variant + checklist + Active Flight scope, but the saved snapshot does **not** include the effective-configuration snapshot identity;
- `normalizeChecklistSessionSnapshot()` silently drops item/phase IDs that no longer exist, so a same-variant configuration/content change must not be allowed to masquerade as uninterrupted current progress;
- Active Flight does **not** currently own the technical aircraft variant/configuration. Its `configuration` field is flight-operation data such as flaps/anti-ice. R1.1 must not move technical aircraft-configuration ownership into Active Flight merely to solve this shell problem;
- the Partial Power training-preview controller currently binds the Aeronca path when that mode is selected. Although operational enablement remains source-gated, the preview still must not imply source applicability that conflicts with the effective aircraft configuration.

Goal:

> One explicit effective aircraft configuration must drive the page, Fast Path and every operational projection in the rendered workspace.

#### Resolution contract

Create a **new new-shell workspace resolver** rather than tightening the legacy resolver in place. Legacy flag-OFF behavior remains unchanged until its own retirement/migration decision.

The new-shell resolution result has four states:

1. **unselected** — no explicit variant was requested and no safe EFB selection can be inferred;
2. **selected** — one valid effective configuration is resolved;
3. **unknown-variant** — an explicit `?variant=` does not exist for this aircraft;
4. **configuration-invalid** — the variant exists but its persisted/derived configuration cannot be validated/resolved.

For a selected result expose:

- aircraft id;
- requested variant, if any;
- selection source: `explicit` or `sole-variant-default`;
- selected variant key;
- effective `AircraftConfiguration`;
- effective-configuration snapshot id.

Fail-closed product decision:

- **single selectable variant + no query:** new EFB may use the sole variant as `sole-variant-default`;
- **multiple selectable variants + no query:** EFB operational surfaces show **Configuration not selected** and do not project configurable operational content;
- **LEARN with multiple variants + no query:** common content may remain visible, but with an explicit persistent **Configuration not selected** indication wherever applicability-dependent content is affected;
- **explicit invalid query:** never fall back to sole/common/default content.

#### Shared ownership

- Page and Fast Path must consume the same workspace-resolution identity.
- Remove the `window.location.search` configuration workaround from Fast Path REF after the shared boundary exists.
- Do not introduce a second persisted selected-variant truth.
- Do not use undocumented request-header tricks.
- Do not move all aviation filtering client-side merely to gain access to `useSearchParams`.

Next.js mechanism is deliberately **not frozen until a spike proves it**. The first implementation batch must test the smallest architecture that lets one resolved scope drive both the page and a provider that owns Fast Path/shared checklist state. A parallel-route/slot approach is a candidate only if it can preserve the existing shared provider semantics without duplicate resolution. If the spike cannot prove that, reject it rather than forcing the architecture.

#### Configuration-dependent state

**Performance**
- keep Active Flight's global dependency snapshot audit-only;
- add the effective-configuration snapshot id as a distinct operation-validity dependency for Takeoff and Landing;
- existing persisted snapshots without that dependency must become explicit recalculation/migration state rather than being treated current merely because the variant string matches.

**Checklist**
- evolve the checklist session contract to carry effective-configuration snapshot identity;
- on snapshot mismatch, do not silently continue and do not silently reset;
- surface a configuration-changed state and require an explicit start/restart decision for the current configuration;
- previous progress may be retained as historical/local evidence but cannot silently become progress for a different effective configuration.

**QRH / REF**
- re-filter from governed source content using the shared effective configuration;
- no domain-local variant resolver remains.

**Partial Power training preview**
- validate the source schedule/equipment path against the effective configuration where that state is declared;
- unknown/incompatible technical configuration stays unsupported rather than selecting Aeronca by UI mode alone;
- this does not promote Partial Power to operational status.

#### R1.1 implementation order

- **R1.1a — workspace-scope resolver contract — COMPLETE · PR #283**
  - add a new-shell-only aircraft-agnostic resolver; legacy `resolveSelectedVariant()` remains untouched;
  - explicit unknown variant never falls back;
  - zero-variant aircraft resolves a common-aircraft scope;
  - one variant with no request resolves as `sole-variant-default`;
  - multiple variants with no request remain `unselected`;
  - selected scope exposes the deterministic effective-configuration snapshot identity;
  - configuration derivation failure becomes `configuration-invalid`;
  - acceptance on PR head: TypeScript PASS; full Node **1471 total / 1470 PASS / 0 FAIL / 1 SKIP**; production build PASS.
- **R1.1b — Next.js shell/provider scope spike — COMPLETE · PR #286**
  - use a query-aware parallel-route slot page because Next.js 16 pages receive `searchParams` while shared layouts deliberately do not;
  - pass that slot through the existing aircraft layout and render it inside `FtFastPathProvider`, proving a future server-resolved Fast Path registration can share the existing provider without a header hack or second persisted selector;
  - keep the spike non-authoritative: the existing Fast Path payload is not rewired in this batch, so R1.1c still owns actual CHECKLIST / QRH / PERF / REF scope wiring;
  - add browser evidence that the slot receives explicit `?variant=`, updates across client navigation under the shared layout, exposes the effective snapshot identity, and preserves an explicit invalid variant as invalid;
  - duplicate `variant` query values are ambiguous and fail closed as `configuration-invalid`;
  - acceptance on implementation head `ce82c47d0cad22693984dec0f247e81b08c689e2`: Verify Training **PASS**; TypeScript **PASS**; full Node **1472 total / 1471 PASS / 0 FAIL / 1 SKIP**; production build **PASS**; Browser smoke **420/420 PASS** across desktop, mobile, iPad landscape and iPad portrait;
  - the first Verify build attempt hit a transient Turbopack/next-font internal resolution failure while the parallel Browser build passed; rerun passed without a code change, so no product defect was attributed to that runner failure.
- **R1.1c — page + Fast Path scope wiring — ACTIVE**
  - **R1.1c.1 — scoped Fast Path projection contract — IN PROGRESS**
    - construct the canonical configuration-dependent Fast Path projection in the proven query-aware server slot; keep current `FtShell` consumers unchanged until R1.1c.3 so this first batch is a shadow/dark-launch contract rather than a simultaneous state-owner cutover;
    - define one serializable aircraft-agnostic projection carrying the workspace scope identity plus configuration-filtered CHECKLIST / QRH / PERF / REF payloads;
    - register that projection into the existing client provider with a fail-closed request-echo guard so a retained layout cannot display a payload from a different `?variant=`;
    - do not change Performance validity or Checklist snapshot schema yet; those remain R1.1d/e.
  - **R1.1c.2 — operational page resolver adoption — PLANNED**
    - new-shell EFB pages consume the same workspace resolver semantics as Fast Path;
    - explicit unknown/ambiguous/configuration-invalid requests render an explicit invalid configuration state instead of legacy fallback;
    - multi-variant EFB with no safe selection renders Configuration not selected;
    - legacy flag-OFF routes keep the historical resolver until retirement.
  - **R1.1c.3 — domain wiring and workaround retirement — PLANNED**
    - CHECKLIST / QRH / PERF / REF consume the scoped projection and report the same `{aircraftId, variantKey, effectiveConfigurationSnapshotId}`;
    - remove the Fast Path REF `window.location.search` resolver/filter workaround;
    - preserve explicit variant through client navigation and verify no stale-config render window;
    - run responsive Browser acceptance before closing R1.1c.
- **R1.1d — Performance effective-configuration invalidation — PLANNED**
  - add effective-configuration snapshot identity as a distinct Takeoff/Landing validity dependency;
  - old stored snapshots without this dependency require explicit recalculation.
- **R1.1e — Checklist configuration mismatch handling — PLANNED**
  - carry effective-configuration snapshot identity in the session contract;
  - never silently continue or reset progress across a mismatch.
- **R1.1f — Partial Power applicability + final acceptance — PLANNED**
  - verify the training-preview source schedule against the effective configuration;
  - run responsive/legacy/no-aircraft-branch acceptance and close R1.1.

#### Acceptance

- page and Fast Path report the same `{aircraftId, variantKey, effectiveConfigurationSnapshotId}` for a valid query-selected route;
- explicit unknown variant on a single-variant aircraft remains invalid and never becomes the sole variant;
- explicit unknown variant on a multi-variant aircraft remains invalid and never becomes common configuration;
- a known variant with invalid persisted configuration is surfaced as `configuration-invalid`;
- multi-variant EFB with no selection is visibly gated;
- the effective snapshot id changes when serial/equipment/modification data change and is stable when inputs do not change;
- Takeoff/Landing results stale when the effective snapshot changes even if the variant key does not;
- Checklist progress cannot silently cross an effective-configuration change;
- CHECKLIST / QRH / PERF / REF all use the same applicability context;
- navigation continues to preserve an explicit valid variant;
- no Fast Path component independently resolves `window.location.search`;
- no aircraft-ID branch is introduced;
- legacy flag-OFF behavior remains unchanged.

This gate closes before final QRH cockpit acceptance so that QRH.4 runs against the configuration model the pilot actually selected.

### R1.2 — QRH.4 cockpit acceptance

Scope:

- execute the existing QRH.4 acceptance contract against the real cockpit surfaces after R1.1 configuration consistency is closed;
- verify Emergency vs Abnormal distinction, memory-item emphasis, graphical source envelopes, source/authority disclosure and fail-closed configuration filtering;
- verify the actual Fast Path scroll container on desktop, mobile, iPad landscape and iPad portrait;
- verify the applicable QRH package remains source-authoritative for the selected configuration;
- complete authenticated production smoke before formal closure.

Do not redesign the QRH content contract unless acceptance reveals a genuine defect.

### R1.3 — Offline governed-content currency

Independent review plus direct repo reconciliation confirms the current cache/currentness gap and exposes a more serious user-state boundary.

Confirmed current-main facts:

- explicit preparation caches the rendered `/fly` navigation response plus immutable/static assets and aviation support data;
- the current canonical cache key preserves `?variant=`, so different variant URLs do not overwrite one another;
- the cache key does **not** include effective-configuration snapshot identity;
- cached HTML has no explicit governed operational-package identity;
- online readiness correctly fails closed on unresolved stale flags/source authority for the operational modules it governs, but a cached offline page cannot re-run that server check;
- live weather is explicitly excluded from the service-worker cache and remains live-only;
- `OfflineFlightBootstrap` currently uses `navigator.onLine` for the display state, so a navigation that was actually satisfied by cache fallback may still be presented as online/ready on a degraded connection;
- the new-shell `FtShell` server-renders the current Active Flight into `/fly`; therefore the cached HTML can contain an old server Active Flight;
- `reconcileActiveFlightMirror()` intentionally makes a defined server value authoritative over the local mirror. Replaying a cached server-rendered flight offline could therefore resurrect/overwrite stale Active Flight context if the offline artifact is not made flight-safe.

Product rule:

> **Offline availability is not a currentness claim.**

Do not solve source currentness with arbitrary elapsed-time expiry thresholds.

#### Operational package manifest

Define one small server-derived **operational package manifest** for the prepared cockpit configuration.

The package identity is derived from change-sensitive canonical truth, not from preparation time. Minimal manifest fields:

- manifest schema version;
- aircraft id;
- selected variant key;
- effective-configuration snapshot id;
- relevant DB-published content identities, at minimum the published version IDs used by the prepared operational surfaces;
- deterministic fingerprints for bundled Performance and bundled Reference packages that are not represented by DB publication IDs.

Readiness is **not** part of the identity hash/fingerprint. It is a separate precondition and online verification result. This matters because a source revision can make a publication stale without changing the already-published version ID.

Bundled package fingerprints must be computed from canonical content, not manually bumped version strings. A deployment/build ID must not be the sole content identity. Manifest schema handles incompatible runtime/offline-contract revisions.

#### Same-response consistency

The prepared page and its manifest must describe the same rendered package.

Prefer computing/embedding the manifest from the same resolved aircraft/configuration/content objects used to render the prepared response. Avoid a second independent publication/configuration query between page render and cache commit that could produce "page A + manifest B".

Preparation is committed only after the required HTML/metadata/support assets succeed. Existing immutable Next static assets may remain in the shared static cache; R1.3 does not require a new package-specific cache for every content-hashed asset if the commit/pointer semantics still prevent an incomplete package from being reported ready.

#### Active Flight boundary

A prepared offline cockpit artifact must not replay an authoritative stale **server Active Flight**.

Preferred contract:

- the offline-prepared cockpit response is flight-agnostic with respect to server Active Flight state;
- when that prepared artifact is actually used offline, Active Flight comes from the device-local mirror/current offline state;
- do not put the technical aircraft variant into Active Flight just to solve this problem;
- if implementation cannot produce a flight-agnostic prepared artifact safely, R1.3 must stop and redesign rather than caching user-specific server state under a generic aircraft/variant URL.

Add an explicit regression proving a cached/prepared artifact cannot overwrite the current local Active Flight with the flight that happened to exist when preparation occurred.

#### Online verification state machine

While online:

- current package identity is recomputed from canonical truth;
- current operational readiness is checked separately;
- only a prepared copy whose identity matches **and** whose current readiness is acceptable may show **Offline ready**;
- identity mismatch or readiness failure becomes **Offline copy outdated / refresh required**;
- missing/corrupt/unknown-schema metadata becomes **Unverified**, never ready.

While actually served from cache/offline:

- keep the prepared cockpit content viewable when its manifest/provenance is internally valid;
- show a neutral persistent state such as **Prepared offline · last verified online …**;
- do not claim source content is currently revalidated;
- no age-based warning color/expiry semantics.

The UI must detect **cache-fallback service**, not rely only on `navigator.onLine`. The exact service-worker/client signalling mechanism is implementation work, but the acceptance test must simulate "browser reports online while navigation is served from cache".

#### Configuration and routing

- same variant key + changed serial/equipment/modification snapshot => different package identity;
- an explicit invalid/unselected R1.1 scope cannot be prepared as an authoritative package;
- current offline scope is explicitly `/fly` plus the operational content embedded/reachable inside that prepared surface;
- links to routes that are not prepared for offline use must not look safely available while the app is running from the prepared offline copy.

#### Acceptance

- same variant key with changed effective configuration produces a different package identity;
- changed published version produces a different package identity;
- stale/not-ready source state with unchanged version identity fails online readiness verification;
- not-ready/invalid configuration refuses authoritative preparation;
- bundled Performance/Reference content change changes its deterministic fingerprint without manual version bookkeeping;
- prepared HTML and manifest are proven to come from the same resolved package;
- missing/corrupt/unknown-schema manifest fails closed to **Unverified**;
- interrupted preparation cannot mark a partial package ready;
- cache-fallback service is distinguishable even when `navigator.onLine === true`;
- prepared offline UI distinguishes last-verified availability from current source revalidation;
- prepared offline artifact cannot resurrect/overwrite a stale server Active Flight;
- unprepared routes are explicitly unavailable/disabled while using the prepared offline surface;
- no arbitrary expiry timer is introduced;
- weather endpoints remain uncached.

R1.3 may add a small manifest/verification endpoint or equivalent server helper, but it must remain a projection over existing publication/configuration truth, not a second content repository.

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

The target is not visual imitation of a paper checklist app. The target is cockpit immediacy:

> **High-value operational information is one deliberate action away, the current flight/configuration context is preserved, and the operational content dominates the display.**

R2 starts only after the non-source-gated R1 safety gates close.

### R2.0 — Cockpit UX baseline and reachability inventory

Read-only analysis before visual changes.

Inventory the effective EFB experience on:

- Flight Brief;
- full Performance;
- full Checklist;
- Fast Path CHECKLIST;
- Fast Path QRH;
- Fast Path PERF;
- Fast Path REF;
- top-bar Active Flight/context controls;
- desktop, iPad landscape, iPad portrait and mobile;
- light and dark/night themes.

Record for every operational domain:

- number of deliberate interactions needed to reach it from each EFB workspace;
- whether selected phase/procedure/calculation/reference context survives navigation;
- whether the current aircraft/variant/flight identity remains visible or recoverable;
- effective scroll container and sticky/fixed controls;
- duplicated controls/content;
- empty chrome and avoidable dead space;
- touch-target/focus/keyboard behavior.

No design change belongs in R2.0.

### R2.1 — Shell hierarchy and one-action operational access

Keep the existing architecture:

- full workspaces for deeper work;
- persistent Fast Path for immediate access;
- Active Flight as context, not mode;
- no new parallel navigation system.

Acceptance direction:

- from any normal EFB workspace, CHECKLIST / QRH / PERF / REF is reachable in one deliberate Fast Path action;
- accessing Fast Path never resets or silently rewrites the current Active Flight/configuration;
- application chrome is reduced where it competes with operational content, but critical context/source state remains visible;
- mobile does not require a detour through another page merely because the desktop rail cannot fit.

Do not rename/restructure domains merely for visual novelty.

### R2.2 — Fast Path surface contract

Define one consistent contract for how quick-access content behaves regardless of domain.

The contract must cover:

- drawer vs full-screen behavior by viewport;
- opening/closing/focus return;
- scroll ownership;
- sticky headings/actions;
- source/authority disclosure placement;
- unavailable/non-applicable states;
- state preservation on close/reopen;
- interaction with the underlying full workspace.

CHECKLIST, QRH, PERF and REF may have different content density, but should not feel like four unrelated mini-apps.

### R2.3 — Operational continuity and state preservation

Prove that navigation convenience does not create state ambiguity.

Required regressions:

- Checklist selected phase/completed items survive full-page ↔ Fast Path switching;
- QRH selected category/procedure and applicable configuration remain stable while moving between operational surfaces;
- Performance setup/result validity is not recreated by opening another surface;
- REF selection/input state follows an explicit persistence rule and never creates a second canonical source of truth;
- switching Fast Path domains does not mutate another domain's state;
- variant/configuration changes continue to invalidate or re-scope dependent state according to R1 contracts.

Preserving stale state is not a goal; preserving **valid** state is.

### R2.4 — Domain cockpit presentation pass

Apply the common cockpit principles without flattening domain-specific semantics.

**CHECKLIST**
- current phase/current step should dominate;
- challenge/response scanability and completed state remain explicit;
- reset/destructive actions remain deliberate;
- source warning/caution information remains readable without overwhelming normal flow.

**QRH**
- Emergency vs Abnormal and memory-item boundaries remain explicit;
- conditional/nested procedures remain source-faithful;
- graphical source references stay legible;
- category/procedure navigation stays fast under stress.

**PERF**
- current valid result and stale/recalculate state must be immediately distinguishable;
- setup remains operation-owned;
- exact/interpolated/unavailable and source boundaries remain visible;
- no automatic recalculation is introduced for convenience.

**REF**
- quick lookup prioritizes the actual result/source context;
- exact source values are not visually confused with interpolation;
- unavailable Limitations stay unavailable until the correct source gate closes;
- Climb/Cruise Reference remains Reference, not PERF.

### R2.5 — Cockpit acceptance

Acceptance matrix:

- desktop;
- iPad landscape;
- iPad portrait;
- mobile;
- light;
- dark/night;
- keyboard/focus where applicable;
- touch-only use.

Required evidence:

- explicit one-action reachability contract for all four Fast Path domains;
- state-preservation regression coverage;
- no duplicate canonical domain state;
- no new aircraft-ID runtime branch;
- no loss of source/applicability/invalidation information;
- responsive browser acceptance on the effective production shell.

W&B does **not** automatically become a fifth Fast Path item in R2. Reconsider placement only when source-backed operational W&B exists and real cockpit use justifies permanent access.

---

## R3 — Active Flight / Flight Brief Convergence — PLANNED

Goal: make Flight Brief a useful contextual entry point for the active flight without becoming another calculation engine, another persistence model or a generic dashboard.

R3 starts after R2 cockpit navigation/state contracts are stable.

### R3.0 — Flight Brief ownership matrix

Before UI work, inventory every field/section the Brief currently displays or proposes to display.

For each item identify exactly one canonical owner:

- Active Flight;
- Takeoff Performance;
- Landing Performance;
- SimBrief prefill provenance;
- weather availability/applied state;
- other explicitly governed source state.

Classify every proposed field as:

- direct canonical fact;
- derived but deterministic presentation;
- unsupported/duplicate;
- future/source-gated.

Nothing ships because it is “useful-looking” without an owner.

### R3.1 — Remove placeholder cockpit surfaces

Current empty/placeholder areas such as `Flight Considerations` and `Relevant Procedures` must not occupy operational UI without meaningful governed content.

Rules:

- hide absent capabilities rather than presenting decorative empty sections;
- distinguish unavailable from merely not-yet-entered;
- no fake recommendations;
- no inferred “what the pilot probably needs”.

### R3.2 — Canonical flight + operation summary

Converge the Brief around the information already owned elsewhere:

- flight identity/departure/destination;
- explicit Active Flight context;
- Takeoff result/validity state;
- Landing result/validity state;
- explicit weather/source age where already available;
- source/provenance cues where operationally meaningful.

The Brief may summarize and deep-link; it must not recalculate or independently persist Performance truth.

### R3.3 — Relevant Procedures decision gate

Do **not** implement a predictive procedure engine by default.

If a future use case is accepted, it must be deterministic and auditable, for example:

- a procedure explicitly applicable to the proven current aircraft configuration;
- a direct link selected by the pilot;
- a source-defined relationship already represented in governed data.

Weather, route or flight-phase heuristics must not silently promote procedures as operationally “relevant”.

If no deterministic high-value contract is proven, omit this section.

### R3.4 — Active Flight transition/invalidation acceptance

Verify that edits to Active Flight context do not create stale-looking summaries.

Acceptance must cover relevant changes such as:

- departure/destination;
- weight;
- runway where owned by the relevant operation;
- configuration;
- imported-vs-manual field provenance;
- new/replaced Active Flight identity.

The Brief must always reflect the canonical stale/current state of its dependent operation rather than copying old result values into a new context.

### R3 acceptance

- every displayed operational value has a documented canonical owner;
- no duplicated calculator/persistence path;
- no empty placeholder chrome;
- no predictive/AI procedure recommendation;
- operation stale/current state is preserved exactly;
- responsive/night acceptance passes.

---

## R4 — Real Second-Aircraft Production Proof — PLANNED

Goal: prove FlyTally Training is an aircraft platform, not a Learjet application with generic-looking code.

R4 does not start by choosing whatever aircraft has the easiest data. Source rights, applicability and real product value are part of the selection gate.

### R4.0 — Aircraft/source selection gate

Before onboarding, record:

- selected real aircraft/configuration;
- intended supported modules;
- authoritative source set and revision/effectivity;
- whether the source may legally be used for the intended product context;
- known source gaps;
- what is intentionally unsupported.

A sparse package is acceptable. Invented completeness is not.

### R4.1 — Governed no-code onboarding

Prove, through the existing data/admin path:

1. dynamic aircraft registration;
2. real variant/configuration structure;
3. controlled source revision/reference registration;
4. source-backed draft/review/approval/publication;
5. learner catalogue discovery.

No new aircraft-specific learner route/component/runtime branch.

### R4.2 — Cross-domain runtime proof

Exercise only the modules genuinely supported by the selected aircraft sources.

Where applicable, prove:

- Systems/Procedures/Reference rendering;
- Checklist/QRH applicability;
- generic Performance calculator/runtime contracts;
- generic W&B contract if source-backed;
- LEARN/EFB capability discovery with intentionally missing modules failing closed.

The second aircraft is not required to mirror Learjet feature-for-feature.

### R4.3 — Architecture regression

Automated/static evidence must confirm:

- no aircraft-ID branch in generic learner/runtime paths;
- source/applicability contracts are shared;
- sparse capability discovery remains data-driven;
- Learjet remains unaffected by the second package.

### R4.4 — Production acceptance

- governed source/content publication verified;
- responsive learner/EFB routes for supported modules verified;
- production smoke;
- no cross-aircraft state leakage;
- documentation updated with the proven platform boundary.

R4 is complete only when the second aircraft is real product evidence, not merely a synthetic fixture.

---

## R5 — LEARN Content & Training Depth — PLANNED

Goal: deepen the learning product after the operational foundation and second-aircraft platform proof are stable.

Do not pre-commit to large content volumes before source/effectivity coverage is understood.

### R5.0 — Coverage and source matrix

For the active aircraft packages, inventory by domain:

- source authority/revision;
- applicability;
- current published coverage;
- missing content;
- training-overlay opportunity;
- source/legal blockers.

Use this matrix to order R5 work; do not choose by whichever page is easiest to build.

### R5.1 — Systems depth

Expand Systems where source-backed, preserving:

- aircraft/configuration applicability;
- nested subsystem relationships;
- diagrams/schematics only where source/licensing/representation supports them;
- separation from cockpit Orientation;
- no generic “typical aircraft” explanations presented as aircraft fact.

### R5.2 — Procedures learning layer

Build instructional procedure learning separately from operational Checklist/QRH truth.

Possible learning elements may include source-backed:

- context;
- flow relationships;
- expected responses;
- explanation;
- practice modes.

Operational source order, conditions and memory-item boundaries remain authoritative and are never rewritten to suit a lesson.

### R5.3 — Training scenarios and progress

Introduce/expand scenario/progress features only with explicit contracts for:

- what evidence is persisted;
- completion semantics;
- retry/review behavior;
- retention;
- separation from Active Flight operational state.

Training completion is not regulatory currency unless a future explicitly proven authority contract says so.

### R5.4 — Deterministic learning cross-links

Cross-link Aircraft / Procedures / Performance / Training only when relationships are explicit in governed data or intentionally authored training metadata.

Avoid recommendation heuristics that make source-backed material appear more authoritative than its evidence.

### R5 acceptance

R5 is broken into aircraft/content milestones when activated. Each milestone requires its own source inventory, applicability gate, acceptance tests and docs closeout.

---

## R6 — Platform Maturity — PLANNED

Goal: make the platform easier to operate, publish, observe and retire safely at scale.

R6 is not a dumping ground for unresolved product features. Items enter R6 only when their contract and value are clear.

### R6.1 — Content administration and stale-source surfacing

Audit the complete stale-content workflow:

- new source revision registration;
- affected publication detection;
- administrator visibility;
- review/republication path;
- learner/operational fail-closed behavior.

A backend stale flag with no actionable owner-visible path is insufficient.

### R6.2 — Offline robustness beyond R1

After R1 establishes the safety/currentness contract, improve offline usability without weakening it.

Candidate scope:

- clearer prepared/offline state;
- controlled cache refresh/retirement;
- generalized supported EFB routes if justified;
- explicit recovery after content/configuration updates.

Offline availability must never become an authority/currentness claim.

### R6.3 — CI, release and observability reliability

Harden evidence delivery rather than merely adding more checks.

Scope may include:

- risk-based test classification;
- flaky/infrastructure failure identification;
- build/runtime distinction;
- production readiness reliability;
- actionable runtime/error observability;
- preservation of local verification when CI budget/availability is constrained.

Do not weaken acceptance because a pipeline is inconvenient.

### R6.4 — Repository hygiene

Controlled cleanup of:

- superseded draft PRs;
- stale branches;
- obsolete test assumptions;
- dead compatibility code after its retirement gate is met.

History remains recoverable through Git; cleanup must not erase governance rationale.

### R6.5 — Legacy / feature-flag retirement

Before deleting any legacy path/flag, prove per flag:

- replacement capability is production-live;
- required responsive/browser acceptance exists;
- no required data migration remains;
- production observation/smoke evidence is sufficient for the affected surface;
- rollback path is understood;
- retirement is explicitly recorded in ROADMAP/CHANGELOG.

No blanket cleanup retirement.

### R6 acceptance

Platform maturity is closed only through individually accepted milestones. “Modernized” or “cleaned up” is not a measurable completion state.

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
| Performance validity currently keys technical applicability only by variant, not effective configuration snapshot | R1 | Add distinct configuration-snapshot dependency |
| Checklist session currently scopes by variant but not effective configuration snapshot | R1 | Add explicit mismatch/restart semantics |
| Offline cached operational content has no closed currentness contract | R1 | Define and verify currency semantics |
| Cached server Active Flight can be replayed from prepared `/fly` | R1 | Make prepared artifact flight-safe and prove local mirror is not overwritten |
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

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

Independent review was reconciled against current `main`. The underlying configuration split is confirmed, and several additional state-boundary requirements are now frozen.

#### Verified current-state findings

- new-shell `FtShell` resolves Fast Path configuration with `resolveSelectedVariant(undefined, aircraft.variants)` and therefore does not consume the page's explicit `?variant=`;
- child routes such as `/fly`, `/performance` and `/reference` independently resolve `searchParams.variant`;
- `FtFastPathReference` contains a separate client-side `window.location.search` resolver, proving current configuration ownership is fragmented;
- the existing `resolveSelectedVariant()` is permissive for an explicit invalid query: a single-variant aircraft can silently fall back to its sole variant and a multi-variant aircraft can collapse to undefined/common configuration;
- `effectiveConfigurationSnapshotIdForAircraftVariant()` is already deterministic over aircraft/variant configuration content: serial number, base variant, equipment tags, capability tags, modifications and explicit equipment state participate in its canonical snapshot identity;
- Performance Snapshot V2 currently invalidates on **variant key**, pressure altitude/runway wind and performance-source identity, but **not** on the effective-configuration snapshot ID;
- Checklist storage is currently scoped by aircraft + variant + checklist title + Active Flight scope, but not by effective-configuration snapshot ID;
- Active Flight itself does not currently own aircraft variant/configuration identity; its `configuration` field is operation/flight context such as flaps/anti-ice. Do not move aircraft applicability ownership into Active Flight merely to solve R1.1;
- new-shell side navigation and mobile navigation drawer already preserve `?variant=`; Fast Path rail actions are buttons rather than route links;
- the source-gated Partial Power preview currently sets Aeronca when the pilot selects Partial Power rather than proving thrust-reverser applicability from the effective aircraft configuration. This remains training/source-limited, but R1.1 must not allow it to bypass the shared applicability context.

#### Frozen product decision: no variant selected

For **EFB**, a multi-variant aircraft with no resolved variant/configuration is **not operationally configured**. Operational Fast Path content must show a visible configuration-required state rather than silently using common content.

For **LEARN**, common/non-variant-specific content may remain viewable when its applicability contract permits it, with a visible configuration context where ambiguity matters.

This distinction preserves useful training access without allowing operational omission to masquerade as a configured aircraft.

#### Resolver contract

Do **not** tighten the legacy `resolveSelectedVariant()` in place during R1.1. It is shared with flag-OFF/legacy behavior, and R1 acceptance requires that legacy remain unchanged.

Introduce a new generic new-shell/workspace resolver with four explicit outcomes:

1. **not-requested** — no explicit variant selector was supplied;
2. **selected** — a valid variant resolved to a valid effective configuration;
3. **unknown-variant** — an explicit selector names no governed variant;
4. **configuration-invalid** — the variant exists but its effective configuration cannot be safely resolved/validated.

The resolution value must carry:

- aircraft ID;
- requested selector/source (`explicit` vs permitted sole-variant default where applicable);
- resolved variant key when valid;
- effective `AircraftConfiguration`;
- deterministic effective-configuration snapshot ID;
- resolution state.

An explicit invalid query must never silently select another variant, the sole variant, or common/default configuration.

#### Ownership/data-flow invariant

> One resolved workspace configuration identity must drive the page and every Fast Path operational projection.

Every operational projection boundary should carry/echo:

`{ aircraftId, variantKey, effectiveConfigurationSnapshotId }`

If a client surface receives mismatched page/Fast-Path identities, it must fail closed to a visible **Configuration mismatch** state. This echo invariant is defense-in-depth against future wiring drift; it is not a second configuration owner.

`FtFastPathReference` must stop re-resolving `window.location.search` once the shared scope exists.

#### State invalidation/scoping

Reuse current domain ownership rather than introducing another persisted selector:

- **Performance:** evolve Snapshot V2/current dependency inputs so same-variant configuration changes (serial/equipment/modification snapshot changes) make stored Takeoff/Landing results stale and require recalculation. Keep `activeFlightDependencySnapshotId` audit-only; it is not the aircraft configuration snapshot.
- **Checklist:** include effective-configuration snapshot identity in the operational checklist session boundary. A changed configuration must not silently continue completion state from the old configuration. Preserve the old session under its old identity and start the new configuration's session explicitly, with a visible configuration-changed notice where the transition occurs; do not destructively erase prior progress.
- **QRH/REF:** re-filter governed content from the same effective configuration scope. Unknown/invalid configuration fails closed.
- **Partial Power preview:** before any future operational enablement, source/equipment applicability must come from the same effective configuration rather than a pilot mode toggle alone. For the current source-gated training preview, mismatched/unsupported effective thrust-reverser configuration must remain unavailable.

#### Next.js transport mechanism — spike required

The ownership contract above is frozen; the exact App Router transport is not.

R1.1 implementation starts with a small spike proving the cleanest way for the new-shell Fast Path to receive the same query-resolved server scope as the child page under Next 16.

Preferred candidate to test first:

- a query-aware server projection/parallel-route slot that receives `searchParams` and supplies the Fast Path payload/scope to the shell.

Fallback only if the spike disproves that mechanism:

- a page-owned server scope projection registered into the shell/provider, with every payload carrying the scope echo identity and the drawer remaining fail-closed until identities match.

Reject for R1.1:

- undocumented request-header tricks;
- a second persisted selected-variant truth;
- Learjet-specific runtime branches;
- moving all governed aviation filtering client-side merely for convenience.

A path-segment configuration selector may be reconsidered in a future architecture phase, not introduced as an R1 compatibility rewrite.

#### Acceptance

- failing tests are written first for valid and invalid selector behavior;
- valid explicit variant: page and CHECKLIST/QRH/PERF/REF report identical `{variantKey, snapshotId}`;
- unknown variant on a single-variant fixture: explicit invalid state, never the sole variant;
- unknown variant on a multi-variant fixture: explicit invalid state, never common;
- known variant with unresolvable/invalid configuration: `configuration-invalid`;
- effective snapshot ID changes when serial/equipment/modification/configuration content changes and remains stable for equivalent content;
- same variant key + changed effective snapshot makes existing Performance result stale;
- same variant key + changed effective snapshot cannot silently reuse checklist completion state;
- deliberate projection-identity mismatch trips the configuration-mismatch guard;
- EFB multi-variant/no-selection state gates operational tabs; LEARN common content retains its separate permitted behavior;
- side-nav/drawer links continue preserving the selector;
- source-text/static guard prevents Fast Path from reintroducing private `window.location.search` configuration resolution;
- no aircraft-ID branch is introduced in generic runtime;
- legacy flag-OFF snapshot/runtime tests remain unchanged.

This gate closes before final QRH cockpit acceptance so the acceptance run exercises the exact configuration context selected by the pilot.

#### R1.1 / R1.3 shared identity boundary

R1.1 and R1.3 contracts are frozen together because offline package identity depends on the same effective configuration snapshot. Runtime implementation remains sequenced: implement/verify R1.1 first; then run QRH.4 against the unified configuration; R1.3 can proceed after R1.1 and may run in parallel with final QRH acceptance if evidence remains independent.

### R1.2 — QRH.4 cockpit acceptance

Scope:

- execute the existing QRH.4 acceptance contract against the real cockpit surfaces after R1.1 configuration consistency is closed;
- verify Emergency vs Abnormal distinction, memory-item emphasis, graphical source envelopes, source/authority disclosure and fail-closed configuration filtering;
- verify the actual Fast Path scroll container on desktop, mobile, iPad landscape and iPad portrait;
- verify the applicable QRH package remains source-authoritative for the selected configuration;
- complete authenticated production smoke before formal closure.

Do not redesign the QRH content contract unless acceptance reveals a genuine defect.

### R1.3 — Offline governed-content currency

The independent review is accepted with corrections verified against current code.

#### Verified current-state findings

- explicit offline preparation caches rendered `/fly` plus required static and aviation support assets;
- the current cache key preserves `?variant=`;
- the cache key does not include the deterministic effective-configuration snapshot ID, so serial/equipment/modification changes under the same variant key can leave an older prepared copy addressable;
- cached `/fly` has no explicit governed operational package/publication identity;
- online operational readiness checks current publication freshness/source authority, but an already cached offline page cannot independently discover later stale flags or replacement publications;
- live weather is already bypassed by the service worker and must remain uncached;
- Active Flight identity is separate from the aircraft package contract and must not be embedded as part of a reusable offline aircraft-content package.

Frozen rule:

> **Offline availability is not a currentness claim.**

No arbitrary elapsed-time expiry threshold may be used as a proxy for source validity.

#### Minimal operational package manifest

Define a small server-derived manifest over existing canonical truth. It is an identity/verification layer, **not** another repository.

A package may be prepared only if its required operational readiness gates are satisfied. Readiness is therefore a **precondition/verification result**, not a component hashed into the immutable package identity.

The manifest should contain diagnostic components and a derived `packageId` over the minimum change-sensitive set:

- manifest schema version;
- aircraft ID;
- selected variant key;
- deterministic effective-configuration snapshot ID;
- sorted governed published version IDs for operational DB-backed domains actually embedded/projected into the prepared surface (for example Checklist/QRH and Limitations when present);
- deterministic content hashes/fingerprints for bundled operational Performance/Reference packages that are not represented by DB publication version IDs.

Do **not** use deployment/build ID as the package identity: it would invalidate safe prepared content on unrelated deploys.

Bundled package fingerprints should come from canonical serialization/content hashing of the package definition/build artifact, not manually maintained version strings.

#### Same-response construction invariant

The prepared document and its manifest/package identity must describe the **same rendered source/configuration objects**.

Preferred contract:

- server render computes/embeds the package identity from the same resolved configuration/content used to render the page;
- offline preparation stores metadata from that same response rather than performing a second independent "what package is this?" read;
- online verification uses a small endpoint/server function that re-resolves the current package identity **plus current readiness/freshness** and compares it with the prepared manifest.

This prevents "page A cached while manifest B was queried" races.

#### Preparation/cache commit

Preparation must be atomic at the package level:

1. prepare HTML/support assets for the candidate package;
2. persist its manifest/metadata;
3. only after required pieces succeed, commit/update the pointer saying which package is the device's prepared copy.

An interrupted refresh must not create a half-new/half-old package or mark the candidate ready. The previous complete prepared copy may remain recoverable until replacement succeeds.

Implementation does not have to create an unbounded permanent cache per package; it does have to preserve this atomic semantic.

#### Pilot-facing state machine

- **Not prepared** — no valid prepared manifest/copy.
- **Offline ready** — browser is online, current server readiness passes, and current package identity matches the complete prepared copy. This is the only state allowed to claim readiness.
- **Outdated** — online verification finds a different package identity or readiness/freshness no longer passes; prompt refresh before claiming offline readiness.
- **Prepared copy / not revalidated** — the service worker actually served a valid prepared copy because network/current verification was unavailable. Keep it viewable with neutral language such as "Prepared copy · last verified online …"; do not call it current.
- **Unverified** — manifest missing/corrupt/unknown schema, internal identity mismatch, or package provenance cannot be proven. Fail closed and do not present it as operationally ready.

Whether the document was served from cache must come from the service-worker fallback path/response metadata or equivalent explicit signal, **not** only from `navigator.onLine`.

A poor connection may serve cache while the browser still reports online.

#### Flight-context boundary

The offline aircraft package is flight-agnostic.

Active Flight/checklist user state remains separately device/account scoped by its canonical persistence contracts. R1.3 must add a regression proving the prepared HTML/package identity does not embed a specific Active Flight as package identity.

If the current server-rendered `/fly` response contains user/Active Flight-specific presentation data, that must be audited before caching and either separated from the reusable package or explicitly scoped so one flight cannot leak into another offline session.

#### Acceptance

- same variant key + changed effective configuration snapshot => different `packageId`;
- changed published operational version => different `packageId`;
- changed bundled Performance/Reference content hash => different `packageId`;
- superseded/stale source with otherwise unchanged package identity => online readiness verification fails and **Offline ready** is removed;
- not-ready content refuses authoritative package preparation;
- manifest missing/corrupt/unknown schema => unverified, never ready;
- race test proves cached page + manifest/package identity come from one coherent render/preparation;
- interrupted preparation leaves the previous complete package intact and does not mark the candidate ready;
- service-worker cache fallback is distinguishable even when `navigator.onLine === true`;
- offline UI distinguishes prepared/last-verified from currently revalidated;
- prepared governed content may remain viewable when revalidation is impossible, but claims of currentness/readiness fail closed;
- no arbitrary age-based expiry/color threshold is introduced;
- live weather remains uncached;
- offline surface set is explicit: routes not prepared for offline use must not appear to be available offline;
- no Active Flight identity becomes part of reusable aircraft package identity.

R1.3 may add a small manifest/verification endpoint or equivalent server contract, but it must consume existing publication/configuration truth rather than duplicating it.

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

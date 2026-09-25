# FlyTally Training — Technical Documentation

**Status:** maintained current-state technical documentation  
**Owner:** Filip Točík  
**Last updated:** 2026-09-25

This is the single maintained technical/product documentation file for FlyTally Training.

Use the repository documents as follows:

- `README.md` — short repository entry point.
- `ROADMAP.md` — authoritative product direction, implementation order and status.
- `CHANGELOG.md` — authoritative accepted/released change history.
- `TECHNICAL_DOCUMENTATION.md` — current architecture, contracts, governance, runtime, UX, deployment and safety documentation.

Historical milestone/specification Markdown files were consolidated into this document. Git history and pull requests retain their detailed historical evidence; old milestone files are not active technical contracts.

---

## 1. Product boundary

FlyTally Training is a separate product, repository, deployment and persistence domain from FlyTally Logbook.

Production:

- repository: `filipto861/flytally-training`
- production origin: `https://training.fly-tally.com`
- runtime: Node.js 24.x
- framework: Next.js 16 / React 19 / TypeScript
- persistence: dedicated PostgreSQL / Neon
- deployment: dedicated Vercel project

FlyTally Logbook remains responsible for operational logbook/regulatory evidence. Training owns aircraft learning, procedures, checklists, source-governed reference material, scenarios, performance tools and learner progress.

The products share **identity**, not database access.

No Training runtime code may query Logbook database tables or copy Logbook session internals. Cross-product behavior must use explicit contracts.

---

## 2. Product modes and information architecture

The current product has two explicit aircraft-workspace modes.

### LEARN

Learning and knowledge surfaces:

- Learn
- Systems
- Procedures
- Limitations
- Reference
- Training/scenarios/orientation where applicable

### EFB

Operational-flight workspace:

- Flight Brief
- Performance
- Flight Deck

The persistent operational fast path is frozen as:

`CHECKLIST / QRH / PERF / REF`

Historical P5 ownership wording remains useful as a contract: **REF was Not P5 — owned by P7**. The current implementation keeps all four slots generic and aircraft-agnostic.

Active Flight answers **what flight**. Performance answers **what calculation**.

Learning state and operational-flight state must remain separate.

---

## 3. Repository and code boundaries

Production application boundaries are primarily:

- `app/` — Next.js routes and server composition
- `components/` — shared product and interactive UI
- `lib/` — generic runtime, domain, persistence and governance contracts
- `aircraft-data/` — source-backed aircraft-specific data/bootstrap packages only
- `tests/` and `e2e/` — executable contracts and acceptance coverage
- `tooling/` — explicit bootstrap/release/acceptance tooling

Core rule:

> Aircraft-specific content is data. Product behavior is code.

Generic learner/runtime code must not branch on named aircraft, manufacturer, model or simulator add-on to decide product behavior.

A new aircraft must not require a new route or aircraft-specific React component merely because the aircraft is new.

The static aircraft catalogue remains empty in production architecture; aircraft are onboarded through the governed database workflow.

### Multi-aircraft scale evidence

v3.1 acceptance established that a real second aircraft and a sparse third-aircraft package can use the same generic runtime.

Historical M1 finding, retained for context: **P0 — performance semantics are still encoded in application code**. That audit drove the later declarative performance work. The governing rule remains: **No performance operation may depend on magic axis/output names** and existing aircraft behavior must be reproducible by data declarations rather than model-name branches.

Historical real second-aircraft acceptance evidence recorded:

- controlled source revisions: **3**
- exact registered source references: **42**
- effective published learner modules: **8**
- unresolved stale-source flags: **0**
- M4 acceptance: **PASS**

The scale criterion is sparse by design: missing domains remain absent rather than being fabricated to make every aircraft look like the Learjet.

---

## 4. Identity and session contract

Training and Logbook share **identity**, not database access.

### SSO handoff

1. Training redirects to the Logbook identity handoff endpoint.
2. Logbook authenticates through its own session.
3. Logbook issues a short-lived signed assertion.
4. Training verifies it and creates a host-only Training session.
5. Training persistence derives `account_subject` from that verified server session.

Assertion format:

`ft1.<base64url JSON claims>.<base64url HMAC-SHA256 signature>`

Required claims include issuer, audience, stable subject, role, issued-at, expiry and one-time `jti`.

Training rejects malformed, expired, future-dated, wrong-audience, wrong-issuer, over-long-lived, incorrectly signed or replayed assertions.

Training owns `flytally_training_session`, signed with `TRAINING_SESSION_SECRET`.

Current maximum session lifetimes:

- user: 7 days
- admin: 12 hours

Training progress lives in the Training PostgreSQL database under `account_subject` with no direct Logbook database foreign key.

---

## 5. Source governance and content lifecycle

FlyTally Training is not a source-document hosting library.

The source document stays outside FlyTally under the administrator's lawful access. Training stores governed evidence:

- source family/manual identity
- publisher
- immutable revision
- issue date
- authority role
- applicability notes
- exact chapter/section/page references
- optional citation URI
- optional locally computed SHA-256 fingerprint
- approval/publication/stale-state evidence

The browser may compute a source PDF SHA-256 fingerprint locally. The file itself is not uploaded or retained as a Training product asset.

Canonical provenance chain:

`Manual/source family → immutable revision → source reference → draft content → human approval → publication`

Technical records are versioned. Published versions are not edited in place.

A re-source operation creates a **new immutable human draft** using the **exact existing payload** and new reviewed provenance. It **does not auto-approve or auto-publish**. The re-source workflow **does not host source documents**.

**Server-side governance remains authoritative.**

### Source authority

Safety-critical domains fail closed. Operational readiness for checklists, procedures, performance, weight & balance, limitations and abnormal/emergency content requires source authority allowed by the domain policy.

Operational source authority roles include:

- `CONTROLLING`
- `OPERATING_REFERENCE`

Other roles may support training/reference content when the explicit `available-sources` policy permits them, but they are not silently promoted to operational authority.

Stale or ambiguous operational content fails closed.

### AI boundary

AI may structure or draft from intentionally supplied source excerpts. AI is never source authority.

Publishable technical content requires source provenance; **human governed review/approval is required** before publication.

---

## 6. Content repository and authoring architecture

Learner-facing routes read content through the asynchronous `TrainingContentRepository` boundary.

Production content is PostgreSQL-backed. Temporary/static aircraft packages are bootstrap adapters, not the long-term product storage model.

No client component queries PostgreSQL directly.

The admin lifecycle is:

`Create aircraft → register configuration → register source revision → create exact references → draft → review → approve → publish`

### Structured Content Builder

Routine content maintenance uses a structured payload editor instead of making raw JSON the normal workflow.

The builder supports recursive objects, arrays, source/applicability fields, performance rows and contract validation.

The authoring lifecycle remains:

`published/approved/draft version → structured edit → new immutable human draft → validation → human approval → publish`

Raw JSON is only an advanced synchronized escape hatch; it cannot bypass validation, approval or publication.

### No-code aircraft onboarding

Aircraft identity, variants/equipment and supported modules are database-governed.

Applicability may use registered variant/equipment predicates. Approval and publication fail closed if payloads reference unregistered identifiers.

Sparse aircraft are valid. No aircraft must mimic the Learjet curriculum.

---

## 7. Active Flight

Active Flight is the EFB operational context.

Lifecycle states are explicit and persisted through the Training Active Flight domain.

The shell may reconcile anonymous/local state and server state, but one current Active Flight is the operational context presented to the user.

Active Flight does not own Performance calculation logic. It supplies flight identity/context; the Performance operation owns calculator inputs, calculation state, provenance and snapshots.

### Checklist session ownership

The new-shell EFB uses one canonical checklist session shared by:

- the main Flight Deck checklist
- top checklist progress
- CHECKLIST fast-path drawer

Completed items and selected phase synchronize bidirectionally.

EFB checklist persistence is local-device state scoped to the current Active Flight ID. Reopening the same active flight restores progress on that device; another Active Flight receives an isolated session.

Legacy/unscoped checklist state is migrated once into the scoped session and consumed so it cannot seed later flights repeatedly.

Learn checklist-training persistence remains separate from operational Active Flight checklist state.

---

## 8. Operational fast path

Fast-path tabs remain:

1. CHECKLIST
2. QRH
3. PERF
4. REF

### CHECKLIST

Uses the canonical checklist session described above.

Fast-path behavior includes:

- phase selection synchronized with the main Flight Deck
- phase/global progress
- CURRENT STEP scoped to the selected phase
- Reset phase
- two-step Reset all
- completed-phase marker
- Next phase affordance

### QRH

QRH uses only published universal abnormal/emergency content that passes operational source readiness.

The operational projection may contain scenario identity, stage/action responses, notices, configuration/boundary information and source references.

Training-only fields such as setup, objectives, debrief, prompt, explanation, minutes and difficulty must not leak into operational QRH.

Legacy abnormal training content is not promoted merely because it can be normalized.

### PERF

PERF owns operational Performance presentation/calculation. It is not duplicated into REF.

### REF

The new-shell REF source of truth is **governed universal limitations**.

**PERF already owns operational performance lookup**, so REF must not duplicate/invent performance calculations.

Legacy `reference-knowledge` is **not promoted** into the operational REF fast path.

---

## 9. Performance architecture

The performance runtime is generic and aircraft-agnostic. Aircraft-specific source grids, transforms and applicability live in governed data/packages.

### Fundamental rules

- exact published source points are valid when applicable
- interpolation is allowed only when the governed dataset explicitly authorizes it
- bounded interpolation only
- no silent extrapolation
- sparse source regions fail closed
- unsupported configuration/source combinations fail closed
- source provenance remains attached to the calculation path

An operational result may use an exact source row regardless of interpolation policy.

Runtime/Flight Deck code **must never rewrite a dataset from `none` to `linear-explicit`** merely to obtain a result. The runtime honors the governed source dataset interpolation authority exactly.

### Takeoff and Landing

The EFB provides operation-owned Takeoff and Landing setup, explicit Calculate/Recalculate behavior and versioned calculation snapshots.

Takeoff currently includes source-backed N1, V1, VR, V2 and Takeoff Distance for supported source regions/configurations.

Landing includes source-backed VREF, landing/approach climb data and factored landing distance for supported source regions/configurations.

Observed negative pressure altitude remains visible to the pilot while applicable Takeoff source lookup may use the published S.L./0 ft floor. This is not generalized extrapolation.

### Wind correction

Takeoff wind correction is a post-baseline source transform. Signed headwind/tailwind corrections are applied only where the published source/data package supports them.

### Declared distances

Physical runway length is not authoritative TORA/ASDA/TODA/LDA.

Declared-distance values carry provenance. The generic Learjet takeoff field constraint uses the lower of available TORA and ASDA where required by the source workflow.

Airport database runway length may be presented only as a suggestion requiring confirmation; it is not silently promoted to a declared distance.

### Partial Power / reduced thrust

Current pilot UI includes a source-supported **Partial Power · Aeronca** training preview.

It remains visibly **TRAINING · 25% LIMIT UNVERIFIED**.

Current source-supported behavior includes Assumed Temperature selection and Aeronca reduced-N1 evaluation inside the verified source envelope.

Operational use remains blocked until the independent source requirement limiting reduction to no more than 25% rated takeoff thrust can be evaluated without treating N1 points as percent rated thrust.

No unresolved no-reverser/TR-4000 interpolation is invented. Flaps 20 nonzero-wind support remains fail-closed until verified source data exist.

The training preview is ephemeral and is not promoted into the operational Takeoff snapshot while that blocker remains open.

---

## 10. Learjet 35A/36A reference implementation

Learjet 35A/36A is the demanding reference aircraft used to prove generic product capabilities. It must not become an aircraft-specific runtime architecture.

Current EFB source-backed areas include Takeoff/Landing performance and the published Normal Checklist.

### CL-102B Normal Checklist

The reviewed Learjet 35/36 CL-102B Change 2 Normal Procedures package covers N-2 through N-18 and is published through governed content.

N-15 landing speeds/distances are Performance/reference data and are not duplicated as checklist steps.

Current `fc530-standard` applicability selects Rosemount/FC-530-compatible content. Unknown or unresolved equipment remains fail-closed rather than guessed.

TR-4000/Aeronca-specific actions are not shown unless the applicable equipment identity is positively represented.

Serial/effectivity-specific material that cannot be represented safely by the current applicability contract remains deferred.

CL-102B is treated as `OPERATING_REFERENCE`; it does not supersede the FAA-approved AFM.

---

## 11. UX and responsive shell

The UX6 redesign established the current pilot-workspace/EFB visual direction.

The shell is designed for:

- Desktop Chromium
- iPad landscape
- iPad portrait
- Narrow mobile

The product must behave as a pilot workspace rather than a generic website/admin panel.

Design principles include:

- content before chrome
- scan before read
- clear primary action hierarchy
- few surface levels
- no fake aviation/HUD decoration
- provenance quiet but available
- fail-closed states presented inside normal product language
- light and dark treated as peer themes
- accessibility built into component behavior

Historical UX6 design-system tokens included:

- `--ux6-canvas`
- `--ux6-workspace`
- `--ux6-panel`
- `--ux6-elevated`
- `--ux6-selected`
- `--ux6-accent`

The key semantic rule remains: **Application state is separate from source-safety semantics**. WARNING / CAUTION / NOTE styling is not repurposed for ordinary application selection/state. **Source age remains neutral metadata**.

No fake authority cues are permitted; visual emphasis must not imply source validity, recency or safety state.

### Historical UX acceptance contracts

The current LEARN/EFB shell superseded the older mixed five-destination IA, but the historical acceptance evidence remains useful for regression context.

Historical frozen destination strings:

- `AIRCRAFT / PROCEDURES / PERFORMANCE / TRAINING / FLIGHT`
- `CHECKLIST / QRH / PERF / REF`

UX0 classified the pre-redesign shell as a **functional development scaffold** and **technical wireframe**. It explicitly audited:

- Desktop Chromium
- iPad landscape
- iPad portrait
- Narrow mobile
- content frame/max-width
- sidebar width
- top bar
- fast-path dominance

The historical constraint was: **UX1 must not redesign P0–P7 page internals** while the shell composition was being established.

**No fake authority cues** are permitted. Ordinary visual emphasis **must not imply source validity, recency or safety state**.

UX6 Gate A recorded: **APPROVED — PRODUCT OWNER GATE A PASSED**. The approved concept used five top-level destinations at that time, with the rule that **Systems and Reference must appear through contextual/sub-navigation**, and narrow-screen fast-path interaction used a **bottom sheet** direction. These are historical design decisions, not a competing current IA.

Historical UX6 surface system:

### Light

Peer light surfaces use the UX6 canvas/workspace/panel/elevated/selected/accent hierarchy.

### Dark

Peer dark surfaces use the same semantic hierarchy rather than a separate visual model.

The historical token contract included:

- `--ux6-canvas`
- `--ux6-workspace`
- `--ux6-panel`
- `--ux6-elevated`
- `--ux6-selected`
- `--ux6-accent`

**Application state is separate from source-safety semantics.** WARNING / CAUTION / NOTE remain source/safety language. **Source age remains neutral metadata**.

Historical UX5 final review covered these production routes:

- `/`
- `/aircraft/learjet-35a`
- `/aircraft/learjet-35a/procedures`
- `/aircraft/learjet-35a/performance`
- `/aircraft/learjet-35a/training`
- `/aircraft/learjet-35a/reference`
- `/aircraft/learjet-35a/flight`
- `/aircraft/learjet-35a/systems`

across Desktop Chromium, iPad landscape, iPad portrait and Narrow mobile, with **light and dark workspace themes**.

Historical UX5 status language was **Status: IN PROGRESS** until the product owner explicitly approved it. **Do not mark UX5 complete from automated tests alone**; the product owner must **explicitly approve** the visual result.

Historical UX6 final acceptance used **64 screenshots** across:

- 1664 × 930
- 1112 × 834
- 834 × 1112
- 390 × 844
- light
- dark

The visual gate language remains preserved as historical acceptance evidence: **Filip explicitly approves** the result; automation **may not infer product-owner visual approval**. The old gate transitions were **C0 HOLD** and **C0 UNBLOCKED**.

The historical desktop presentation debt identified `content > *` as contributing to an **under-filled desktop composition** in the earlier **development scaffold**.

### Reference-screen acceptance history

UX6 reference previews included:

- `/ux6-preview`
- `/ux6-preview/performance`
- `/ux6-preview/flight`
- `/ux6-preview/library`
- `/ux6-preview/systems`

The final UX6 visual acceptance matrix used 64 screenshots across:

- 1664 × 930
- 1112 × 834
- 834 × 1112
- 390 × 844
- light and dark themes

Automated tests may not infer product-owner visual approval. Final visual acceptance requires Filip explicitly approves the result.

Historical UX5/UX6 audits treated the pre-redesign UI as a **functional development scaffold** / technical wireframe rather than automatically declaring a test-green UI visually final.

---

## 12. PWA and offline boundary

Training supports installable PWA behavior where the platform allows it.

Chromium may use `beforeinstallprompt`. iOS/iPadOS uses explicit Safari Share → Add to Home Screen guidance.

Installation UI must stay out of the Flight Deck cockpit surface.

The service worker precaches only support assets in the shell cache. Operational Fly caching remains explicit/configuration-aware; authenticated learner/admin pages are not blanket-cached.

A true device offline reload and iOS standalone launch still require real-device acceptance when changed because CI cannot physically validate browser/OS installation behavior.

---

## 13. Deployment and release

A green build alone is not a release.

### Production environment

Production requires the Training-owned environment, including:

- `TRAINING_DATABASE_URL`
- `TRAINING_SESSION_SECRET`
- `FLYTALLY_IDENTITY_SECRET`
- `FLYTALLY_LOGBOOK_URL`
- `TRAINING_CONTENT_BACKEND=postgres`
- `OPENAI_API_KEY` only when live admin drafting is needed

Logbook must have:

`TRAINING_APP_URL=https://training.fly-tally.com`

and the same `FLYTALLY_IDENTITY_SECRET`.

### Database bootstrap

A new Training database is initialized explicitly:

`npm run db:init`

Runtime requests must not silently self-provision database schema.

### Production health

Check:

- `GET /api/health`
- `GET /api/readiness`

`/api/health` is liveness only.

`/api/readiness` exposes operational and source-governed release profiles. HTTP 200 means the production runtime/readiness contract is healthy; it is not commercial/legal/regulatory clearance.

### Disposable acceptance

Destructive no-code/PostgreSQL acceptance must use `TRAINING_ACCEPTANCE_DATABASE_URL` against a disposable/preview PostgreSQL database with explicit disposable confirmation. Never point the destructive acceptance runner at production.

---

## 14. Development workflow

`main` is the only long-lived branch.

Short-lived branch conventions:

- `feat/*`
- `fix/*`
- `chore/*`
- `docs/*`

Prefer coherent candidate-first changes over repeated remote iterations.

Foundation verification:

```bash
npm run typecheck
npm test
npm run build
```

`npm run verify` runs the foundation gate.

Targeted tests are preferred during focused development. Full repository and Playwright gates are used when the change scope requires them.

The committed `package-lock.json` is the canonical dependency graph and CI installs with `npm ci`.

GitHub Actions may be supplemented by equivalent local gates when remote runner limits prevent execution; results must be recorded in the roadmap/PR when used as acceptance evidence.

---

## 15. Safety, compliance and commercial boundary

FlyTally Training is a supplemental training/reference aid. Current approved aircraft documentation, operator procedures, regulatory requirements and qualified instruction remain authoritative.

### Source rights

Technical/source governance and technical publication do not establish commercial publication rights.

**Proprietary, NDA-restricted** or otherwise restricted material must not be published merely because it can be technically represented.

A technical source record and human approval **neither one proves copyright, NDA, licence or derivative-publication rights**. Content without established publication rights **must therefore not be treated as commercially publishable**.

### Claims

The canonical v2.9 commercial-readiness contract lives in FlyTally Logbook.

Training must not claim EASA, ÚCL, LAA ČR, manufacturer or operator approval unless separately established.

“Source-backed”, “published” and “governed” describe FlyTally's technical/content process; they **do not mean manufacturer, operator or aviation-authority approval**.

Training **must not market a technically published aircraft package as manufacturer-approved** merely because it passed internal governance.

Training **must not add a registered-trademark claim or the ® symbol** without verified trademark status.

### Regulatory/signature boundary

The canonical C4 assurance taxonomy and authority-validation state live in FlyTally Logbook.

Manufacturer review of aircraft training content would not automatically make FlyTally an authority-approved training organisation or approved logbook.

External validation evidence remains pending where the commercial/regulatory roadmap says so.

QES is a reviewed strategy decision, not a presumed requirement. Existing internal acknowledgements/sign-offs must not be relabelled as advanced or qualified electronic signatures without the required legal/technical basis.

### Commercial release state

The **canonical C6 commercial-release audit lives in FlyTally Logbook**. Training **does not introduce a second launch flag**.

Technical production readiness and commercial clearance are deliberately separate.

Training must not interpret a healthy `/api/readiness` response as commercial, legal, regulator, trademark or source-rights clearance.

The current commercial launch remains blocked until the canonical commercial-readiness requirements are closed.

---

## 16. Documentation governance

Technical documentation follows the same discipline as code:

- `ROADMAP.md` records intended direction/status before material work starts.
- `CHANGELOG.md` records accepted/released changes.
- this file records current technical contracts, not every historical implementation conversation.
- when a technical contract changes materially, update this file in the same PR.
- historical implementation detail remains recoverable from Git history and PRs.
- do not create new milestone/specification Markdown files for ordinary development; add the current contract here and track the work in the roadmap.

This consolidation intentionally replaces the former root-level M*, P*, UX*, V31*, architecture, feature, deployment and performance Markdown set.


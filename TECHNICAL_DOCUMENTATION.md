# FlyTally Training — Technical Documentation

**Status:** Living technical reference  
**Repository:** `filipto861/flytally-training`  
**Production:** `training.fly-tally.com`  
**Runtime baseline:** Node.js 24 · Next.js 16 · React 19 · TypeScript · PostgreSQL · Vercel

> This file is the single maintained technical/product documentation reference for FlyTally Training.
> Active implementation direction belongs in `ROADMAP.md`. Accepted/released history belongs in `CHANGELOG.md`.
> Historical milestone documents were consolidated here and remain recoverable through Git history and pull requests.

---

## 1. Product boundary

FlyTally Training is the aircraft learning, training and operational-reference product in the FlyTally ecosystem.

FlyTally Logbook remains a separate repository and product responsible for operational pilot logbook functions, regulatory evidence and canonical account/commercial boundaries. Training does not import Logbook runtime code or query Logbook databases directly.

Training currently has two explicit product modes:

- **LEARN** — aircraft knowledge, systems, procedures, limitations, reference and training.
- **EFB** — operational flight tools: Flight Brief, Performance, operational checklist, QRH/reference fast paths and future source-backed operational tools.

Core ownership rule:

`Active Flight defines what flight. Performance defines what calculation.`

Learner/training state must remain separate from operational Active Flight state.

---

## 2. Architectural principles

### 2.1 Generic runtime, aircraft-specific data

Learjet 35A/36A is the reference aircraft used to prove the architecture end-to-end. It must not become a special-case runtime.

Rules:

- aircraft-specific technical content is governed data;
- reusable routes/components must remain aircraft-agnostic;
- adding another aircraft must not require aircraft-ID branches in generic UI/runtime;
- sparse aircraft content is valid and must fail closed rather than fabricate missing modules;
- applicability must be resolved through the shared aircraft configuration model rather than model-name inference.

A new aircraft is considered genuinely no-code only when it can be registered, sourced, governed, published and rendered without a new aircraft-specific React route/component or runtime branch.

### 2.2 Server-first boundary

Learner-facing pages resolve governed content on the server through repository contracts and pass plain resolved data into client interaction components.

Client components must not query PostgreSQL directly.

### 2.3 Stable product domains

Current first-class domains include:

- aircraft catalogue and variants;
- controlled source/manual metadata and revisions;
- systems;
- procedures;
- checklists;
- abnormal/emergency scenarios;
- performance;
- limitations/reference;
- cockpit orientation;
- avionics;
- knowledge/training content;
- Weight & Balance where source-backed;
- learner progress;
- Active Flight operational state;
- content administration/governance.

Do not design one database table per screen. Persist stable product concepts and let presentation evolve independently.

---

## 3. Source governance and aviation integrity

Technical content follows this chain:

`Source family → immutable source revision → exact source reference → draft content → human approval → publication`

### 3.1 Source records

FlyTally records the metadata required to audit content:

- source/manual identity and publisher;
- immutable revision identity/code and issue date;
- authority classification;
- applicability/effectivity notes;
- exact chapter/section/page reference where available;
- optional citation URI;
- optional SHA-256 fingerprint and local-file metadata.

A newer source revision does not silently overwrite previously approved content. Dependent content may become stale and require review/republication.

### 3.2 Authority roles and fail-closed operational content

Operational surfaces may only consume content that passes the current governance/readiness gates. Safety-critical/operational content fails closed when:

- the source is missing;
- linked source identity does not match the aircraft;
- source authority is insufficient;
- publication is stale/ambiguous;
- required applicability/configuration cannot be established;
- the calculation would require extrapolation or unsupported source geometry.

Training-only fields must not leak into operational QRH/checklist projections.

### 3.3 AI boundary

AI may assist with extraction, structuring, drafting and review support, but it is never source authority.

Human governed review/approval is required before AI-assisted technical content may be approved or published. AI output remains draft until source provenance and that required review/approval are present. Proprietary, NDA-restricted or otherwise non-shareable material must not be sent to an external provider unless that processing is permitted. Server-side governance remains authoritative and accepted authoring changes create a new immutable human draft rather than rewriting an approved version in place.

### 3.4 Source rights are separate from technical publication

A governed technical publication is not proof of copyright, licence, NDA, manufacturer, regulator or commercial-publication permission. Public/commercial source-rights validation is a separate external/legal gate.

### 3.5 Fingerprint re-source boundary

Re-sourcing an existing governed payload to a fingerprint-backed source record preserves the exact existing payload. It creates a new immutable human draft with updated provenance; it does not auto-approve or auto-publish. The current source-ingestion model records source identity/fingerprint metadata and does not host or serve source documents.

---

## 4. Content repository architecture

The target aircraft content workflow is:

`Create aircraft → register variants/configuration → register source revision → create exact source references → draft → review → approve → publish`

Production learner reads use `PostgresTrainingContentRepository`. Static/bundled data exists only as a controlled bootstrap/transition boundary where explicitly supported.

Important invariant:

> Aircraft-specific content is data. Product behaviour is code.

Generic routes must not need a new deployment merely because another aircraft package is added.

### 4.1 No-code second-aircraft acceptance

A valid no-code acceptance proves that a synthetic/second aircraft can:

1. be registered dynamically;
2. receive only its real variant/configuration structure;
3. register controlled source revision/reference records;
4. publish supported universal modules;
5. appear in the aircraft library;
6. render through existing learner routes;
7. execute generic calculator/runtime contracts where applicable;
8. coexist with Learjet using the same reusable components.

The destructive PostgreSQL acceptance runner must target a disposable database and requires the explicit disposable-database acknowledgement. It must never point at production.

---

## 5. Identity, authentication and account boundary

Training and Logbook share identity, not persistence.

### 5.1 SSO handoff

The identity flow is:

1. Training redirects to the Logbook identity handoff.
2. Logbook authenticates the user using its own session.
3. Logbook creates a short-lived signed identity assertion.
4. Training verifies the assertion and creates its own Training session.
5. Training persistence uses the verified stable account subject.

Training must never trust a browser-supplied account identifier.

### 5.2 Training session

Training owns its host-only signed session cookie and role-sensitive session lifetime.

Authenticated learner progress lives in the Training PostgreSQL database under `account_subject`. There is deliberately no direct Logbook database dependency.

### 5.3 Commercial entitlement boundary

Commercial entitlement authority remains on the canonical Logbook side. Training consumes the signed entitlement snapshot and must not maintain an independent commercial truth source.

Operational readiness is not commercial/legal clearance.

---

## 6. Persistence and privacy

Server-side persistence covers governed content, identity/session support, Active Flight state and learner progress.

Browser storage is used only for explicit product purposes such as:

- local operational checklist session state;
- learner interaction state where appropriate;
- form/preferences state;
- prepared offline Flight Deck cache.

### 6.1 Training privacy reset

Training exposes its own learner-data export/delete boundary. Training deletion is separate from main FlyTally account deletion.

Deletion uses a privacy-reset barrier so stale offline events cannot resurrect older deleted progress. Deletion and progress ingestion serialize on the same account-scoped database lock.

Clearing the current device removes Training local/session storage, relevant FlyTally Training caches and service-worker registration.

---

## 7. Active Flight architecture

Active Flight is the EFB flight context, not a generic learner state.

Rules:

- only one ACTIVE flight per account/aircraft context where the persistence contract enforces uniqueness;
- Active Flight owns flight identity and contextual values, not Performance calculation logic;
- Performance owns its own operation state/snapshots;
- operational checklist progress is scoped to the Active Flight identity;
- reopening the same Active Flight on the same device restores its local checklist state;
- a new Active Flight receives an isolated checklist session;
- Learn checklist practice remains a separate persistence mode.

### 7.1 SimBrief Active Flight prefill

SimBrief is an explicit pilot-initiated prefill source, not an Active Flight authority or a background synchronization channel.

- the pilot supplies either a Navigraph Alias or SimBrief Pilot ID; that identifier may be remembered only in device-local browser storage and is not persisted as Training account data;
- Training requests the latest SimBrief OFP only after an explicit Import/Refresh action through a same-origin, no-store, timeout-bounded server proxy using SimBrief JSON v2;
- the proxy normalizes only departure ICAO, destination ICAO, Estimated TOW, weight unit, aircraft ICAO identity, OFP request id and generation time; the raw OFP is not retained;
- SimBrief aircraft compatibility is aircraft-owned data. The Learjet 35/36 Training package accepts `LJ35`; mismatched or missing aircraft identity fails closed;
- imported departure, destination and weight remain pilot-editable. Editing a field removes SimBrief provenance for that field rather than silently re-applying the OFP;
- Active Flight persists only field-level prefill provenance (`provider/requestId/generatedAt/importedAt/aircraftIcaoCode/fields`), which does not participate in the Performance dependency hash;
- a further SimBrief refresh is always another explicit pilot action. No periodic OFP polling is allowed;
- METAR/weather ownership remains the existing AviationWeather.gov workflow and is not imported from SimBrief.

Active Flight persistence includes nullable `prefill_provenance`. Deployment bootstrap owns this schema evolution, and readiness verifies the column so a deployment cannot report healthy Active Flight persistence against an older schema.

---

## 8. Operational checklist architecture

The EFB checklist uses one canonical checklist session shared by:

- the full-page EFB **Checklist** workspace at the compatibility route `/fly`;
- top checklist progress indicator;
- CHECKLIST fast-path drawer.

The new-shell EFB canonical state is owned by the Fast Path provider. The new-shell `/fly` presentation is checklist-only: Performance remains owned by the dedicated PERF workspace and Emergency/Abnormal remains owned by QRH. The historical aggregate Flight Deck presentation remains only on the flag-off legacy path for backward compatibility.

Current operational checklist behavior:

- completed items synchronize bidirectionally across main and fast-path presentations;
- selected phase synchronizes bidirectionally;
- fast-path CURRENT STEP follows the selected phase;
- phase reset and two-step reset-all are supported;
- completed phases may be marked and advanced with Next phase;
- EFB persistence is scoped by Active Flight ID;
- prior unscoped canonical/legacy state is migrated once into the scoped session;
- malformed/stale identities are normalized against the current checklist and fail closed.

The Learjet governed operational checklist is based on CL-102B Change 2 Normal Procedures N-2 through N-18. N-15 landing speeds/distances remain Performance ownership rather than checklist duplication.

Configuration-specific checklist content must preserve effectivity. Current `fc530-standard` selects the source-backed Rosemount/FC-530 branches; unresolved equipment/model-specific actions remain hidden/fail-closed rather than guessed.

---

## 9. Operational fast path

The frozen fast-path tab order is:

`CHECKLIST → QRH → PERF → REF`

Keyboard shortcuts remain Ctrl+Shift+1 through Ctrl+Shift+4 in the same order.

### CHECKLIST

Uses the shared canonical operational checklist session described above.

### QRH

Uses the existing governed universal abnormal/emergency source of truth:

`published abnormal module → validate → configuration filter → operational projection → presentation`

Operational QRH may expose operational actions, notices and source references, but not training-only setup/objectives/debrief/prompts/explanations.

The Learjet reference-aircraft QRH is assembled as one governed `abnormal/bundle` package from source-reviewed Emergency and Abnormal batches. Batch files remain traceable source-review units; they are not independent learner publications. Publication reuses the common draft → approval → publication lifecycle and must pass embedded source/applicability validation against the aircraft configuration before becoming operationally readable.

QRH operating-envelope figures use `geometryPolicy: "source-digitized-visual-reference"`. Their digitized geometry is presentation-only: it must not be used as an interpolation surface, lookup table, or automated envelope-membership decision.

### PERF

Uses the canonical Performance presentation/controller and governed aircraft performance package.

### REF

Reference remains the owning domain in both product contexts and uses two governed data families:

- universal limitations/reference data;
- the separate Reference performance package for source-backed Climb/Cruise tables.

**LEARN → Reference** presents exact published source tables for study. It may select a regime and source-table slice such as gross weight, but it must not insert interpolated values into the displayed source matrix. Sparse, blocked or reviewed-anomaly cells remain visibly unavailable.

**EFB → REF fast path** provides the input-driven Climb/Cruise lookup over the same governed Reference datasets. Exact source rows are distinguished from bounded software interpolation. Continuous numeric inputs are permitted only inside complete published source geometry. Extrapolation, sparse-corner bridging, anomaly repair and interpolation across the one-engine Mach/KIAS reference-unit boundary remain fail-closed.

The dedicated **PERF** surface continues to own Takeoff/Landing operational Performance; Climb/Cruise Reference lookup is not moved into PERF. Existing governed limitations remain available in REF alongside the Reference lookup. Neither context promotes legacy `reference-knowledge` content.

REF was not P5 work; it was owned by the P7 reference phase. Historically P7 introduced REF as a limitations-only fast path and explicitly excluded performance lookup. Milestone 15.2d supersedes that presentation restriction while retaining P7's configuration filtering, provenance and aircraft-agnostic boundaries.

---

## 10. Performance architecture

Performance uses generic declarative calculator/runtime contracts plus governed aircraft datasets. Performance operation semantics are declared by data contracts; generic runtime must not depend on magic aircraft-specific axis/output names. Existing reference-aircraft behaviour must be reproducible through data declarations rather than named-aircraft branches.

Core rules:

- explicit Calculate/Recalculate workflow;
- immutable/versioned result snapshots;
- operation-scoped invalidation;
- AVAILABLE weather and APPLIED weather are distinct;
- manual overrides are explicit/sticky;
- bounded interpolation only where declared and source-supported;
- runtime must never rewrite a governed dataset from interpolation `none` to `linear-explicit`;
- no silent extrapolation;
- sparse source regions fail closed;
- source provenance remains auditable;
- calculator runtime must remain aircraft-agnostic.

### 10.1 Pressure altitude and source floor

Observed/derived pressure altitude remains visible to the user. Where the published chart floor is sea level, negative pressure altitude may use the source-defined 0 ft/S.L. performance floor without hiding the actual derived value.

No upper-envelope clamping is introduced.

### 10.2 Takeoff wind correction

Wind correction is a post-baseline transform, not a rewrite of the zero-wind grid.

Canonical topology:

- zero-wind Takeoff Distance + signed runway wind → corrected Takeoff Distance;
- zero-wind V1 + signed runway wind → corrected V1.

Headwind is positive; tailwind is negative.

The chart-derived correction already represents its regulatory wind treatment, so the runtime must not pre-factor the wind component again.

Current verified Learjet wind correction applies only where the source-backed configuration is available. Unsupported configurations such as unresolved Flaps 20 nonzero-wind correction remain fail-closed.

### 10.3 Runway declared distances

Physical runway surface length is not a declared distance.

The generic declared-distance contract owns:

- TORA;
- ASDA;
- TODA;
- LDA;

with per-value provenance.

For the current Learjet takeoff source topology:

`usable takeoff field length = min(TORA, ASDA)`

Neither value may be silently synthesized from another field or physical runway geometry.

An airport database runway length may be shown as a suggestion/context only where the UI makes its non-authoritative status explicit.

### 10.4 Partial Power / reduced-thrust takeoff

The Learjet Partial Power path uses the source-defined assumed-temperature procedure:

1. determine the highest source-supported Assumed Temperature that satisfies runway/weight constraints;
2. calculate V1 using that Assumed Temperature;
3. calculate reduced N1 from Ambient Temperature + Assumed Temperature;
4. enforce configuration/effectivity/operating prerequisites.

Three source schedules exist for:

- no thrust reversers;
- Aeronca;
- TR-4000.

These schedules are not interchangeable and must be selected only from explicit configuration.

Current safety boundary:

- Aeronca source-backed reduced-N1 evaluation exists;
- the documented 7.7 N1-point reduction boundary is not treated as equivalent to the independent 25% rated-thrust limitation;
- no validated N1-point-to-rated-thrust relationship exists;
- therefore operational enablement remains blocked and UI remains training/source-limited where that unresolved requirement matters;
- no-reverser and TR-4000 interpolation remain unavailable unless the source explicitly authorizes it;
- parenthesized/unresolved source cells remain fail-closed.

---

## 11. Weight & Balance

Weight & Balance must use the same universal-aircraft principle:

- aircraft-specific station/envelope/fuel data are governed content;
- runtime math is generic;
- units are declarative and must not assume Learjet lb/in conventions;
- source provenance and applicability remain explicit;
- unsupported envelopes/configurations fail closed.

Operational W&B must only be enabled when source-backed data are available for the aircraft/configuration.

---

## 12. UX and design system

The production shell is designed for cockpit/tablet use first while remaining usable on desktop and mobile.

Current UX principles:

- LEARN and EFB are explicit product modes;
- aircraft/configuration context remains visible without becoming a destination itself;
- EFB is optimized for low-friction operational access;
- fast-path CHECKLIST/QRH/PERF/REF remains persistent;
- cockpit-critical information uses compact hierarchy and strong scanability;
- touch targets and safe-area handling support iPad/mobile use;
- source/safety semantic states remain visually distinct from interaction accent;
- no fake analytics labels such as “frequent” unless real analytics support them;
- loading actions must expose disabled/busy feedback and prevent duplicate activation;
- missing governed content is shown as unavailable/fail-closed, not silently substituted.

The current shell/design system is shared across production routes rather than implemented as page-specific visual themes.

---

## 13. Mobile and PWA

Mobile support is part of the responsive web product, not a separate native application.

The PWA/offline boundary supports explicitly prepared operational EFB content, including the full-page Checklist workspace. Offline readiness must remain configuration-safe and source-safe.

Do not treat cached content as automatically current/authoritative merely because it is available offline.

---

## 14. Content Studio and administration

Administration is separate from learner UI.

Admin capabilities include:

- structured content builder workflows that create new immutable human drafts while server-side governance remains authoritative;
- aircraft/variant/configuration registration;
- source revision/reference registration;
- drafting/review;
- structured module creation;
- governed approval/publication;
- stale-content handling;
- package/readiness inspection;
- explicit production release actions where protected runtime credentials must remain server-side.

One-shot governed release operations must execute inside authenticated admin/server boundaries rather than exposing production database secrets locally.

---

## 15. Deployment and development workflow

### 15.1 Branching

`main` is the only long-lived branch.

Use short-lived:

- `feat/*`
- `fix/*`
- `chore/*`
- `docs/*`

Merged branch history belongs in Git/PRs rather than permanent version branches.

### 15.2 Verification

Baseline verification:

```bash
npm ci
npm run typecheck
npm test
npm run build
```

`npm run verify` runs the main TypeScript/unit/build gate.

For focused work, run targeted suites during development, then broaden only when risk/scope requires it.

Browser acceptance uses Playwright across desktop, mobile and iPad projects.

### 15.3 Database bootstrap

Training owns its PostgreSQL schema. A new database must be explicitly bootstrapped before first identity/content use.

```bash
TRAINING_DATABASE_URL='postgresql://...' npm run db:init
```

Ordinary runtime requests must never silently self-provision schema.

The destructive no-code PostgreSQL acceptance path uses `TRAINING_ACCEPTANCE_DATABASE_URL` and must point only to a disposable/preview PostgreSQL database, never production.

### 15.4 Production

Production deployment follows validated merge to `main` and serves `training.fly-tally.com`.

Required production environment includes the Training database/session/identity secrets and `TRAINING_CONTENT_BACKEND=postgres`.

The Logbook side of the identity handoff must expose `TRAINING_APP_URL=https://training.fly-tally.com` and the same `FLYTALLY_IDENTITY_SECRET` configured in Training.

Production release verification includes `GET /api/readiness`; the operational readiness profile controls whether this endpoint returns HTTP 200 or a fail-closed non-ready status.

A green application build is not sufficient by itself. Release acceptance includes production readiness/smoke appropriate to the change.

---

## 16. Security boundary

Current security invariants include:

- independent Training session secret;
- signed identity handoff rather than shared Logbook sessions;
- origin/fetch-metadata protection on state-changing browser requests;
- no-store/private caching on sensitive authenticated responses;
- global security headers including production HSTS, clickjacking protection, restrictive Permissions Policy and CSP;
- constrained public identifiers;
- admin role gating;
- production secrets remain server-side;
- public technical content accessibility does not establish source publication rights.

Do not treat in-memory serverless rate limiting as a durable security control.

---

## 17. Compliance and commercial boundary

Technical readiness and commercial/legal clearance are separate.

Training links to the canonical FlyTally legal centre rather than maintaining a competing legal truth source.

Current commercial launch remains blocked until the canonical FlyTally/Logbook external evidence and commercial-runtime gates are completed. A healthy Training `/api/readiness` response must not be interpreted as commercial, legal, regulator, trademark or source-rights clearance.

Current external/commercial gates include:

- formal operator/controller identification;
- jurisdiction-appropriate legal review;
- processor/DPA/international-transfer review;
- source copyright/licence/NDA/derivative-publication rights;
- regulator/manufacturer/operator claim validation;
- practical DSAR/incident/support processes;
- shared Logbook commercial entitlement/release decision.

The canonical v2.9 commercial-readiness contract lives in FlyTally Logbook, which remains the canonical legal and launch boundary. The canonical C4 assurance taxonomy and authority-validation state live in FlyTally Logbook as well; Training does not maintain parallel commercial, regulatory or signature-assurance truth sources.

Training must not claim EASA, ÚCL, LAA ČR, manufacturer or operator approval unless an actual approval and exact scope are recorded.

The governed technical workflow and source-authority workflow are distinct from publication-rights clearance: neither one proves copyright, NDA, licence or derivative-publication rights. Source-derived content must therefore not be treated as commercially publishable merely because it is technically published in Training.

QES is a reviewed strategy decision, not a presumed requirement. Existing account attestations, signature captures and server evidence must not be relabelled as advanced or qualified electronic signatures.

A manufacturer review of aircraft training content would not automatically make FlyTally an authority-approved training organisation or approved logbook. External validation evidence remains pending until the canonical cross-product evidence gate records it.

“Source-backed” means traceable to governed source material. Those descriptions do not mean manufacturer, operator or aviation-authority approval.

Training must not market a technically published aircraft package as manufacturer-approved, EASA/ÚCL/LAA-approved, official, fully compliant or otherwise externally endorsed merely because its source and human review gates passed.

Training must not add a registered-trademark claim or the `®` symbol unless the shared brand/claims evidence state later permits it.

---

## 18. Reference aircraft — Learjet 35A/36A

Learjet 35A/36A is the reference implementation, not a runtime exception.

Current reference capabilities include:

- governed source/configuration model;
- published operational checklist;
- Takeoff and Landing Performance;
- source-backed V-speeds/N1/distance datasets;
- source-backed wind correction where verified;
- Partial Power training/source-limited path;
- Flight Brief / Active Flight integration;
- fast-path architecture;
- systems/procedures/reference framework;
- production admin/governance path.

Current known source/configuration gaps remain tracked in `ROADMAP.md`, not hidden in this document.

---

## 19. Testing strategy

Testing is layered:

1. pure runtime/unit contracts;
2. content/schema/applicability/source tests;
3. source-text architecture guards where useful;
4. repository/database acceptance;
5. production build;
6. responsive Playwright acceptance;
7. production readiness/manual smoke where required.

Tests must not be weakened merely to force a green release. Safety, provenance, privacy and fail-closed assertions are product contracts.

Documentation assertions should reference this file when they are validating architectural/product contracts. Historical milestone filenames must not become permanent executable dependencies.

---

## 20. Documentation governance

The repository keeps only four maintained Markdown entry points:

- `README.md` — short repository entry point;
- `ROADMAP.md` — authoritative future direction/status;
- `CHANGELOG.md` — accepted/released history;
- `TECHNICAL_DOCUMENTATION.md` — this living technical/product reference.

Rules:

- update this document when architecture, governance, safety, data ownership, deployment or major UX contracts materially change;
- do not create a new milestone `.md` for routine implementation work;
- record implementation sequencing/status in `ROADMAP.md`;
- record accepted/released changes in `CHANGELOG.md`;
- use PR descriptions, Git history and tests as detailed historical evidence;
- if a future topic becomes large enough to justify a separate normative document, first record that decision in the roadmap rather than allowing documentation sprawl to return.

---

## 21. Consolidated historical-document map

The following former Markdown families were intentionally consolidated into this living document and removed from the active tree. Their original text remains available through Git history.

| Former document family | Consolidated here |
| --- | --- |
| `ARCHITECTURE.md`, `CONTENT_ARCHITECTURE.md`, `M9_*`, `V31_M1_*` | §§ 1–4 |
| `IDENTITY_CONTRACT.md`, `M7_*` | §§ 5–6 |
| `DEVELOPMENT.md`, `DEPLOYMENT.md`, `NO_CODE_ACCEPTANCE.md` | §§ 4, 15, 19 |
| `FEATURES.md`, `V1_RELEASE.md` | §§ 1, 2, 18 |
| `M32_*` through `M39_*`, `M46_*` through `M58_*` | §§ 8, 12–14, 18 |
| `P5_OPERATIONAL_FAST_PATH.md` | §§ 8–9 |
| `P7_REFERENCE_FAST_PATH.md` | § 9 |
| `B6_TAKEOFF_WIND_CORRECTION.md` | § 10.2 |
| `DECLARED_DISTANCES.md` | § 10.3 |
| `PARTIAL_POWER_TAKEOFF.md` | § 10.4 |
| `M41_WEIGHT_BALANCE.md` | § 11 |
| `UX0_*`, `UX5_*`, `UX6_*` | §§ 12–13 |
| `V31_M2_*` through `V31_M6_*` | §§ 2–4, 10–11, 14, 19 |
| `docs/compliance/*` | §§ 3, 5–6, 16–17 |
| Learjet checklist `SOURCE_INVENTORY.md` | §§ 3, 8, 18 |

For exact historical wording, acceptance counts or obsolete intermediate decisions, use the relevant Git commit/PR rather than expanding this living document with frozen milestone copies.

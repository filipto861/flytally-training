# Changelog

All notable changes to FlyTally Training are recorded here.

## Changelog governance

This file is the authoritative version history for completed FlyTally Training work.

- record material product, architecture, data/source, testing/governance and production changes here when they are accepted;
- reference the relevant PR/merge/deployment where practical;
- do not use chat history as the only record of a completed change;
- keep historical entries intact; correct factual mistakes explicitly rather than silently erasing project history;
- **ROADMAP.md defines where the project is going; CHANGELOG.md records what actually changed. Both must remain synchronized before a material work item is considered closed.**

## 2026-09-25

### Changed
- **PR #243 — QRH.3E generic serial/effectivity architecture**
  - extended the aircraft-agnostic configuration model with an exact manufacturer serial identifier and included it in the effective-configuration snapshot identity;
  - extended generic content applicability with exact serials, bounded/open-ended serial-number ranges, and nested `anyOf` alternatives so source effectivity such as serial-range OR installed modification can be represented directly;
  - preserved fail-closed behavior when serial, modification or equipment facts are missing/unknown, and extended publication validation/governance traversal to nested effectivity alternatives;
  - exposed serial identity through the existing Studio structured configuration surface without introducing Learjet-specific runtime or UI branches;
  - acceptance on head `975e4cb`: typecheck PASS; targeted configuration/applicability/governance/QRH suite 92/92 PASS; full Node suite 1265 total / 1264 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because cockpit/browser behavior did not change.

### Changed
- **PR #242 — QRH.3D Learjet ALL-aircraft mid-section Emergency batch**
  - staged the reviewed ALL-aircraft CL-102B Emergency Procedures from E-21 and E-25 through E-33, covering emergency descent, flight-control emergencies, fuel pressure, ditching/evacuation, both-engines-inoperative landing, stall warning and aborted takeoff;
  - preserved page-level provenance, nested source decision structure and visually reviewed boxed-memory boundaries without inferring memory status from labels or prose;
  - kept serial/AMK-specific BLEED AIR LIGHT and CABIN/COCKPIT FIRE source families explicitly fail-closed because the current generic aircraft configuration contract cannot prove their source serial ranges;
  - acceptance on head `2993d3e`: typecheck PASS; targeted QRH/P5/P6/W2 suite 76/76 PASS; full Node suite 1257 total / 1256 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because this PR changes staged source content, tests and roadmap only.

### Changed
- **PR #241 — QRH.3C Learjet airstart source batch**
  - staged the four CL-102B textual airstart procedures from E-14 through E-18 while preserving separate Fuel Computer ON/OFF starter-assist and windmilling paths, source sequencing, nested restart branches and page-level provenance;
  - preserved the source 20,000 ft Fuel Computer OFF restriction and reviewed E-14 through E-18 visually before leaving all memory-item flags unset;
  - kept E-13 AIRSTART ENVELOPE as an explicit blocking dependency because its graphical operating envelope cannot be flattened into text without loss; the entire batch remains outside operational publication/fallback paths until a generic source-faithful figure representation exists;
  - acceptance on head `98785d6`: typecheck PASS; targeted QRH/P5/P6/W2 suite 70/70 PASS; full Node suite 1251 total / 1250 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because this PR changes staged source content, tests and roadmap only.

### Changed
- **PR #240 — QRH.3B Learjet engine-fire and oil-pressure source batch**
  - staged source-backed CL-102B E-12 ENGINE FIRE — SHUTDOWN and E-19 OIL PRESSURE LIGHT(S) on the generic QRH v2 contract;
  - preserved explicit ALL-aircraft effectivity, nested source decision branches, and the exact boxed-memory boundary for the applicable E-12 branch without marking its alternate branch as memory;
  - extended the generic QRH condition-branch contract with optional explicit `memoryItem` semantics through validation, operational projection and presentation; no Learjet-specific runtime path was introduced;
  - kept the graphical E-13 AIRSTART ENVELOPE explicitly deferred/fail-closed rather than flattening chart geometry into text, and kept the partial batch outside production publication/fallback paths;
  - acceptance on head `ba2447a`: typecheck PASS; targeted QRH/P5/P6/W2 suite 64/64 PASS; full Node suite 1245 total / 1244 PASS / 0 FAIL / 1 SKIP; production build PASS; targeted Playwright QRH acceptance 8/8 PASS across desktop Chromium, mobile Chromium, iPad landscape and iPad portrait.

### Changed
- **PR #239 — QRH.3A first Learjet Emergency source batch**
  - staged the first source-backed CL-102B Emergency Procedures content in the generic QRH v2 contract: section guidance, DOOR LIGHT, AC INVERTER FAILURE — TOTAL, GENERATOR FAILURE (DUAL), and ENGINE FAILURE;
  - preserved page-level provenance, explicit ALL-aircraft effectivity, source conditional branches, and boxed ENGINE FAILURE memory items without introducing Learjet-specific runtime code;
  - extended the generic QRH step model with a first-class `information` step after real source content exposed numbered informational lines that are not crew actions; validation, search, operational projection, presentation and browser acceptance all carry the new step type;
  - kept the partial Learjet QRH batch staged and deliberately outside production publication/fallback paths;
  - acceptance on head `9809c04`: typecheck PASS; targeted QRH/P5/P6/W2 suite 58/58 PASS; full Node suite 1239 total / 1238 PASS / 0 FAIL / 1 SKIP; production build PASS; targeted Playwright QRH acceptance 8/8 PASS across desktop Chromium, mobile Chromium, iPad landscape and iPad portrait.

### Changed
- **PR #238 — QRH.2 source-faithful operational contract**
  - introduced abnormal/emergency schema v2 with explicit Emergency/Abnormal procedure class, explicit memory-item semantics, source-faithful nested conditions/branches, section introductions and explicit effectivity;
  - separated source-exact operational QRH data from optional Training overlays so operational publication no longer requires invented training setup, objectives, prompts or debrief prose;
  - preserved backward compatibility for legacy abnormal payloads while preventing conditional v2 procedures from being silently flattened into Training expected-response sequences;
  - updated operational projection, QRH presentation, structured authoring starter and aircraft search for the v2 contract; browser fixtures now exercise v2 semantics directly;
  - acceptance on head `59bc099`: typecheck PASS; targeted QRH/P5/P6 suite 43/43 PASS; full Node suite 1232 total / 1231 PASS / 0 FAIL / 1 SKIP; production build PASS; targeted Playwright QRH acceptance 8/8 PASS across desktop Chromium, mobile Chromium, iPad landscape and iPad portrait.

### Changed
- **PR #237 — QRH.1 source inventory and contract-gap audit**
  - inventoried the reviewed CL-102B Emergency and Abnormal sections, including index/category coverage and major page-effectivity families;
  - recorded AFM precedence, page-level effectivity and boxed memory-item semantics as non-publishable source evidence;
  - documented generic contract gaps blocking source-faithful QRH publication: Emergency-vs-Abnormal class, explicit memory semantics, conditional/substep structure, training-only required metadata and serial/AMK effectivity;
  - added focused regression coverage and moved Operational QRH into active implementation;
  - acceptance: typecheck PASS; QRH.1 focused suite 4/4 PASS; full Node suite 1224 total / 1223 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because runtime/UI behavior did not change.

### Changed
- **PR #236 — technical documentation consolidation**
  - consolidated the repository documentation surface to exactly four maintained Markdown files: `README.md`, `ROADMAP.md`, `CHANGELOG.md`, and `TECHNICAL_DOCUMENTATION.md`;
  - removed 68 superseded milestone, audit, specification, deployment and compliance Markdown files from the active tree while retaining their history in Git and pull requests;
  - moved current architecture, source governance, identity/SSO, persistence/privacy, Active Flight, checklist/fast-path, Performance/Partial Power, declared distances, W&B, UX/PWA, administration, deployment, security/compliance and Learjet reference-aircraft contracts into the living technical reference;
  - redirected documentation-dependent tests to the consolidated technical reference or executable contracts and added a regression guard preventing documentation sprawl from returning;
  - acceptance: typecheck PASS; full Node suite 1220 total / 1219 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because runtime/UI behavior did not change.


### Fixed
- **PR #234 — EFB checklist session synchronization**
  - main Flight Deck checklist, top checklist progress and CHECKLIST fast-path drawer now share one canonical EFB checklist session;
  - completed items and selected phase synchronize bidirectionally;
  - fast-path drawer adds phase reset, two-step reset-all, phase-complete markers and next-phase navigation;
  - fast-path CURRENT STEP now follows the selected phase;
  - EFB checklist persistence is scoped to the current Active Flight ID and stored locally on the device, with one-time migration from prior unscoped/legacy checklist state;
  - Learn checklist-training persistence remains separate;
  - focused acceptance: typecheck PASS, targeted suite 30/30 PASS, production build PASS; targeted Playwright smoke was not run because local port 3000 was occupied;
  - merged and deployed to production; manual synchronization smoke remains the final acceptance step.

### Changed
- **PR #230 — Learjet operational checklist rebuild**
  - digitized CL-102B Normal Procedures N-2 through N-18 into the universal checklist contract;
  - added source provenance, target-profile applicability and guarded governed publication tooling;
  - the reviewed CL-102B checklist package is now governed and published in production.
- **PR #231 — Learjet checklist publisher CJS runtime fix**
  - replaced unsupported top-level await with an explicit async entrypoint;
  - added a real-runtime regression test proving the publisher reaches its confirmation guard under the project Node/tsx execution mode.
- **PR #232 — Learjet checklist publisher local environment loading**
  - the explicit publisher now loads `.env.local` when present using Node 24 `--env-file-if-exists`;
  - keeps the confirmation guard intact and avoids requiring production database credentials to be copied manually into PowerShell;
  - targeted acceptance: typecheck PASS, publisher/checklist suite 10/10 PASS, production build PASS.
- **PR #233 — authenticated production-runtime Learjet checklist release flow**
  - moved the one-shot governed checklist publication into an authenticated Training-admin server action so protected production database credentials never need to be pulled or exposed locally;
  - CLI and admin publication share one governed release helper for CL-102B validation, source identity/fingerprint checks, source registration, idempotence, approval and publication;
  - added the explicit **Publish reviewed Learjet checklist** admin control with required confirmation;
  - targeted acceptance: typecheck PASS, checklist/admin suite 11/11 PASS, production build PASS;
  - authenticated production publication completed successfully.
- **PR #227 — Partial Power EFB simplification**
  - simplified the Learjet 35A Partial Power workflow to pilot-facing essentials;
  - exposed one explicit **Partial Power · Aeronca** mode;
  - reduced explanatory copy while keeping the visible **TRAINING · 25% LIMIT UNVERIFIED** source boundary.
- **PR #228 — Partial Power EFB hard simplification**
  - kept TORA directly editable for intersection departures;
  - removed mandatory duplicate ASDA entry from the primary workflow and added an optional ASDA override;
  - removed checklist-style Partial Power eligibility confirmations from the pilot UI;
  - made METAR application automatic by default, with periodic refresh and automatic recalculation of an existing result;
  - retained manual QNH/OAT overrides with a compact **AUTO METAR** reset.

### Fixed
- **PR #229 — EFB FLY route repair**
  - new-shell FLY no longer dead-ends when governed DB modules are sparse;
  - current bundled Learjet Takeoff/Landing performance is available in the Flight Deck;
  - CHECKLIST and QRH retain their existing source-authority/freshness gates;
  - the legacy flag-off FLY route keeps its historical strict behavior;
  - an explicit fail-closed Flight Deck empty state is shown when no operational module is available.
- Hardened Playwright local-server handling so tests do not silently reuse a server started with the wrong fixture or feature-flag environment.
- Updated stale B4/declared-distance/weather regression contracts after the EFB simplification.

### Documentation / roadmap
- Added **15.1 SimBrief Active Flight import + takeoff-weight prefill**.
- Added **15.2 Learjet climb + cruise Reference performance**.
- Completed the **15.3 EFB / FLY content-completeness audit**:
  - confirmed the dead-end FLY route;
  - confirmed missing Learjet governed data for CHECKLIST, QRH and REF;
  - confirmed current Takeoff/Landing PERF is populated through the bundled Learjet performance package;
  - added a production-content acceptance requirement so visually available but empty EFB slots cannot be treated as complete.

### Production
- PR #227 deployed successfully to `training.fly-tally.com`.
- PR #228 deployed successfully to `training.fly-tally.com`.
- **PR #229** deployed successfully to `training.fly-tally.com`; the Learjet 35A FLY route now returns HTTP 200 in the new EFB shell and production readiness remains healthy.
- **PR #230 + #233 — Learjet CHECKLIST live in production**: the reviewed CL-102B Normal Procedures package was published through the authenticated governed release flow; production FLY renders populated checklist phases and `/api/readiness` remains HTTP 200 / ready with source-governed release healthy.

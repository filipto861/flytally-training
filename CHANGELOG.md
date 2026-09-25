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

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

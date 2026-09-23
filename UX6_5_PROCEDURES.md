# UX6.5 — Procedures Redesign

**Status:** ACTIVE — IMPLEMENTATION READY FOR TECHNICAL/PREVIEW GATE  
**Depends on:** UX6.4 production shell  
**Branch:** `feat/ux6-5-procedures`

## Purpose

Convert the real Procedures workspace to the approved UX6 interaction model without changing ProcedureBrowser state, source governance, or execution runtimes.

## Implemented

### Desktop
- procedure search and phase filter integrated into the left navigator;
- compact navigator with active/completed state;
- selected procedure receives the dominant center workspace;
- `OPERATE` is presented before learning detail;
- source-defined relevance and authority context move to a secondary inspector;
- reset is visually secondary;
- previous/next navigation remains available.

### Mobile / narrow touch layout
- desktop index is removed from the initial flow;
- one compact procedure selector appears before task content;
- search/phase controls collapse behind a dedicated filter disclosure;
- procedure execution content follows immediately after the compact controls;
- no permanent desktop-style navigator is stacked above the task.

## Preserved contracts

- `ProcedureBrowser` remains the owner of selected procedure, filters, deep-link/hash state and persistence;
- `ProcedureLinearRunner` and `ProcedureGraphRunner` remain execution delegates;
- session storage and graph fingerprint reconciliation remain unchanged;
- source authority distinction remains unchanged;
- previous/next procedure semantics remain unchanged;
- no aircraft-specific rendering branch is introduced;
- legacy flag-off path is not rewritten.

## Acceptance

Required before UX6.5 can be marked complete:

- `tests/redesign-ux6-procedures.test.ts` green;
- P4 procedure contract tests green;
- full Node suite green;
- TypeScript green;
- build green;
- browser acceptance on desktop, mobile, iPad landscape and iPad portrait;
- light/dark visual check;
- no horizontal overflow;
- first actionable procedure content remains near the top of a 390 px viewport;
- procedure selection/filter controls do not dominate mobile vertical space.

## Next

After UX6.5 acceptance:

> **UX6.6 — Performance + Flight redesign**

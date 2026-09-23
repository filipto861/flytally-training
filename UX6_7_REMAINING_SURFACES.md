# UX6.7 — Remaining Surface Redesign

**Status:** ACTIVE — IMPLEMENTATION READY FOR TECHNICAL/PREVIEW GATE  
**Depends on:** UX6.6 Performance + Flight stack  
**Branch:** `feat/ux6-7-remaining-surfaces`

## Purpose

Bring the remaining product surfaces into the approved UX6 visual system so the application no longer changes character between Library, Aircraft, Training, Reference and Systems.

## Aircraft launch

- preserves the existing launch/state logic;
- Continue Training remains the primary state-driven action;
- Active Flight remains secondary but directly reachable;
- generic equal-weight cards are reduced in favor of task hierarchy;
- no fake “frequent” or invented analytics are introduced.

## Aircraft Library

- replaces the former website-like home surface with an application library;
- uses the same FlyTally mark, typography, blue interaction accent and surface hierarchy as the aircraft workspace;
- global marketing-style header/footer chrome is suppressed on this application entry surface;
- the whole aircraft row remains the open-workspace target;
- PWA install remains available without visually dominating aircraft selection;
- dark mode receives a peer surface system through system color preference.

## Training

- preserves the START HERE / STUDY / APPLY information model;
- Start Here receives stronger hierarchy than generic module lists;
- module rows remain lightweight;
- ScenarioTrainer remains the scenario/debrief runtime owner;
- Training stays visually related to the aircraft workspace without pretending to be an operational page.

## Reference

- full view becomes a reading/lookup workspace;
- section index remains adjacent on desktop and becomes horizontally accessible on touch layouts;
- numeric/reference values scan independently from long source detail;
- source notices and provenance remain explicit;
- source notes are progressively disclosed;
- fast-path reference continues to reuse the same governed presentation model.

## Systems

- real content keeps index + system workspace + schematic/detail behavior;
- unavailable content no longer exits to a generic not-found surface in the new shell;
- missing/unpublished Systems content renders a governed fail-closed state inside the standard aircraft workspace;
- the state explicitly says that nothing is inferred or substituted;
- legacy flag-off behavior remains unchanged.

## Preserved contracts

- aircraft launch state/progress ownership;
- Training scenario runtime;
- Reference presentation/source governance;
- Systems applicability filtering and source governance;
- no aircraft-specific rendering branches;
- current route ownership;
- W3 fast-path semantics.

## Acceptance

Before UX6.7 can be marked complete:

- dedicated UX6.7 contract tests green;
- P0/P3/P6/P7 contract tests green;
- full Node suite green;
- TypeScript green;
- Next build green;
- desktop/mobile/iPad browser acceptance;
- light/dark visual check;
- Library and aircraft workspace read as one product;
- Systems missing-content state remains fail closed but visually in-shell;
- no horizontal overflow.

## Next

After UX6.7 acceptance:

> **UX6.8 — Responsive specialization + accessibility hardening**

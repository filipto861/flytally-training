# UX6.3 — Reference Screens

**Status:** ACTIVE — REFERENCE SET READY FOR PRODUCT REVIEW  
**Depends on:** UX6.2 / PO Gate B approved

## Purpose

Validate the approved UX6 shell and design system across different page archetypes before production conversion.

## Implemented preview routes

- `/ux6-preview` — Procedures
- `/ux6-preview/performance` — Performance input/result workspace
- `/ux6-preview/flight` — Active Flight lifecycle/dashboard
- `/ux6-preview/library` — Aircraft Library
- `/ux6-preview/systems` — governed Systems unavailable state

All preview routes support `?theme=light` and `?theme=dark`.

## What this phase validates

- the design language works beyond Procedures;
- task-specific page layouts remain coherent inside one shell;
- result-heavy Performance can be denser without returning to generic cards;
- Flight reads as lifecycle/status workspace;
- Library belongs to the same product;
- fail-closed Systems content remains visually inside FlyTally;
- mobile breakpoints remain content-first.

## Not production code yet

These routes are visual reference surfaces only. They must not be wired into canonical aircraft routes until Gate C is accepted and UX6.4 begins.

## Gate C

Product owner should review the five reference surfaces in both themes and at least desktop + mobile widths.

Approval unlocks UX6.4 production shell implementation.

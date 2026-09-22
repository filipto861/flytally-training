# UX6.4 — Production Shell Implementation

**Status:** ACTIVE — SHELL CONVERSION IN PROGRESS  
**Depends on:** UX6.3 / PO Gate C approved  
**Branch:** `feat/ux6-4-production-shell`

## Purpose

Convert the approved UX6 shell architecture and visual language from isolated preview routes into the real aircraft workspace shell without changing P0–P7 domain behavior.

## Implemented in this slice

- persistent 72 px desktop navigation rail;
- icon-led five-destination top-level navigation;
- one-row aircraft context bar;
- real Active Flight lifecycle state retained in the top bar;
- UX6 light/dark semantic palette and geometry tokens;
- 1540 px workspace ceiling replacing the former narrow desktop content frame;
- operational fast path restyled as the approved compact shell dock;
- touch layouts retain the edge-attached bottom fast path;
- mobile/tablet drawer restyled to the UX6 visual system;
- Search trigger and fast-path panel brought into the same visual language;
- existing route ownership, source governance, fast-path semantics and state contracts retained.

## Explicitly not part of UX6.4

UX6.4 does not yet redesign the internals of:

- Procedures;
- Performance;
- Flight;
- Aircraft launch;
- Training;
- Reference;
- Systems.

Those page-level compositions remain owned by UX6.5–UX6.7.

The temporary mismatch between the new UX6 shell and legacy/UX5 page interiors is acceptable on this feature branch and must not be interpreted as final visual acceptance.

## Frozen contracts retained

Top-level IA:

```
AIRCRAFT
PROCEDURES
PERFORMANCE
TRAINING
FLIGHT
```

W3 fast path:

```
CHECKLIST
QRH
PERF
REF
```

Other preserved contracts:

- `FT_NEW_SHELL` fail-closed behavior;
- aircraft-agnostic shell implementation;
- current Active Flight lifecycle ownership;
- checklist session storage identity;
- governed content publication/applicability;
- search keyboard/focus behavior;
- fast-path keyboard shortcuts;
- responsive safe-area behavior.

## Technical acceptance

Before UX6.4 can be marked complete:

- targeted UX6.4/legacy shell contract tests green;
- full Node suite green;
- TypeScript green;
- Next build green;
- Playwright green on desktop, mobile, iPad landscape and iPad portrait;
- production-shell preview visually checked in light and dark;
- no horizontal overflow;
- drawer/search/fast-path focus behavior retained;
- no new aircraft-specific branch.

## Visual acceptance

UX6.4 shell acceptance checks:

- desktop no longer presents a text-heavy admin sidebar;
- aircraft identity and utility actions fit one calm context bar;
- shell chrome consumes materially less visual attention than page content;
- 1664 px desktop uses a substantially wider workspace;
- operational dock visually belongs to the shell;
- tablet/phone fast path remains reachable at the viewport edge;
- light and dark expose distinct canvas/workspace/panel hierarchy.

## Next phase

After UX6.4 technical + visual acceptance:

> **UX6.5 — Procedures redesign**

The shell should then remain stable while page-specific conversions proceed.

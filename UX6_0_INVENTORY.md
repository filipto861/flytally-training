# UX6.0 — Redesign Reset / Current UI Inventory

**Status:** COMPLETE ON BRANCH  
**Branch:** `feat/ux6-0-redesign-reset`  
**Purpose:** freeze behavior, identify the current presentation stack, and define what UX6 will replace.

## 1. Current shell implementation

The new shell is currently assembled by:

- `components/ft-shell/FtShell.tsx`
- `FtTopBar.tsx`
- `FtSideNav.tsx`
- `FtNavDrawer.tsx`
- `FtFastPathRail.tsx`
- `components/ft-shell/ft-shell.module.css`
- `components/ft-fast-path/*`
- `components/ft-search/*`

Current structural behavior:

```
FtShell
├─ FtTopBar
├─ workspace
│  ├─ FtSideNav
│  └─ page content
├─ FtFastPathRail
└─ FtFastPathPanel
```

The current CSS constrains direct page content to:

```css
.content > * {
  width: min(100%, calc(var(--ft-space-7) * 26));
}
```

This is one root cause of the under-filled desktop composition visible in the 1664 px UX5 screenshots.

The current desktop side navigation is a vertical text list. The current operational fast path is a centered sticky rounded dock. Both are presentation-level contracts and may be replaced in UX6 while preserving semantics and accessibility.

## 2. Canonical information architecture

Source: `lib/aircraft-content-ia.ts`.

Top-level destinations:

| Key | Label | Canonical route |
|---|---|---|
| aircraft | AIRCRAFT | `/aircraft/[id]` |
| procedures | PROCEDURES | `/aircraft/[id]/procedures` |
| performance | PERFORMANCE | `/aircraft/[id]/performance` |
| training | TRAINING | `/aircraft/[id]/training` |
| flight | FLIGHT | `/aircraft/[id]/flight` |

Important secondary destinations:

- AIRCRAFT → Systems, Knowledge, Avionics, Limitations, Flows
- PROCEDURES → Abnormal & Emergency, Checklists
- PERFORMANCE → Weight & Balance
- TRAINING → Quick Start, Orientation, Cold & Dark, Progress
- FLIGHT → Flight Brief, Quick Reference, Reference

**UX6 does not create Systems or Reference as new top-level destinations without an explicit IA decision.**

## 3. W3 fast path

Source: `components/ft-shell/navigation.ts`.

Frozen semantics:

```
CHECKLIST
QRH
PERF
REF
```

Current UI: a sticky centered desktop rail; edge-attached bottom rail on touch layouts.

UX6 may replace the visual placement/treatment, but not the four-slot semantics.

## 4. Core new-shell page implementations

| Surface | Page entry | Primary presentation components | Current visual issue |
|---|---|---|---|
| Aircraft launch | `app/aircraft/[id]/page.tsx` | `components/ft-launch/*` | generic sections/cards, weak workspace use |
| Procedures | `/procedures/page.tsx` | `ProcedureBrowser`, `components/ft-procedures/*` | dense control stack, narrow main pane, mobile vertical overhead |
| Performance | `/performance/page.tsx` | `FtPerformancePage`, `FtPerformancePresentation` | document/card composition instead of tool/input-result workspace |
| Flight | `/flight/page.tsx` | `FtFlightPage`, `FtActiveFlight`, `FtFlightBrief`, `FtRecentFlights` | stacked equal-weight sections instead of lifecycle dashboard |
| Reference | `/reference/page.tsx` | `FtReferencePage`, `FtReferencePresentation` | sparse card/list surface rather than reading workspace |
| Systems | `/systems/page.tsx` | `FtSystemsPage`, schematic/detail components | real content layout unverified in prod; fail-closed falls outside shell visual language |
| Training | `/training/page.tsx` | `FtTrainingPage`, `ScenarioTrainer` | generic card grid, limited learning hierarchy |
| Library | `app/page.tsx` | global CSS classes + `PwaInstallCard` | visually disconnected from aircraft workspace |

## 5. CSS/design-system stack affected

Primary UX6 presentation files:

- `app/ft-workspace/tokens.css`
- `app/ft-workspace/theme.css`
- `app/globals.css`
- `components/ft-shell/ft-shell.module.css`
- `components/ft-launch/ft-launch.module.css`
- `components/ft-procedures/ft-procedures.module.css`
- `components/ft-performance/ft-performance.module.css`
- `components/ft-flight/ft-flight.module.css`
- `components/ft-reference/ft-reference.module.css`
- `components/ft-training/ft-training.module.css`
- `components/ft-systems/ft-systems.module.css`
- `components/ft-search/ft-search.module.css`
- `components/ft-fast-path/ft-fast-path.module.css`

Legacy styles remain out of scope unless a new-shell surface still depends on them.

## 6. Preserve / replace matrix

### Preserve behavior

- server-side content loading in `FtShell`;
- selected variant/configuration filtering;
- governed checklist/performance/abnormal/limitations content;
- Active Flight lookup;
- search behavior and keyboard contract;
- fast-path panel behavior;
- checklist session storage;
- current route destinations;
- accessibility semantics already proven by tests.

### Replace presentation

- top-bar composition;
- side-nav visuals;
- drawer visuals;
- desktop content width constraint;
- fast-path rail visuals/placement;
- page-level card/panel composition;
- typography scale;
- responsive page layouts;
- library visual language;
- unavailable/empty-state presentation.

## 7. Existing baseline to protect

UX5 correction release evidence:

- TypeScript PASS
- Node: 968 total / 967 pass / 0 fail / 1 skip
- Build: PASS
- Playwright: 340 / 340
- Four Playwright projects:
  - desktop-chromium
  - mobile-chromium
  - ipad-landscape
  - ipad-portrait
- Final UX5 capture:
  - 8 surfaces
  - 4 viewport classes
  - 2 themes
  - 64 screenshots
  - all navigations HTTP 200

The baseline is a regression contract for behavior, **not** a visual target.

## 8. UX6 screenshot acceptance matrix

Reference/final surfaces:

1. Library
2. Aircraft launch
3. Procedures
4. Performance
5. Training
6. Reference
7. Flight
8. Systems

Viewport classes:

- Desktop 1664 × 930
- iPad landscape 1112 × 834
- iPad portrait 834 × 1112
- Mobile 390 × 844

Themes:

- light
- dark

Final minimum matrix remains 64 screenshots.

During UX6.1–UX6.3 we intentionally use a smaller reference subset before broad implementation.

## 9. UX6.0 decision

```
UX5 visual approval: REJECTED
Current shell:        DEVELOPMENT SCAFFOLD
Functional P0–P7:     PRESERVE
C0:                    HOLD
Next:                  UX6.1 shell + IA wireframes
```

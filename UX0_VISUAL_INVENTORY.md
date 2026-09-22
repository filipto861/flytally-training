# UX0 — Full-Shell Visual Inventory

**Phase:** UX0  
**Status:** active inventory / visual integration baseline  
**Branch:** `feat/redesign-ux0-visual-inventory`  
**Date:** 2026-09-22

## 1. Purpose

P0–P7 are functionally complete. The new shell is now treated as a **functional
development scaffold**, not as a visually complete product.

UX0 records the visual problems before presentation code is changed. The goal is
to prevent page-by-page cosmetic patches and instead establish one coherent
visual system for the complete aircraft workspace.

## 2. Frozen product contracts

UX0–UX5 do **not** redesign the product architecture.

These contracts remain frozen:

- top-level IA: `AIRCRAFT / PROCEDURES / PERFORMANCE / TRAINING / FLIGHT`
- operational fast path: `CHECKLIST / QRH / PERF / REF`
- aircraft-agnostic content/runtime contracts
- source governance and provenance
- checklist/procedure/scenario session ownership
- D0 Active Flight lifecycle
- performance calculation/runtime semantics
- feature-flag compatibility until C4b

Presentation may change substantially around those contracts.

## 3. Live desktop review — 2026-09-22

The owner reviewed the new shell live in production after the global development
preview flip.

### Overall assessment

The shell reads as a **technical wireframe** rather than a finished EFB/product
workspace. The functional hierarchy exists, but visual hierarchy, density,
proportion and emphasis do not communicate that hierarchy clearly.

### UX0-D01 — content has no intentional desktop frame

**Observed:** the main workspace expands across the available viewport and large
areas remain visually empty.

**Code evidence:** `.content` has only `min-width: 0`; there is no content
max-width, horizontal inset, centering contract, or page frame at shell level.
The launch surface is `width: 100%`.

**Effect:** at desktop widths the content feels lost inside the viewport rather
than intentionally composed.

**UX owner:** UX1.

### UX0-D02 — shell chrome and page content have incompatible density

**Observed:** top bar, side navigation and bottom fast-path rail are very thin
and utilitarian while page sections use much larger whitespace.

**Code evidence:** top bar uses 12/16 px padding, side-nav links use the 44 px
minimum target, and the fast-path rail is 44 px high. The launch surface then
uses 32 px outer padding and 32–48 px section gaps without a common content
frame.

**Effect:** chrome looks like scaffolding around a separate document instead of
one application.

**UX owner:** UX1 + UX2.

### UX0-D03 — top aircraft bar is metadata-heavy and visually flat

**Observed:** aircraft identity, training profile, search, checklist indicator
and `ACTIVE FLIGHT · NONE` compete in a single shallow row.

**Effect:** no clear primary/secondary hierarchy. Aircraft identity does not feel
like the stable workspace context.

**UX owner:** UX1.

### UX0-D04 — side navigation is mechanically correct but visually detached

**Observed:** the desktop rail is a fixed 240 px column
(`48 px × 5`) with text-only links and a 2 px active rule.

**Effect:** it consumes permanent width without providing enough visual
structure or context to justify that width.

**UX owner:** UX1.

### UX0-D05 — launch surface lacks product-level grouping

**Observed:** `Continue Training`, `Flight`, and `Recent` are structurally
correct but are presented mainly as rules + text.

**Effect:** primary action and secondary modules do not read quickly at a glance;
the page resembles a specification sheet.

**UX owner:** UX2 + UX3.

### UX0-D06 — fast-path rail is over-prominent on desktop

**Observed:** four equal-width buttons span the entire viewport bottom edge.

**Effect:** the rail visually competes with the main workspace despite being a
secondary quick-access mechanism.

**UX owner:** UX1.

### UX0-D07 — visual vocabulary is intentionally too austere for final use

The new shell currently relies heavily on:

- 1 px rules
- 0/2/4 px radius policy
- near-flat white/grey surfaces
- metadata/data font treatment
- limited action emphasis

This was acceptable for functional scaffolding, but it does not provide enough
depth or grouping for the completed P0–P7 feature set.

**UX owner:** UX2.

### UX0-D08 — component-level visual systems are inconsistent

P0–P7 were implemented independently. Some newer modules use cards/panels while
the shell and launch surface remain rule-driven. Legacy/global surfaces also
carry a separate visual language.

**Effect:** moving between Procedures, Performance, Training, Reference and
Flight does not yet feel like one product.

**UX owner:** UX3.

## 4. Required viewport audit matrix

UX0 visual decisions are not complete until the shell is reviewed at all four
acceptance classes already represented by Playwright:

| Class | Required review |
|---|---|
| Desktop Chromium | shell proportions, max-width, navigation, fast path, dense/wide states |
| iPad landscape | drawer vs desktop navigation, content width, fast path, split layouts |
| iPad portrait | header wrapping, drawer, fast path, card stacking |
| Narrow mobile | touch hierarchy, sticky regions, one-column flow, safe areas |

The live desktop review is complete. iPad/mobile reviews remain part of UX0/UX4
acceptance and must be validated against screenshots before UX5 is signed off.

## 5. Target visual principles

The redesign should produce:

1. **Application, not webpage** — shell chrome and content share one spatial system.
2. **Intentional density** — compact aviation/EFB information without tiny text.
3. **One obvious primary action** per page/section.
4. **Strong grouping, low decoration** — panels should clarify hierarchy, not add ornament.
5. **Operational hierarchy** — persistent context first, task second, source metadata third.
6. **Progressive disclosure** — provenance and secondary controls remain available without dominating.
7. **Responsive equivalence** — mobile/iPad preserve task priority instead of merely stacking desktop.
8. **No fake authority cues** — visual emphasis must not imply source validity, recency or safety state that the data does not provide.

## 6. UX1 target — shell composition

UX1 should address the shell before individual pages:

- introduce an intentional desktop content frame/max-width
- recalibrate sidebar width and active state
- redesign aircraft context/top bar hierarchy
- reduce desktop fast-path dominance while preserving one-click access
- establish shared shell/page gutters
- define desktop, iPad-landscape, iPad-portrait and mobile shell behavior
- preserve keyboard/focus/touch contracts

UX1 must not redesign P0–P7 page internals beyond the minimum needed to fit the
new shell frame.

## 7. UX2 target — hierarchy and design language

After UX1:

- typography scale and line-height
- spacing rhythm
- surface/card/panel hierarchy
- primary/secondary/tertiary actions
- empty/loading/error states
- metadata/provenance hierarchy
- source-warning/caution/note treatment without semantic drift

## 8. UX3 target — cross-page harmonization

Apply the UX1/UX2 language consistently across:

- Aircraft launch
- Procedures
- Performance
- Systems
- Training
- Flight
- Reference
- CHECKLIST / QRH / PERF / REF fast path

## 9. UX4 / UX5 acceptance

UX4 closes responsive and accessibility behavior. UX5 performs final screenshot
review, performance budget, accessibility sign-off and explicit product-owner
visual approval.

No component becomes visually frozen merely because its functional P-slice is
green.

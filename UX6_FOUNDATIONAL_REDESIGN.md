# UX6 — Foundational UI/UX Redesign

**Status:** ACTIVE DESIGN PHASE — NOT IMPLEMENTED  
**Product owner:** Filip Točík  
**Decision date:** 2026-09-22  
**Authoritative tracking:** GitHub issue #190  
**Current branch:** `feat/ux6-0-redesign-reset`

## Resume checkpoint

The UX5 screenshot matrix proved that the current shell is functionally coherent and responsive, but the product owner rejected the visual design as final.

The current production shell is therefore a **functional development scaffold**, not the target UI.

```
UX0–UX4  technically complete
UX5      VISUAL APPROVAL REJECTED
UX6      ACTIVE
C0       HOLD
```

**Next sequence:** UX6.0 → UX6.1 → PO Gate A.

Do not continue cosmetic polishing of the existing shell and do not start C0.

---

## 1. Product goal

FlyTally Training should read as a professional **pilot workspace / EFB training environment** rather than a website, generic admin panel or collection of cards.

The redesign must make the product:

- immediately scannable;
- calm under information density;
- purpose-built for aviation training/operational reference;
- efficient on desktop, iPad and phone;
- visually coherent in light and dark;
- source-aware without forcing technical provenance into the primary visual hierarchy.

---

## 2. Functional contracts that remain authoritative

UX6 replaces presentation, not proven domain behavior.

Preserve unless a separately approved functional change is required:

- P0–P7 route ownership and functional behavior;
- source governance and publication rules;
- fail-closed behavior;
- Active Flight state/lifecycle ownership;
- performance runtime/calculation behavior;
- checklist session contract and migration behavior;
- scenario/debrief domain behavior;
- Reference source-governance contract;
- W3 fast-path semantics: `CHECKLIST / QRH / PERF / REF`;
- generic aircraft-agnostic runtime contracts.

### Frozen top-level IA

The current canonical top-level aircraft workspace IA remains:

1. `AIRCRAFT`
2. `PROCEDURES`
3. `PERFORMANCE`
4. `TRAINING`
5. `FLIGHT`

`Systems` remains a sub-destination of AIRCRAFT.  
`Reference` remains a sub-destination of FLIGHT.

UX6 may completely redesign how these destinations are presented, but it must not silently create a new top-level information architecture.

---

## 3. Presentation that may be replaced completely

UX6 may redesign:

- shell geometry;
- primary navigation representation;
- aircraft context bar;
- page header model;
- workspace width and grid;
- fast-path placement/treatment;
- typography;
- spacing;
- panels and surfaces;
- responsive composition;
- mobile navigation;
- iPad interaction model;
- search UI;
- empty/loading/error states;
- interaction density;
- page-specific composition.

**Rule:** preserve semantics; redesign the experience.

---

## 4. Design principles

1. **Content before chrome.**
2. **Scan before read.**
3. **One obvious primary action per decision area.**
4. **Desktop is a workspace, not a centered article.**
5. **Mobile and iPad are task-specific layouts, not collapsed desktop.**
6. **Few surface levels; avoid card-inside-card patterns.**
7. **Provenance is quiet but always available.**
8. **Fail-closed states remain inside the product visual language.**
9. **Light and dark receive equal design attention.**
10. **No decorative aviation/HUD styling without function.**
11. **No arbitrary time-based freshness authority.**
12. **Accessibility is part of the component architecture.**

---

## 5. Target shell

### Desktop

- compact primary navigation rail or compact sidebar;
- one aircraft context bar, approximately 60–72 px high;
- fluid 12-column workspace;
- practical content ceiling around 1500–1600 px, with task-specific exceptions;
- optional inspector/context pane only where adjacency adds value;
- no narrow 1040 px strip floating inside a 1664 px viewport;
- fast path integrated into shell/context instead of a detached floating pill.

### iPad landscape

- compact rail;
- main + optional secondary pane;
- inspector becomes drawer where required;
- all primary touch targets >= 44 px.

### iPad portrait

- drawer/compact rail rather than permanent wide navigation;
- one primary workspace pane;
- sheets/drawers for secondary context.

### Mobile

- one compact top bar;
- persistent operational fast path at bottom;
- secondary navigation via drawer or bottom sheet;
- minimal chrome before task content;
- procedure/phase selection via sheet rather than permanent stacked controls.

---

## 6. Visual language

### Typography targets

- page title: 28–32 px desktop, 24–28 px mobile;
- section title: 20–24 px;
- panel title: 16–18 px;
- body: 14–16 px;
- metadata: 12–13 px and never used for primary task content;
- tabular numerals for performance/time data.

### Spacing scale

`4 / 8 / 12 / 16 / 24 / 32 / 48`

### Surface rules

- fewer borders;
- spacing and surface contrast before shadow;
- ordinary panel radius ~8–12 px;
- pills reserved for actual pill/status semantics;
- light/dark themes must expose distinct app canvas / workspace / panel / elevated layers.

---

## 7. Flagship page directions

### Procedures

Desktop:
- procedure navigation on the left;
- checklist/procedure content in the dominant center pane;
- optional context/provenance/related information on the right;
- progress visible but subordinate;
- reset is secondary/destructive;
- search does not push the actual procedure far below the fold.

Mobile:
- procedure content appears immediately;
- phase/procedure selection in a bottom sheet;
- search compact;
- no permanent selector stack above every checklist.

### Performance

Desktop:
- input pane + dominant result pane;
- result values large and scannable;
- technical context/provenance collapsible;
- active-flight dependency explicit;
- field-level validation.

Mobile:
- staged input → calculate → result flow;
- key result first;
- sources/assumptions behind disclosure.

### Flight

Desktop:
- active-flight state and route summary first;
- lifecycle/action hierarchy explicit;
- performance dependency and flight brief grouped by function;
- no nested equal-weight cards for every data fragment.

Mobile:
- Start/Resume Flight is the obvious first action;
- secondary brief/context progressively disclosed.

### Aircraft / Launch

- answer “what should I do next?”;
- Continue Training / Resume / Active Flight can dominate when real state exists;
- module destinations visually differentiated by purpose, not identical cards.

### Reference

- reading workspace;
- category/navigation pane + content pane;
- search-first on mobile.

### Systems

- index + system canvas/detail when content exists;
- unavailable state remains inside standard shell and explains the governed content gap.

### Training

- learning-oriented hierarchy: continue, modules, scenarios, progress;
- still visually part of the same product.

### Aircraft Library

- same product language as aircraft workspace;
- decisive open/resume interaction;
- no generic website footer feeling.

---

## 8. UX6 roadmap

| Phase | Scope | Gate |
|---|---|---|
| UX6.0 | Redesign reset, contract freeze, repo inventory, baseline | none |
| UX6.1 | Shell + information architecture wireframes for desktop/iPad/mobile | **PO Gate A** |
| UX6.2 | Design system + primitives, light/dark | **PO Gate B** |
| UX6.3 | Reference screens: Procedures, Performance, Flight, Library, Mobile Procedures/Performance, iPad Procedures, Systems unavailable | **PO Gate C** |
| UX6.4 | Shell implementation | technical gate |
| UX6.5 | Procedures implementation | visual + technical |
| UX6.6 | Performance + Flight | visual + technical |
| UX6.7 | Aircraft/Library + Training + Reference + Systems | visual + technical |
| UX6.8 | Responsive specialization + a11y hardening | accessibility gate |
| UX6.9 | Final 64-screen matrix + performance + owner approval | **FINAL PO APPROVAL** |

C0 resumes only after UX6.9.

---

## 9. Acceptance principles

UX6 is not complete because tests are green. It is complete only when:

- desktop visibly uses the workspace intentionally;
- primary content dominates shell chrome;
- typography is comfortably readable;
- the admin/sidebar feeling is gone;
- fast path feels native to the application;
- cards are selective, not universal;
- light mode has hierarchy and depth;
- dark mode has distinct surfaces;
- Library and workspace look like one product;
- mobile exposes primary task content sooner;
- Procedures, Performance and Flight each have purpose-built layouts;
- supported viewport classes have no horizontal overflow or broken composition;
- screenshots are explicitly approved by the product owner.

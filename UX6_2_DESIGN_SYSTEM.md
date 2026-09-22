# UX6.2 — Design System + Primitives

**Status:** ACTIVE — DESIGN-SYSTEM SPECIMEN READY FOR GATE B REVIEW  
**Depends on:** UX6.1 / PO Gate A approved  
**Scope:** visual language and reusable UI primitives only; no production shell conversion yet.

## 1. Direction

The design language is a restrained pilot-workspace UI:

- neutral technical surfaces;
- one clear FlyTally blue interaction accent;
- high-legibility typography;
- strong selected/active states without excessive borders;
- data values use tabular numerals;
- semantic warning/caution/note colors remain source-driven;
- no decorative gauges, gradients or HUD effects.

The goal is not to look “aviation themed”. The goal is to feel like a professional tool used in aviation.

---

## 2. Typography

Primary UI family remains the existing IBM Plex Sans stack. Data remains IBM Plex Mono only where alignment/scanning benefits.

| Role | Desktop | Mobile | Weight | Usage |
|---|---:|---:|---:|---|
| Display | 32 px / 38 | 28 / 34 | 650 | rare launch/empty hero |
| Page title | 28 / 34 | 24 / 30 | 650 | workspace title |
| Section title | 20 / 26 | 19 / 25 | 650 | major section |
| Panel title | 16 / 22 | 16 / 22 | 650 | panel/list title |
| Body | 15 / 22 | 15 / 22 | 400 | primary reading |
| Label | 13 / 18 | 13 / 18 | 600 | inputs/navigation |
| Metadata | 12 / 17 | 12 / 17 | 450 | provenance/state |
| Data large | 30 / 34 | 28 / 32 | 650 | key performance values |

Rules:

- uppercase is reserved for compact eyebrow/status labels;
- long navigation labels use normal title case;
- never use 11 px text for primary or actionable information;
- numeric performance results use `font-variant-numeric: tabular-nums`.

---

## 3. Spacing

Canonical scale:

```
4  8  12  16  24  32  48  64
```

Usage:

- control internal gap: 8–12;
- row gap: 8–12;
- panel padding: 16 mobile / 20–24 desktop;
- major section separation: 32–48;
- shell gutter: 20 mobile / 24 iPad / 32 desktop.

Avoid arbitrary 18/22/27 px values unless required by geometry.

---

## 4. Geometry

- shell rail: 72 px desktop;
- aircraft context bar: 64 px desktop;
- touch target minimum: 44 px;
- regular control height: 40 px desktop, 44 px touch;
- primary button height: 44 px desktop/touch;
- panel radius: 10 px;
- input/button radius: 8 px;
- status badge radius: 999 px only for true status/tag semantics;
- overlay/drawer radius: 14 px where detached from viewport edge.

---

## 5. Color roles

Concrete values are initial UX6 candidates and must be reviewed visually in both themes.

### Light

```css
--ux6-canvas:           #F4F6F8;
--ux6-workspace:        #FFFFFF;
--ux6-panel:            #F8FAFC;
--ux6-elevated:         #FFFFFF;
--ux6-selected:         #EAF1FF;
--ux6-hover:            #F0F4F8;

--ux6-border:           #D9E0E7;
--ux6-border-strong:    #B8C3CF;

--ux6-text:             #111827;
--ux6-text-secondary:   #4B5563;
--ux6-text-muted:       #6B7280;
--ux6-text-disabled:    #9CA3AF;

--ux6-accent:           #2F6BFF;
--ux6-accent-hover:     #2457D6;
--ux6-accent-soft:      #EAF1FF;
--ux6-focus:            #2F6BFF;
```

### Dark

```css
--ux6-canvas:           #0B1118;
--ux6-workspace:        #101821;
--ux6-panel:            #16212D;
--ux6-elevated:         #1B2836;
--ux6-selected:         #172A4F;
--ux6-hover:            #1A2633;

--ux6-border:           #263647;
--ux6-border-strong:    #3A4C60;

--ux6-text:             #F3F6FA;
--ux6-text-secondary:   #B6C0CC;
--ux6-text-muted:       #8997A6;
--ux6-text-disabled:    #5F6B78;

--ux6-accent:           #5B8CFF;
--ux6-accent-hover:     #79A3FF;
--ux6-accent-soft:      #172A4F;
--ux6-focus:            #79A3FF;
```

### Application state

Application state is separate from source-safety semantics:

- active/info: blue;
- success/completed: green;
- attention/recalculate: amber;
- error/invalid: red;
- previous/archived: neutral.

### Source semantics

Existing source `WARNING / CAUTION / NOTE` roles remain distinct from application state and must not be recolored merely to match brand accent.

Source age remains neutral metadata unless an explicit policy elevates it.

---

## 6. Elevation and borders

The rejected UX5 design over-relied on borders.

UX6 hierarchy:

1. canvas vs workspace by surface color;
2. workspace vs panel by subtle contrast;
3. selected/interactive state by accent-soft fill + indicator;
4. border only where boundaries would otherwise be ambiguous;
5. shadow only for true overlays / raised floating UI.

No universal card border.

---

## 7. Navigation primitive

### Desktop rail item

- 48×48 interactive area centered inside 72 px rail;
- 20 px line icon;
- active state:
  - soft accent background;
  - accent icon;
  - 3 px left indicator;
- inactive icon uses secondary text color;
- tooltip or expanded contextual label reveals the full destination name;
- selection is distinguishable without color alone.

### Mobile bottom action

- minimum 56 px high including safe-area treatment;
- icon + 11–12 px label only for the four operational fast-path actions;
- active panel action gets accent indicator/fill;
- no five-plus-item text-heavy global nav at the bottom.

---

## 8. Buttons

### Primary

- accent fill;
- white text where contrast passes;
- 44 px high;
- 8 px radius;
- used once per local decision area.

### Secondary

- panel/elevated surface;
- strong border or neutral fill;
- primary text.

### Quiet / tertiary

- transparent;
- text + optional icon;
- hover fill only.

### Destructive

- neutral by default if low-risk reset;
- explicit red only when irreversible/destructive;
- never visually outranks the forward task action.

---

## 9. Inputs

- visible label above control;
- help text below only when necessary;
- field error is adjacent;
- selected/focus state uses accent ring, not a global box shadow;
- numeric fields align units consistently;
- no placeholder used as the only label.

---

## 10. Panels

Use panels for meaningful grouping, not every block.

Panel types:

- **Workspace pane** — structural column, often borderless.
- **Section panel** — grouped information with light surface differentiation.
- **Result panel** — high information priority; may use stronger surface.
- **Inspector** — contextual right-side pane.
- **Callout** — semantic note/warning/caution.
- **Empty state** — purpose-specific message + one relevant next action.

Do not nest section panels inside cards inside another card unless the nesting reflects a true hierarchy.

---

## 11. Data/result presentation

Performance and operational data:

- key value large;
- unit visually subordinate but adjacent;
- label above/beside based on density;
- tabular numerals;
- comparison/delta only when source/runtime provides it;
- no inferred green/red “good/bad” score.

Example:

```
V1
121 kt
```

rather than a generic bordered metric card for every number.

---

## 12. Empty/loading/error states

Dedicated families:

- **No state yet** — e.g. no Active Flight;
- **No published content** — governed content gap;
- **Filtered empty** — user filter/search;
- **Recoverable error** — retry available;
- **Hard unavailable** — fail closed;
- **Loading** — skeleton aligned to the final layout.

The current generic bordered message card is not the target pattern.

---

## 13. Focus and accessibility

- focus ring: 2 px accent with 2 px offset where geometry permits;
- icon-only controls require accessible names;
- active state never relies only on color;
- drawers/sheets trap focus and restore trigger focus;
- minimum touch target 44×44;
- text and UI contrast must meet WCAG AA;
- reduced motion removes nonessential transitions;
- forced-colors retains selected/focus boundaries.

---

## 14. Motion

Motion is subtle and functional:

- 120–180 ms for hover/selection;
- 180–240 ms for drawer/sheet;
- no parallax;
- no springy decorative motion;
- honor `prefers-reduced-motion`.

---

## 15. Design-system specimen

A branch-only visual specimen is provided at:

`/ux6-preview`

It is intentionally isolated from production aircraft routes and demonstrates:

- desktop navigation rail;
- aircraft context bar;
- procedure navigator;
- procedure content hierarchy;
- inspector;
- integrated quick-action dock;
- buttons/inputs/status;
- light/dark candidate palette;
- responsive mobile collapse.

It is not production functionality and may be deleted or rewritten before UX6.4.

---

## 16. Gate B

Product-owner approval should answer:

1. Does the visual density feel professional and readable?
2. Is the blue accent strong enough without becoming decorative?
3. Are light and dark surfaces sufficiently separated?
4. Does the navigation feel like an application rather than an admin sidebar?
5. Do controls/panels feel restrained enough?
6. Should this visual language proceed into the UX6.3 reference screens?

Gate B approval unlocks UX6.3.

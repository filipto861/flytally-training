# UX6.8 — Responsive Specialization + Accessibility Hardening

**Status:** ACTIVE — IMPLEMENTATION / BROWSER GATE  
**Depends on:** UX6.7 remaining-surface stack  
**Branch:** `feat/ux6-8-responsive-a11y`

## Purpose

Harden the approved UX6 product across desktop, iPad landscape, iPad portrait and narrow mobile without reverting to a “desktop stacked vertically” model.

## Implemented

### Shell accessibility
- compact desktop rail keeps short visible labels but exposes the full canonical destination name to assistive technology;
- aircraft profile remains visually subordinate while exposing an explicit accessible “Training profile” label;
- drawer/search/fast-path dialog focus ownership remains unchanged.

### Procedures specialization
- touch devices use the compact procedure control path regardless of raw CSS width;
- iPad portrait/landscape no longer have to carry the permanent desktop procedure navigator;
- first procedure task content receives materially more horizontal space on touch layouts;
- selected procedure/filter controls remain compact before the operational content;
- forward navigation uses the semantic accent-contrast token rather than a hard-coded text color.

### Browser acceptance expansion
- horizontal-overflow gate now includes Flight and Systems;
- all five rail destinations are checked by full accessible names;
- touch Procedures must expose the compact selector path;
- primary shell touch controls must meet the 44 px boundary.

## Accessibility contracts retained

- keyboard-only shell navigation;
- visible focus;
- Escape close + focus return for drawer, search and fast path;
- dialog focus containment;
- safe-area handling;
- reduced-motion handling;
- forced-colors selected/focus boundaries;
- source WARNING / CAUTION / NOTE semantics remain distinct from application state.

## Acceptance

Before UX6.8 can be marked complete:

- UX6.8 Node guards green;
- full Node suite green;
- TypeScript green;
- Next build green;
- all four Playwright projects green;
- desktop rail accessible names verified;
- iPad landscape/portrait use touch-specialized controls;
- narrow mobile has no horizontal overflow;
- 44 px primary touch-control boundary passes;
- light/dark focus visibility spot-check passes;
- VoiceOver or NVDA manual screen-reader pass is recorded before final C4b release.

## Next

After UX6.8 acceptance:

> **UX6.9 — Final visual acceptance matrix + product-owner approval**

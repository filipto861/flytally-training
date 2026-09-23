# UX6.9 — Final Visual Acceptance

**Status:** PREPARED — WAITING FOR UX6.8 BROWSER GATE + FINAL DEPLOYMENT  
**Depends on:** UX6.8 responsive/a11y acceptance  
**Product-owner approval is mandatory.**

## Purpose

UX6.9 is the final acceptance phase for the ground-up FlyTally Training redesign. It does not introduce another visual direction. It verifies the approved UX6 system across the complete product matrix and records the final product-owner decision.

## Mandatory 64-screen matrix

Surfaces:

1. Aircraft Library — `/`
2. Aircraft launch — `/aircraft/learjet-35a`
3. Procedures — `/aircraft/learjet-35a/procedures`
4. Performance — `/aircraft/learjet-35a/performance`
5. Training — `/aircraft/learjet-35a/training`
6. Reference — `/aircraft/learjet-35a/reference`
7. Flight — `/aircraft/learjet-35a/flight`
8. Systems — `/aircraft/learjet-35a/systems`

Viewports:

- Desktop Chromium — 1664 × 930
- iPad landscape — 1112 × 834
- iPad portrait — 834 × 1112
- Narrow mobile — 390 × 844

Themes:

- light
- dark

Total: **8 × 4 × 2 = 64 screenshots**.

## Capture

Run against production:

```bash
UX6_BASE_URL=https://training.fly-tally.com npm run capture:ux6
```

Run against a Vercel share URL:

```powershell
$env:UX6_BASE_URL="https://<preview>.vercel.app/?_vercel_share=<token>"
npm run capture:ux6
```

The capture script preserves the `_vercel_share` token when it navigates from the Library to every aircraft route.

Artifacts:

- `ux6-screenshots/light/...`
- `ux6-screenshots/dark/...`
- `ux6-screenshots/manifest.json`

The screenshot directory is ignored by git.

The manifest records:

- requested/final URL;
- HTTP status;
- navigation timing;
- horizontal overflow;
- whether the real aircraft shell mounted;
- whether Systems rendered the governed unavailable state;
- whether the legacy global unavailable state appeared;
- mobile/touch Procedures picker visibility;
- first Operate region viewport position when measurable;
- browser console errors;
- page errors;
- capture elapsed time.

These timings are diagnostic only and must never be presented as aviation validity/freshness.

## Visual acceptance criteria

### Product identity
- reads as one professional pilot/training workspace;
- no admin-dashboard feeling;
- no marketing-site visual island inside the application;
- Library and aircraft workspace visibly belong to the same product.

### Desktop
- 1664 px workspace uses available width intentionally;
- 72 px rail is clear but subordinate;
- one aircraft context bar only;
- content dominates shell chrome;
- no return to centered narrow-page composition;
- operational fast path feels anchored to the shell.

### Procedures
- navigator and checklist hierarchy are immediately understandable;
- Operate is the primary task;
- source/Relevance/Learn remain available without blocking execution;
- mobile/touch layouts expose procedure content quickly;
- controls do not consume an excessive first viewport.

### Performance
- inputs and result read as different functional panes;
- real calculated result receives visual priority;
- stale/recalculate state is explicit;
- no fabricated example values;
- source/calculation context stays secondary but reachable.

### Flight
- Active Flight lifecycle and route context scan first;
- Flight Brief/dependencies are easy to parse;
- recent/archive state is subordinate;
- no invented readiness status.

### Training
- START HERE / STUDY / APPLY hierarchy is visible;
- scenarios remain clearly training, not operations.

### Reference
- full view reads as a lookup/reading workspace;
- source notices and provenance remain explicit;
- touch navigation remains usable without horizontal document overflow.

### Systems
- governed real content uses the same workspace language when available;
- missing content renders the explicit in-shell fail-closed state;
- no content is inferred or substituted.

### Themes / accessibility
- light and dark are peer designs;
- focus remains visible;
- source safety semantics retain distinct meaning;
- touch controls remain usable at the supported viewports;
- no horizontal overflow;
- fixed/sticky chrome does not obscure primary controls.

## Technical gate before product-owner review

Required evidence:

Run the complete local gate:

```bash
npm run verify:ux6
```

This requires:

- TypeScript PASS;
- full Node suite PASS;
- Next build PASS;
- Playwright PASS in:
  - desktop-chromium
  - mobile-chromium
  - ipad-landscape
  - ipad-portrait;
- UX6.8 accessibility/responsive browser checks PASS;
- no unresolved release-blocking Vercel runtime errors;
- final matrix captured from the exact deployment under review.

## Completion

UX6.9 is **not complete** until Filip explicitly approves the actual final screenshots/preview.

Automated tests may establish technical readiness but may not infer product-owner visual approval.

After explicit approval:

```
UX6 COMPLETE
C0 UNBLOCKED
```

Until then:

```
UX6.9 AWAITING PRODUCT-OWNER APPROVAL
C0 HOLD
```

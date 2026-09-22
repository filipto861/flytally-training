# UX5 visual audit 02 — final production matrix

**Reviewed artifact:** `ux5-screenshots-final.zip` supplied by the product owner.

**Capture:** 2026-09-22T18:17:12.522Z  
**Production:** `https://training.fly-tally.com`  
**Deployment commit:** `f1ec3264d33a5e5670c4e1d7407dc7da2f9f71fa`

## Result

**READY FOR PRODUCT-OWNER VISUAL APPROVAL.**

The blocking findings from UX5 audit 01 are corrected in production:

- canonical FLIGHT now renders the P1 `/flight` workspace;
- the website footer is absent inside the new aircraft shell;
- touch fast-path chrome is edge-attached;
- Performance calculation/source explanation is collapsed by default;
- shell Active Flight status is wired to the real lifecycle contract;
- both light and dark workspace themes are represented in the acceptance matrix.

No new release-blocking visual defect was found in the supplied matrix.

## Matrix coverage

The final artifact contains **64 screenshots**:

- 8 surfaces
- 4 viewport classes
- 2 themes

Surfaces:

- Aircraft library
- Aircraft launch
- Procedures
- Performance
- Training
- Reference
- Flight
- Systems

Viewport classes:

- Desktop 1664 × 930
- iPad landscape 1112 × 834
- iPad portrait 834 × 1112
- Mobile 390 × 844

Themes:

- light
- dark

All 64 navigations returned HTTP 200.

## Visual findings

### Desktop

The aircraft workspace now reads as an application rather than an under-filled technical wireframe. Content width is intentional, the navigation rail and top aircraft context form one hierarchy, and the fast-path dock is subordinate to the primary workspace.

Procedures is the strongest dense-content example: search/filter, procedure index, Learn/Relevance/Operate sections and action controls now share one surface language without the former light legacy islands.

Performance is intentionally sparse without an Active Flight, but the task hierarchy remains clear and the long calculation/source explanation no longer dominates the page.

Flight now opens the canonical P1 workspace and presents Active Flight, Flight Brief and recent-flight sections coherently.

Training and Reference remain sparse because the current production package exposes limited applicable content; their sparse states are deliberate and readable rather than visually broken.

### iPad landscape / portrait

The shell collapses coherently to touch-first navigation. Page gutters, cards and typography remain stable in both orientations. The bottom fast-path chrome is visually integrated with the application edge rather than appearing as an unrelated floating control.

No horizontal clipping or broken two-column transition is visible in the supplied screenshots.

### Mobile

The 390 × 844 layouts preserve task priority and readable typography. Controls retain adequate touch size, page content stacks coherently, and the aircraft identity/search context remains understandable without desktop navigation.

The bottom CHECKLIST / QRH / PERF / REF bar is intentionally persistent application chrome. In Playwright full-page screenshots it can appear midway through long documents because sticky/fixed chrome is captured at the viewport position during full-page stitching; this is a capture characteristic rather than evidence that the document ends there. Automated overflow/focus acceptance remains green.

### Light / dark behavior

Aircraft-shell surfaces render distinctly and coherently in both light and dark workspace themes.

The public Aircraft Library and the global fail-closed unavailable page remain product/global surfaces rather than workspace-theme surfaces; therefore their light appearance is unchanged in the dark capture. This is treated as intentional scope, not a theme regression.

## Systems content/governance caveat

`/aircraft/learjet-35a/systems` still renders the explicit fail-closed unavailable page in all eight Systems captures.

This is the same content/governance gap recorded in audit 01. It does not show a P3 renderer regression and is not classified as a visual-shell blocker. Real-content Systems visual review must be repeated when a governed, configuration-applicable Systems module is published for the production Learjet package.

Do not use UX5 completion as evidence that the production Systems content gap is resolved.

## Performance baseline

Median Navigation Timing values from the 64 production captures:

| Surface | DOMContentLoaded median | Max | Capture elapsed median |
|---|---:|---:|---:|
| Library | 266 ms | 366 ms | 1098 ms |
| Aircraft | 390 ms | 796 ms | 1220 ms |
| Procedures | 398 ms | 665 ms | 1291 ms |
| Performance | 293 ms | 648 ms | 1125 ms |
| Training | 594 ms | 787 ms | 1428 ms |
| Reference | 270 ms | 527 ms | 1086 ms |
| Flight | 320 ms | 640 ms | 1152 ms |
| Systems unavailable | 348 ms | 646 ms | 1178 ms |

The capture script intentionally waits after DOMContentLoaded before screenshotting, so capture elapsed time is diagnostic and is not equivalent to user-perceived page-complete time.

No production runtime errors were reported by Vercel during the final review window.

## Acceptance conclusion

Automated release evidence before this final matrix:

- UX5 targeted: 8 / 8
- Node: 968 / 967 pass / 0 fail / 1 skip
- Build: PASS
- Playwright: 340 / 340

The final production matrix does not expose a new visual blocker.

**Remaining UX5 requirement:** explicit product-owner approval.

Until that approval is given, UX5 remains incomplete and C4b must not proceed.

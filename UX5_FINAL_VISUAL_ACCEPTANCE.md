# UX5 — Final visual acceptance

Status: **IN PROGRESS**

UX5 is the final visual acceptance phase for the new FlyTally Training shell. It does not change the frozen P0–P7 domain/runtime contracts. Completion requires real production screenshots, regression evidence, accessibility/performance signoff, and explicit product-owner approval.

## Production baseline

- Production URL: `https://training.fly-tally.com`
- UX4 production deployment commit reviewed in audit 01: `1c9df1ded7420a95f7aeb4982c5663fb82686d41`
- New shell remains a live single-user development preview until UX5 and cleanup/release work are complete.

## Mandatory visual review matrix

Review the following product surfaces:

- Aircraft library: `/`
- Aircraft launch: `/aircraft/learjet-35a`
- Procedures: `/aircraft/learjet-35a/procedures`
- Performance: `/aircraft/learjet-35a/performance`
- Training: `/aircraft/learjet-35a/training`
- Reference: `/aircraft/learjet-35a/reference`
- Flight: `/aircraft/learjet-35a/flight`
- Systems: `/aircraft/learjet-35a/systems`

Capture every surface in **light and dark workspace themes** at:

- Desktop Chromium — 1664 × 930
- iPad landscape — 1112 × 834
- iPad portrait — 834 × 1112
- Narrow mobile — 390 × 844

The capture script writes deterministic screenshots and a manifest under `ux5-screenshots/`. This directory is ignored by git.

The legacy operational `/fly` route remains a separate entry during migration. It is not the canonical new-shell FLIGHT destination and is not a substitute for reviewing `/flight`.

## Visual acceptance criteria

The product owner must explicitly accept the visual result after reviewing the production screenshots. The review must confirm:

- desktop no longer reads as an under-filled technical wireframe;
- content width, density and whitespace feel intentional;
- top bar, side navigation/drawer and fast-path controls form one coherent shell;
- page hierarchy is consistent across launch, Procedures, Performance, Systems, Training, Flight and Reference;
- touch layouts remain readable without horizontal overflow;
- no important control is obscured by safe areas or fixed/sticky chrome;
- dark/light surface transitions are intentional rather than legacy visual islands;
- operational emphasis does not masquerade as source authority, validity or safety status;
- empty, unavailable and fail-closed states remain understandable and visually deliberate;
- website-only footer chrome does not reappear inside the new aircraft application shell.

## Interaction / accessibility signoff

UX4 already provides automated coverage for touch targets, focus containment/restoration, reduced motion, forced colors, safe-area handling and horizontal-overflow guards. UX5 must still visually confirm that those mechanisms do not create clipped or awkward layouts in the real production package.

## Performance baseline

UX5 records a production navigation baseline for the reviewed routes. The capture manifest records HTTP result, document title, load timing from the Navigation Timing API when available, final URL, theme, and whether the rendered surface is the explicit fail-closed unavailable state.

These measurements are diagnostic baselines, not aviation validity indicators and not a user-facing freshness model.

## Completion gate

UX5 remains **IN PROGRESS** until all of the following are true:

- production screenshot matrix captured from the current accepted deployment in light and dark themes;
- visual defects found in review are corrected or explicitly accepted;
- local Node/build/Playwright release gate is green after the final correction;
- accessibility review is signed off;
- performance baseline is recorded;
- Filip explicitly approves the final visual design.

Do not mark UX5 complete from automated tests alone.

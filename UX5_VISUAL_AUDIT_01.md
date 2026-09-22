# UX5 visual audit 01 — UX4 production baseline

**Reviewed artifact:** user-provided `ux5-screenshots.zip` captured from `https://training.fly-tally.com` on 2026-09-22.

**Deployment represented by the capture:** UX4 production commit `1c9df1ded7420a95f7aeb4982c5663fb82686d41`.

## Result

**NOT READY FOR FINAL VISUAL APPROVAL.**

The UX0–UX4 redesign is a substantial improvement over the original scaffold: spacing, content framing, procedure execution, cards and responsive stacking are now coherent. The first UX5 production pass nevertheless exposes several release-visible issues that must be corrected or re-reviewed before owner approval.

## Blocking findings

### UX5-V01 — FLIGHT top-level destination points at the legacy operational route

The production matrix captured `/aircraft/learjet-35a/fly`, which renders the global unavailable state for the current package. P1 already owns the new-shell `/flight` workspace.

**Correction:** make the frozen FLIGHT destination enter `/flight`; keep `/fly` as a separate legacy operational deep link and keep it classified under FLIGHT.

### UX5-V02 — website footer chrome is still visible inside the aircraft app

Desktop, iPad and mobile screenshots all show the global legal/footer block below the new shell. This undermines the UX0 principle “application, not webpage” and duplicates an older mobile-app intent to suppress website footer chrome inside aircraft workspaces.

**Correction:** hide `.app-footer` only while the new aircraft shell is mounted. The public/library footer remains unchanged.

### UX5-V03 — touch fast-path rail reads as a floating content obstruction

On narrow mobile the CHECKLIST / QRH / PERF / REF pill visibly crosses live content, most clearly on Aircraft, Procedures and Performance. The controls remain usable, but the composition looks accidental rather than native.

**Correction:** on touch layouts convert the fast-path rail to edge-attached bottom application chrome (full width, no floating radius/margins). Preserve all four W3 actions and safe-area padding.

### UX5-V04 — Performance source context dominates the task on mobile

When no Active Flight exists, the Performance page is mostly a long calculation/source explanation. The source information is important but violates the intended hierarchy of task first, source metadata third.

**Correction:** retain all text and source titles but place the calculation context behind explicit progressive disclosure.

### UX5-V05 — shell Active Flight chip can contradict page state

The top bar was hard-coded to `ACTIVE FLIGHT · NONE` even though the shell already resolves D0 Active Flight. This was visible in an earlier owner screenshot with an active flight card.

**Correction:** render the top-bar status from the actual ACTIVE lifecycle and route pair; retain NONE when no active flight exists.

### UX5-V06 — dark workspace theme was not captured

The original owner complaint was observed in dark mode, but audit 01 contains only the default light render.

**Correction:** the final matrix must capture both light and dark workspace themes before UX5 signoff.

## Content/governance finding, not a UX code regression

### UX5-C01 — Systems is unavailable in the current production Learjet package

The Systems route reaches the explicit fail-closed unavailable surface because no configuration-applicable governed Systems module is currently published for this production package.

This does **not** demonstrate a P3 renderer regression. It does mean production-specific Systems visuals cannot receive a real-content UX5 signoff yet. Keep this finding separate from the shell/design corrections.

## Non-blocking observations

- Aircraft launch is now clearly framed and no longer spans the whole desktop viewport.
- Procedures is the strongest completed workspace in this capture: index, Learn, Relevance and Operate read as one product.
- Training and Reference are visually sparse because the current production package exposes little applicable content. Their empty/sparse states are understandable.
- The first desktop Aircraft navigation measurement is a cold-load outlier (~4.6 s DOMContentLoaded); subsequent captured routes are materially faster. Record the next production matrix before drawing a performance conclusion.
- No horizontal overflow was visible in the supplied screenshots.

## Next acceptance pass

After the blocking corrections deploy:

1. rerun the complete light + dark matrix;
2. verify canonical `/flight` instead of legacy `/fly`;
3. confirm footer suppression only inside the new shell;
4. inspect the mobile fast-path rail against Procedures/Performance content;
5. confirm Performance context is collapsed by default;
6. review real Systems content if/when a governed Systems publication becomes available;
7. run the full local release gate;
8. obtain explicit product-owner visual approval.

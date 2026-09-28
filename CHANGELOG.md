# Changelog

All notable changes to FlyTally Training are recorded here.

## Changelog governance

This file is the authoritative version history for completed FlyTally Training work.

- record material product, architecture, data/source, testing/governance and production changes here when they are accepted;
- reference the relevant PR/merge/deployment where practical;
- do not use chat history as the only record of a completed change;
- keep historical entries intact; correct factual mistakes explicitly rather than silently erasing project history;
- **ROADMAP.md defines where the project is going; CHANGELOG.md records what actually changed. Both must remain synchronized before a material work item is considered closed.**

## Unreleased

### R1.1b query-aware shell/provider scope spike
- Started the bounded Next.js 16 scope-propagation spike after the independent review and R1.1a resolver merge.
- Added a query-aware parallel-route slot under the aircraft workspace. The slot is a Page (therefore receives current `searchParams`) and is rendered inside the existing `FtFastPathProvider`; the shared Layout itself remains query-agnostic as required by Next.js.
- The spike carries only scope identity and is deliberately non-authoritative: existing Fast Path filtering/data ownership is unchanged until R1.1c.
- Added fail-closed handling for duplicate/ambiguous `variant` query values.
- Added browser acceptance for explicit valid scope, effective-configuration snapshot identity, client navigation with preserved variant, and explicit invalid scope.
- Runtime aviation content, Performance calculations, Checklist persistence and legacy flag-OFF behavior are unchanged in this spike.
- Acceptance on implementation head `ce82c47d0cad22693984dec0f247e81b08c689e2`: Verify Training PASS; TypeScript PASS; full Node **1472 total / 1471 PASS / 0 FAIL / 1 SKIP**; production build PASS; Browser smoke **420/420 PASS** across desktop, mobile, iPad landscape and iPad portrait.
- The first Verify build attempt failed in a transient Turbopack/next-font internal resolver path while the Browser workflow built the same head successfully; a rerun of the failed Verify job passed without a code change.


### Browser responsive acceptance reliability
- Corrected the Playwright shell acceptance harness to follow the application’s effective media queries instead of assuming the `desktop-chromium` project always renders the desktop rail.
- Navigation, Fast Path sizing, Procedures selector and touch-target checks now derive desktop/touch behavior from `matchMedia`, matching the same responsive contracts used by production CSS.
- This addresses the scheduled Browser smoke baseline in which headless Desktop Chrome reports a touch-like hover/pointer environment and therefore legitimately renders the touch shell while project-name-based tests expected desktop-only controls.
- No product runtime, aviation data, database schema or responsive CSS behavior changed.


### R1.1a workspace-scope resolver contract — PR #283
- Added a new-shell-only, aircraft-agnostic workspace aircraft-scope resolver without changing the legacy `resolveSelectedVariant()` behavior.
- Explicit invalid variant requests now have a fail-closed `unknown-variant` result in the new contract instead of permission to select a sole/default/common configuration.
- Added explicit `unselected`, `selected`, `unknown-variant` and `configuration-invalid` states plus selection provenance (`explicit`, `sole-variant-default`, `common-aircraft`).
- Preserved support for aircraft with no variant dimension by resolving the existing common configuration rather than incorrectly treating them as unconfigured.
- Selected scope exposes the existing deterministic effective-configuration snapshot identity so later R1.1 batches can invalidate state on same-variant serial/equipment/modification changes.
- Added generic regression coverage for explicit-valid, explicit-invalid single/multi variant, sole-default, multi-unselected, common-aircraft, snapshot drift/stability and configuration-resolution failure.
- Acceptance on head `e836a665c8b6e8bca64b0cdfca48b6d82b4bb3c7`: GitHub Verify Training PASS; TypeScript PASS; full Node **1471 total / 1470 PASS / 0 FAIL / 1 SKIP**; production build PASS; Playwright/DB/deploy N/A for this pure contract batch.
- No FtShell/Fast Path wiring, Performance persistence, Checklist session schema, Partial Power applicability or legacy runtime behavior changed yet.


### Independent R1 safety review reconciliation
- Reconciled the independent R1.1/R1.3 review against current `main` rather than accepting its unverified assumptions.
- Confirmed the page/Fast Path variant split, permissive explicit-invalid fallback, and the Fast Path REF `window.location.search` workaround.
- Confirmed the effective configuration snapshot is a deterministic content-derived fingerprint over serial/equipment/modification state, distinct from the Active Flight dependency snapshot.
- Confirmed Performance Snapshot V2 currently invalidates on variant but not effective-configuration snapshot; R1.1 now requires same-variant technical configuration changes to stale Takeoff/Landing results.
- Confirmed Checklist sessions scope by variant + Active Flight but do not carry effective-configuration snapshot identity; R1.1 now forbids silent continuation/reset across same-variant configuration changes.
- Froze the product decision that a sole variant may auto-resolve when no query is supplied, while multi-variant EFB requires explicit configuration selection; LEARN may show common content only with visible unselected-state disclosure.
- Kept the legacy resolver unchanged for flag-OFF compatibility; R1.1 will add a new-shell resolution contract with unselected / selected / unknown-variant / configuration-invalid states.
- Confirmed Active Flight does not own technical aircraft variant/configuration and will not become a second selector.
- Confirmed the Partial Power training preview currently selects the Aeronca path from the mode choice; R1.1 now requires that source path to remain compatible with the effective configuration.
- Confirmed a deeper R1.3 risk: cached new-shell `/fly` can contain the server Active Flight, while mirror reconciliation makes a defined server value authoritative. The offline contract now requires a flight-safe prepared artifact so cached server state cannot resurrect/overwrite the current local Active Flight.
- Refined package identity: publication/bundled content identity is change-sensitive; readiness is verified separately because stale-source state can change without a publication version change.
- Rejected a forced Next.js implementation choice at design time. A bounded spike must prove the shared-scope/provider mechanism before runtime implementation.
- Runtime code, aviation data, database schema and deployment remain unchanged in this review-reconciliation commit.


### R1 safety design audit
- Reconstructed the effective configuration and offline PWA paths from current `main` before R1 implementation.
- Confirmed the shell/Fast Path configuration split: `FtShell` resolves a private default variant while child routes consume explicit `?variant=`; REF already carries a separate client-side workaround, demonstrating fragmented ownership.
- Identified an additional fail-closed defect in the permissive variant resolver: an explicit unknown variant can fall back to the sole variant or common/undefined configuration instead of remaining invalid.
- Froze the R1.1 design direction around one shared requested/effective configuration resolution contract, reuse of existing Performance/checklist invalidation semantics, and explicit invalid-query regression coverage.
- Confirmed the current offline cache is variant-keyed but not effective-configuration-snapshot/package-identity keyed. R1.3 now requires an operational package identity and distinguishes offline availability from source currentness without arbitrary time expiry.
- No runtime code, aviation data, database schema or deployment changed in this design-only audit.


### Roadmap phase decomposition — R2 through R6
- Expanded the post-R1 roadmap into explicit analysis/implementation/acceptance milestones without changing runtime behavior.
- R2 now separates cockpit UX baseline/reachability, shell hierarchy, Fast Path surface contract, state preservation, domain presentation and responsive/night acceptance.
- R3 now requires a canonical Flight Brief ownership matrix, removal of empty placeholder cockpit chrome, canonical summary-only behavior and an explicit decision gate before any Relevant Procedures feature.
- R4 now starts with a real aircraft/source-selection gate and proves governed no-code onboarding, cross-domain sparse capability behavior, architecture regression and production acceptance.
- R5 now starts from a source/applicability coverage matrix before Systems, Procedures learning, scenarios/progress or deterministic cross-links are scheduled.
- R6 now separates stale-source administration, offline robustness, CI/observability reliability, repository hygiene and per-flag legacy retirement.
- No functional code, aviation data, DB schema or deployment behavior changed.

### R1 source-applicability correction
- Started R1 planning from the merged R0 baseline and re-checked the actual production aircraft identity before any Limitations work.
- Confirmed the production Learjet launch surface identifies **Learjet 35A · Flysimware FC-530** with selected variant `fc530-standard`.
- Corrected the R0 assumption that FM-102 could control the initial Learjet Limitations dataset: the reviewed FAA-approved FM-102 source identifies itself as the FC-200 AFM, while CL-102B's revision log and FAA service-information mapping identify the FC-530 AFM family as FM-108.
- Moved Learjet Limitations publication to the parallel SOURCE-GATED lane until the applicable FM-108 revision/supplement/temporary-change set is available and reviewed.
- Reordered R1 so effective-configuration consistency is the first aviation-critical gate, followed by QRH.4 cockpit acceptance, offline governed-content currency, EFB content-state acceptance and the lightweight no-code regression.
- R1/R2 are not blocked merely to fill a missing Limitations payload: absent FC-530 Limitations must remain explicitly unavailable, while existing source-backed REF capabilities may continue to operate.
- No functional runtime, aviation dataset, DB schema or deployment behavior changed in this planning correction.

### Documentation / roadmap governance — R0
- Rebuilt `ROADMAP.md` as a forward-looking R0–R6 execution plan instead of a PR-by-PR implementation journal; detailed completed history remains in this changelog, tests, PRs and Git history.
- Restored canonical `FEATURES.md` as the Training capability inventory and aligned document ownership with the FlyTally-wide model used by Logbook.
- Superseded the PR #236 four-file-count rule with a five-file canonical surface while preserving its anti-sprawl/consolidation intent; documentation-contract tests now enforce the new set.
- Reconciled known product-truth drift: SimBrief import and Climb/Cruise Reference are live, the generic Weight & Balance platform exists while Learjet operational W&B remains source-gated, and the governed Learjet QRH package is live while final cockpit acceptance remains open.
- Incorporated the independent roadmap review after repo verification: effective variant/configuration consistency and offline governed-content currency are explicit R1 safety gates; a lightweight no-code architecture spot-check precedes cockpit UX work while the full real second-aircraft proof remains R4.
- Recorded the cockpit “digital binder” direction as an R2 UX principle without creating another navigation model or weakening applicability/provenance semantics.
- Factual status correction: PR #278 is merged on `main` as `ade51447968c5af594532c45c6a3a98e44b7ac18`; the older 2026-09-26 changelog entry is intentionally retained as the pre-merge state it recorded.
- No functional runtime, aviation data, database schema or deployment behavior is changed by R0.
- PR #279 verification on head `30cce334db9cda70d5dfd48ffe0be7ee5ebc87a6`: GitHub Actions Verify Training PASS; TypeScript PASS; full Node suite **1462 total / 1461 PASS / 0 FAIL / 1 SKIP**; production build PASS; Playwright/DB/deploy N/A for this documentation-only scope.

## 2026-09-26

### Changed
- **PR #278 — operational Checklist dark-theme correction**
  - corrected the full-page operational Checklist so phase controls, checklist cards, text, borders, completed state, footer controls and source warning/caution surfaces consume the existing FlyTally workspace semantic theme tokens instead of legacy hard-coded light surfaces;
  - retained explicit light fallbacks for flag-off/legacy compatibility without changing checklist content, applicability, progress/session state or operational behavior;
  - added a static regression contract for Checklist theme roles and browser acceptance proving the dark-workspace checklist card resolves to `--ft-bg-panel` (`#101821`) instead of white;
  - hardened pre-existing B5 browser tests by waiting for the asynchronous requestAnimationFrame-backed Takeoff/Landing calculation result before dependent navigation/actions; no Performance runtime or calculation behavior changed;
  - acceptance: targeted checklist/theme/B5 regression **25/25 PASS**; full Node **1461 total / 1460 PASS / 0 FAIL / 1 SKIP**; production build **PASS**; focused B5 Playwright **8/8 PASS** serially; full responsive Playwright **396/396 PASS**; final working tree clean; production deployment/smoke pending merge.

- **PR #276 — EFB Checklist ownership + REF fast-path layout polish**
  - renamed the new-shell EFB left-rail operational destination from **FLY** to **Checklist / CHK** while retaining the existing `/fly` route as a compatibility path;
  - changed new-shell `/fly` to a dedicated full-page operational Checklist workspace instead of a second aggregate Flight Deck;
  - removed duplicate Performance and Emergency tabs from the new-shell Checklist page; dedicated **PERF** remains the Performance workspace and **QRH** remains the operational Emergency/Abnormal fast path;
  - preserved one canonical Active Flight checklist session across the full-page Checklist and CHECKLIST fast-path drawer;
  - preserved the historical aggregate Flight Deck only for the flag-off legacy path, keeping backward compatibility isolated from the new-shell IA;
  - polished the EFB **REF** fast-path layout without changing its governed data or runtime: result now stacks below inputs and the drawer uses a readable two-column input grid with narrow-screen fallback;
  - retained exact `SOURCE ROW`, bounded `INTERPOLATED`, fail-closed `Unavailable`, provenance/effectivity disclosure, no extrapolation and sparse/anomaly boundary protections;
  - synchronized ROADMAP and TECHNICAL_DOCUMENTATION with the new Checklist ownership while preserving historical decision records;
  - acceptance: targeted IA/Reference/legacy-shell regression suite **60/60 PASS**; full Node **1460 total / 1459 PASS / 0 FAIL / 1 SKIP**; production build **PASS** on the production-code revision, with subsequent changes test-only; Playwright **392/392 PASS**; final working tree clean.

- **PR #275 — Reference context split: LEARN source tables + EFB REF lookup**
  - kept Climb/Cruise inside the Reference domain instead of moving it into Takeoff/Landing PERF;
  - changed **LEARN → Reference** from an input-driven calculator to a published source-table browser, with regime/source-slice selection and exact source values only;
  - sparse, blocked and source-anomaly cells remain visibly unavailable in LEARN; interpolated values are never inserted into the displayed source matrix;
  - moved/reused the existing generic Climb/Cruise lookup in **EFB → REF fast path**, preserving exact `SOURCE ROW`, bounded `INTERPOLATED` and fail-closed `Unavailable` states;
  - EFB REF accepts continuous numeric inputs only inside complete published source geometry; extrapolation, sparse-corner bridging, anomaly repair and one-engine Mach/KIAS boundary interpolation remain blocked;
  - preserved existing governed limitations in REF and left the dedicated PERF surface unchanged for Takeoff/Landing;
  - retained #272 source extracts and #273 generic Reference runtime as canonical, with no second calculation engine and no Learjet-specific runtime branch;
  - updated the historical P5/P7 ownership documentation without erasing the prior decision trail;
  - acceptance: targeted context-split/P5/P7 suite **39/39 PASS**; full Node **1460 total / 1459 PASS / 0 FAIL / 1 SKIP**; production build **PASS**; Playwright **392/392 PASS**. The final correction was documentation-only, so the previously green build/browser evidence remained applicable.

- **PR #272 + PR #273 + PR #274 — Learjet Climb/Cruise Reference source digitization, runtime and UI**
  - digitized the reviewed CL-102B climb, two-engine Long Range Cruise, Normal Cruise and one-engine Long Range Cruise source tables as governed source evidence, preserving source axes, sparse geometry, Rosemount/non-Rosemount effectivity and visually verified printed anomalies rather than silently repairing them;
  - added a separate Reference-only performance package/registry that reuses the generic multi-axis performance runtime and remains isolated from Takeoff/Landing Performance;
  - exact source rows and bounded source-authorized interpolation are supported only inside complete published source regions; extrapolation, blocked anomaly cells, sparse corners and one-engine Mach/KIAS unit-boundary interpolation fail closed;
  - kept High-Speed Cruise absent because no reviewed source table exists and did not invent optimum-climb/cruise or maximum-specific-range recommendations from chart shading/text extraction;
  - added the new-shell Reference performance workspace with aircraft-configuration filtering, generic axis-driven inputs, explicit SOURCE ROW / INTERPOLATED / Unavailable states, published envelopes and progressively disclosed source/effectivity/provenance notes;
  - added deterministic browser-fixture and responsive E2E coverage for exact, interpolated, unavailable and provenance states without adding aircraft-specific calculation logic to the UI;
  - PR #272 source acceptance: targeted one-engine LRC extraction 7/7 PASS; full Node 1444 total / 1443 PASS / 0 FAIL / 1 SKIP; production build PASS;
  - PR #273 runtime acceptance: targeted Reference runtime 9/9 PASS; full Node 1453 total / 1452 PASS / 0 FAIL / 1 SKIP; production build PASS;
  - PR #274 UI acceptance: targeted Reference runtime/UI 15/15 PASS; full Node 1459 total / 1458 PASS / 0 FAIL / 1 SKIP; production build PASS; Playwright 388/388 PASS. The final correction was test-only, so the previously green build/browser evidence remained applicable;
  - local PR #274 acceptance ran on Node 22.19.0 while the repository/deployment contract remains Node 24.x; this local-runtime deviation was explicitly accepted for merge.

- **PR #264 + hotfix PR #265 — SimBrief Active Flight import + TOW prefill**
  - added explicit pilot-initiated SimBrief latest-OFP import to Active Flight using Navigraph Alias or SimBrief Pilot ID, with no background polling;
  - prefills departure, destination and Estimated TOW when present while preserving SimBrief kg/lb units;
  - keeps imported values editable and stores field-level provenance so manual overrides clear source attribution only for the edited field;
  - keeps Alias/Pilot ID device-local and opt-in; raw OFP data is not retained server-side;
  - added aircraft-owned SimBrief compatibility metadata; Learjet 35/36 accepts `LJ35` and mismatched/missing aircraft identity fails closed;
  - added nullable `training_active_flights.prefill_provenance JSONB` persistence and readiness coverage;
  - PR #265 fixed current SimBrief JSON v2 ISO-8601 `params.time_generated` parsing while retaining legacy Unix-second compatibility and malformed-value rejection;
  - acceptance: typecheck PASS; targeted SimBrief suite 15/15 PASS after hotfix; full Node suite 1404 total / 1403 PASS / 0 FAIL / 1 SKIP; production build PASS; Playwright 400/400 PASS;
  - production deployment on 2026-09-26 remained 200/ready with no runtime errors, and authenticated live smoke successfully imported OFP `187654556` for `LJ35`, prefilling `LKPR → LFBO` and Estimated TOW `7719 kg`.

## 2026-09-25

### Changed
- **PR #260 + PR #261 — QRH.3U complete governed Learjet QRH publication**
  - assembled all reviewed CL-102B Change 2 Emergency + Abnormal source batches into one governed `abnormal/bundle`;
  - reconciled three previously omitted Electrical emergency procedures: BATTERY OVERHEAT LIGHT(S) (NICAD ONLY), CURRENT LIMITER FAILURE and ESSENTIAL BUS FAILURE — DC POWER LOSS;
  - final package accounts for all indexed entries: 29 Emergency textual scenarios + E-13 AIRSTART ENVELOPE, and 64 Abnormal textual scenarios + A-35.2 THRUST REVERSER RESTOW ENVELOPE;
  - preserved exact serial/AMK/equipment applicability and fail-closed behavior, including NICAD-only battery content and source-specific thrust-reverser configuration;
  - PR #261 added a reserved non-runtime applicability vocabulary registry after the initial production publication attempt correctly failed closed on unregistered AMK identifiers; registry membership does not assert installed state and is excluded from learner-selectable variants;
  - local acceptance: typecheck PASS; focused QRH.3U suite 18/18 PASS; full Node suite 1381 total / 1380 PASS / 0 FAIL / 1 SKIP; production build PASS; Playwright 392/392 PASS;
  - hotfix acceptance: targeted 29/29 PASS; full Node suite 1384 total / 1383 PASS / 0 FAIL / 1 SKIP; prior build and Playwright remained valid because the final adjustment was test-only;
  - governed production publication succeeded as version `8b2b0468-10b5-4711-b1c7-3787f375aa84`;
  - post-publication production readiness remained 200/ready with `sourceGovernedRelease` and `sourceProvenanceCoverage` true, no runtime errors were observed, and operational smoke confirmed source-authoritative QRH content for `fc530-standard` while non-applicable/unknown configuration content remained filtered.

### Changed
- **PR #259 — QRH.3T generic graphical operating-envelope support**
  - added an aircraft-agnostic QRH operating-envelope figure contract, operational projection and responsive SVG presentation for source-digitized visual-reference geometry;
  - represented both CL-102B E-13 AIRSTART ENVELOPE and A-35.2 THRUST REVERSER RESTOW ENVELOPE with source axes, labelled regions/guides/annotations and exact source-page provenance;
  - kept figure geometry explicitly non-computational: no interpolation, lookup or automated envelope-membership decision is permitted;
  - attached E-13 to all four airstart procedures and A-35.2 to the TR-4000 inadvertent-deployment procedure, removing the final known graphical representation blockers without Learjet-specific runtime branches;
  - acceptance: typecheck PASS; targeted QRH/applicability/P5/P6/W2 suite 98/98 PASS; full Node suite 1363 total / 1362 PASS / 0 FAIL / 1 SKIP; production build PASS; Playwright 392/392 PASS across desktop Chromium, mobile Chromium, iPad landscape and iPad portrait.

### Changed
- **PR #258 — QRH.3S Learjet Thrust Reversers Abnormal source batch**
  - staged all six textual CL-102B Thrust Reversers abnormal procedures from A-34.1/A-35.1 Aeronca and A-34.2 TR-4000;
  - explicitly accounted for the seventh indexed item, the graphical A-35.2 THRUST REVERSER RESTOW ENVELOPE, without flattening its source geometry into textual thresholds;
  - reused the generic thrust-reverser configuration identities so Aeronca/TR-4000 selection remains explicit and unknown, absent, partial or contradictory identity fails closed;
  - preserved source-specific UNLOCK/DEPLOY/BLEED VALVE branches and landing references; visual review found no boxed memory items on A-34.1/A-34.2/A-35.1;
  - acceptance on head `c6c64f2`: typecheck PASS; targeted QRH/applicability/P5/P6/W2 suite 201/201 PASS; full Node suite 1362 total / 1361 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because no browser/presentation behavior changed.

### Changed
- **PR #257 — QRH.3R Learjet Turbulence Abnormal source batch**
  - staged CL-102B TURBULENT AIR PENETRATION across A-33 Without Thrust Reversers, A-33.1 Aeronca and A-33.2 TR-4000 source-effectivity pages;
  - preserved identical six-step source text while keeping exact page provenance/effectivity and selecting exactly one source family through explicit generic thrust-reverser configuration;
  - unknown, absent, partial or contradictory thrust-reverser identity remains fail-closed;
  - visual source review found no boxed memory items on A-33/A-33.1/A-33.2;
  - acceptance on head `7646138`: typecheck PASS; targeted QRH/applicability/P5/P6/W2 suite 192/192 PASS; full Node suite 1353 total / 1352 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because no browser/presentation behavior changed.

### Changed
- **PR #256 — QRH.3Q Learjet Landings Abnormal source batch**
  - staged the complete ten-procedure CL-102B Landings abnormal family from A-27 through A-33.2;
  - preserved the multi-page GEAR UP LANDING continuation, hydraulic-pressure and flap-deflection branches, jammed-stabilizer pull/push paths and the source-defined landing speed/distance adjustments;
  - kept the first nine procedures ALL-aircraft and restricted ONE THRUST REVERSER DEPLOYED LANDING to explicit TR-4000 thrust-reverser configuration with fail-closed behavior otherwise;
  - visual source review found no boxed memory items on A-27 through A-33.2; A-31 vertical marks are change bars rather than memory boxes;
  - acceptance on head `4f4976e`: typecheck PASS; targeted QRH/applicability/P5/P6/W2 suite 187/187 PASS; full Node suite 1348 total / 1347 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because no browser/presentation behavior changed.

### Changed
- **PR #255 — QRH.3P Learjet Landing Gear Abnormal source batch**
  - staged the complete three-procedure CL-102B Landing Gear abnormal family from A-26/A-27;
  - preserved the electrical alternate gear-extension sequence, the conditional ANTI-SKID GEN continuation and the distinct normal-taxi versus takeoff NOSE WHEEL STEERING MALFUNCTION paths;
  - all three source procedures retain ALL-aircraft effectivity and exact A-26/A-27 provenance;
  - visual source review found no boxed memory items on A-26/A-27;
  - acceptance on head `cd1a5d4`: typecheck PASS; targeted QRH/applicability/P5/P6/W2 suite 179/179 PASS; full Node suite 1340 total / 1339 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because no browser/presentation behavior changed.

### Changed
- **PR #254 — QRH.3O Learjet Instruments Abnormal source batch**
  - staged the complete two-procedure CL-102B Instruments Abnormal family from A-25/A-25.1 and A-26;
  - preserved distinct `With Rosemount Pitot-Static System` and `Without Rosemount Pitot-Static System` source procedures through explicit generic `rosemount-pitot-static-system` configuration state, with unknown installation remaining fail-closed;
  - preserved source-specific overspeed/stick-puller behavior, static-source recovery differences, the AFM airspeed/altitude correction-chart reference and V.G. MON gyro guidance;
  - visual source review found no boxed memory items on A-25 through A-26;
  - acceptance on head `7534297`: typecheck PASS; targeted QRH/applicability/P5/P6/W2 suite 173/173 PASS; full Node suite 1334 total / 1333 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because no browser/presentation behavior changed.

### Changed
- **PR #253 — QRH.3N Learjet Hydraulic Abnormal source batch**
  - staged the complete two-procedure CL-102B Hydraulic Abnormal family from A-23/A-24;
  - preserved the LO HYD pressure-result branch, the complete alternate-gear extension sequence and the source references to hydraulic-system-failure and gear-up landing procedures;
  - represented the source `IF INSTALLED` qualifier for LO HYD LIGHT through explicit generic `lo-hyd-light` configured-equipment applicability, with unknown/absent installation remaining fail-closed;
  - visual source review found no boxed memory items on A-23/A-24;
  - acceptance on head `dff2221`: typecheck PASS; targeted QRH/applicability/P5/P6/W2 suite 166/166 PASS; full Node suite 1327 total / 1326 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because no browser/presentation behavior changed.

### Changed
- **PR #252 — QRH.3M Learjet Fuel Abnormal source batch**
  - staged the complete ten-procedure CL-102B Fuel Abnormal family from A-19 through A-23;
  - preserved nested fuel-balance, jettison, low-fuel, standby-pump and tip-tank source branches plus exact A-19/A-20/A-21/A-22/A-23 provenance;
  - represented FUS VALVE Switch source splits through explicit generic `fuselage-valve-switch` configuration state, with unknown installation state remaining fail-closed rather than selecting a source path by inference;
  - visual source review found no boxed memory items on A-19 through A-23;
  - acceptance on head `fc1e603`: typecheck PASS; targeted QRH/applicability/P5/P6/W2 suite 159/159 PASS; full Node suite 1320 total / 1319 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because no browser/presentation behavior changed.

### Changed
- **PR #251 — QRH.3L Learjet Flight Controls Abnormal source batch**
  - staged the complete five-procedure CL-102B Flight Controls Abnormal family from A-17 through A-19;
  - preserved nested source branches, the source-defined single/dual yaw-damper split and exact A-17/A-18/A-19 provenance;
  - kept MACH TRIM MALFUNCTION and PITCH TRIM LIGHT IN FLIGHT fail-closed behind explicit generic configured-equipment applicability instead of inferring applicability from aircraft identity;
  - visual source review found no boxed memory items on A-17 through A-19;
  - acceptance on head `d2dbf6f`: typecheck PASS; targeted QRH/applicability/P5/P6/W2 suite 152/152 PASS; full Node suite 1313 total / 1312 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because no browser/presentation behavior changed.

### Changed
- **PR #250 — QRH.3K Learjet Environmental Abnormal source batch**
  - staged the complete five-procedure CL-102B Environmental Abnormal family from A-14 through A-16.1;
  - preserved A-15/A-15.1 and A-16/A-16.1 serial-number source variants plus the A-14 AMK 90-3 emergency-airflow control split;
  - gated the source's `IF INSTALLED` emergency-airflow procedure through explicit generic configuration equipment and retained fail-closed behavior when required installation or modification state is unknown;
  - visual source review found no boxed memory items on A-14 through A-16.1; the legacy A-16/A-16.1 comparison glyph is explicitly documented and normalized in staged source text rather than propagated as a PDF encoding artifact;
  - acceptance on head `137b9b0`: typecheck PASS; targeted QRH/applicability/P5/P6/W2 suite 145/145 PASS; full Node suite 1306 total / 1305 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because no browser/presentation behavior changed.

### Changed
- **PR #249 — QRH.3J Learjet Engine Abnormal source batch**
  - staged the complete six-procedure CL-102B Engine Abnormal family from A-11 through A-13;
  - preserved source decision branches for abnormal engine operation, fuel-computer failure, engine overspeed and starter-engaged-light troubleshooting instead of flattening them into linear actions;
  - retained exact A-11/A-12/A-13 provenance and ALL-aircraft effectivity for the six indexed procedures;
  - visual source review found no boxed memory items on A-11 through A-13; A-11 vertical marks are Change 1 revision bars rather than memory-item boxes;
  - acceptance on head `92691f1`: typecheck PASS; targeted QRH/applicability/P5/P6/W2 suite 138/138 PASS; full Node suite 1299 total / 1298 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because no browser/presentation behavior changed.

### Changed
- **PR #248 — QRH.3I Learjet Electrical Abnormal source batch**
  - staged the complete CL-102B Electrical Abnormal family from A-9/A-9.1 and A-10;
  - preserved the exact early/late generator page provenance even where the operating response is repeated, while unknown serial identity continues to fail closed;
  - retained the nested generator reset and inverter failure branches instead of flattening them, and kept auxiliary-inverter qualifiers as source text rather than inventing configuration facts;
  - visual source review found no boxed memory items on A-9/A-9.1 or A-10;
  - acceptance on head `06f36d0`: typecheck PASS; targeted QRH/applicability/P5/P6/W2 suite 132/132 PASS; full Node suite 1293 total / 1292 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because no browser/presentation behavior changed.

### Changed
- **PR #247 — QRH.3H Learjet Anti-Icing Abnormal source batch**
  - began CL-102B Abnormal Procedures digitization with the complete 12-procedure Anti-Icing family from A-4 through A-9/A-9.1 plus the A-i section introduction;
  - preserved exact early/late serial page effectivity, nested source conditions, and source-significant differences between paired pages rather than normalizing them;
  - gated `WSHLD DEFOG LIGHT (IF INSTALLED)` through explicit generic configuration equipment and kept unknown/absent equipment state fail-closed;
  - visual source review found no boxed memory items on the reviewed A-4 through A-9.1 pages, so no inferred memory flags or Training overlay were introduced;
  - acceptance on head `b06d4f5`: typecheck PASS; targeted QRH/applicability/P5/P6/W2 suite 126/126 PASS; full Node suite 1287 total / 1286 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because no browser/presentation behavior changed.

### Changed
- **PR #246 — QRH.3G Learjet thrust-reverser Emergency source batch**
  - staged the remaining configuration-specific CL-102B Emergency takeoff thrust-reverser procedures from E-35/E-35.1;
  - preserved Aeronca and TR-4000 as distinct source configurations through generic configuration-equipment applicability, with unknown, absent or contradictory installation identity failing closed;
  - retained the source index split between INADVERTENT THRUST REVERSER DEPLOYMENT and the TR-4000 INDICATION OF THRUST REVERSER DEPLOYMENT title, along with source-specific control actions and references;
  - visually verified boxed-memory boundaries for both Aeronca and TR-4000 source pages without inferring memory state from text;
  - acceptance on head `f9f7d48`: typecheck PASS; targeted QRH/applicability/P5/P6/W2 suite 118/118 PASS; full Node suite 1279 total / 1278 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because no browser/presentation behavior changed.

### Changed
- **PR #245 — QRH.3F Learjet serial/AMK Emergency source batch**
  - staged source-faithful BLEED AIR LIGHT procedures from E-20/E-20.1/E-20.2 with exact serial discontinuities and AMK 76-7 handling;
  - staged CABIN/COCKPIT FIRE, SMOKE, OR FUMES from E-22/E-22.1/E-23/E-23.1/E-24 while preserving the independent first-page and electrical-continuation effectivity families instead of collapsing them into invented variants;
  - kept prior-aircraft AMK 76-7 / AMK 78-13 states fail-closed when unknown, preserved page-level source provenance and source-specific electrical bus lists, and marked only the visually boxed E-22/E-22.1 steps 1–3 as memory;
  - acceptance on head `37c01ca`: typecheck PASS; targeted QRH/applicability/P5/P6/W2 suite 111/111 PASS; full Node suite 1272 total / 1271 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because no browser/presentation behavior changed.

### Changed
- **PR #244 — QRH.3E.1 mapped QRH validator parity**
  - aligned the QRH v2 mapped-effectivity precondition with the generic applicability contract added in QRH.3E;
  - mapped QRH procedures can now use exact serials, serial-number ranges and nested `anyOf` applicability alternatives without being rejected by the QRH-specific guard;
  - retained bounded recursion and fail-closed validation while introducing no learner/UI behavior change;
  - acceptance on head `55ea2e3`: typecheck PASS; targeted QRH/applicability contract suite 38/38 PASS; full Node suite 1266 total / 1265 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required.

### Changed
- **PR #243 — QRH.3E generic serial/effectivity architecture**
  - extended the aircraft-agnostic configuration model with an exact manufacturer serial identifier and included it in the effective-configuration snapshot identity;
  - extended generic content applicability with exact serials, bounded/open-ended serial-number ranges, and nested `anyOf` alternatives so source effectivity such as serial-range OR installed modification can be represented directly;
  - preserved fail-closed behavior when serial, modification or equipment facts are missing/unknown, and extended publication validation/governance traversal to nested effectivity alternatives;
  - exposed serial identity through the existing Studio structured configuration surface without introducing Learjet-specific runtime or UI branches;
  - acceptance on head `975e4cb`: typecheck PASS; targeted configuration/applicability/governance/QRH suite 92/92 PASS; full Node suite 1265 total / 1264 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because cockpit/browser behavior did not change.

### Changed
- **PR #242 — QRH.3D Learjet ALL-aircraft mid-section Emergency batch**
  - staged the reviewed ALL-aircraft CL-102B Emergency Procedures from E-21 and E-25 through E-33, covering emergency descent, flight-control emergencies, fuel pressure, ditching/evacuation, both-engines-inoperative landing, stall warning and aborted takeoff;
  - preserved page-level provenance, nested source decision structure and visually reviewed boxed-memory boundaries without inferring memory status from labels or prose;
  - kept serial/AMK-specific BLEED AIR LIGHT and CABIN/COCKPIT FIRE source families explicitly fail-closed because the current generic aircraft configuration contract cannot prove their source serial ranges;
  - acceptance on head `2993d3e`: typecheck PASS; targeted QRH/P5/P6/W2 suite 76/76 PASS; full Node suite 1257 total / 1256 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because this PR changes staged source content, tests and roadmap only.

### Changed
- **PR #241 — QRH.3C Learjet airstart source batch**
  - staged the four CL-102B textual airstart procedures from E-14 through E-18 while preserving separate Fuel Computer ON/OFF starter-assist and windmilling paths, source sequencing, nested restart branches and page-level provenance;
  - preserved the source 20,000 ft Fuel Computer OFF restriction and reviewed E-14 through E-18 visually before leaving all memory-item flags unset;
  - kept E-13 AIRSTART ENVELOPE as an explicit blocking dependency because its graphical operating envelope cannot be flattened into text without loss; the entire batch remains outside operational publication/fallback paths until a generic source-faithful figure representation exists;
  - acceptance on head `98785d6`: typecheck PASS; targeted QRH/P5/P6/W2 suite 70/70 PASS; full Node suite 1251 total / 1250 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because this PR changes staged source content, tests and roadmap only.

### Changed
- **PR #240 — QRH.3B Learjet engine-fire and oil-pressure source batch**
  - staged source-backed CL-102B E-12 ENGINE FIRE — SHUTDOWN and E-19 OIL PRESSURE LIGHT(S) on the generic QRH v2 contract;
  - preserved explicit ALL-aircraft effectivity, nested source decision branches, and the exact boxed-memory boundary for the applicable E-12 branch without marking its alternate branch as memory;
  - extended the generic QRH condition-branch contract with optional explicit `memoryItem` semantics through validation, operational projection and presentation; no Learjet-specific runtime path was introduced;
  - kept the graphical E-13 AIRSTART ENVELOPE explicitly deferred/fail-closed rather than flattening chart geometry into text, and kept the partial batch outside production publication/fallback paths;
  - acceptance on head `ba2447a`: typecheck PASS; targeted QRH/P5/P6/W2 suite 64/64 PASS; full Node suite 1245 total / 1244 PASS / 0 FAIL / 1 SKIP; production build PASS; targeted Playwright QRH acceptance 8/8 PASS across desktop Chromium, mobile Chromium, iPad landscape and iPad portrait.

### Changed
- **PR #239 — QRH.3A first Learjet Emergency source batch**
  - staged the first source-backed CL-102B Emergency Procedures content in the generic QRH v2 contract: section guidance, DOOR LIGHT, AC INVERTER FAILURE — TOTAL, GENERATOR FAILURE (DUAL), and ENGINE FAILURE;
  - preserved page-level provenance, explicit ALL-aircraft effectivity, source conditional branches, and boxed ENGINE FAILURE memory items without introducing Learjet-specific runtime code;
  - extended the generic QRH step model with a first-class `information` step after real source content exposed numbered informational lines that are not crew actions; validation, search, operational projection, presentation and browser acceptance all carry the new step type;
  - kept the partial Learjet QRH batch staged and deliberately outside production publication/fallback paths;
  - acceptance on head `9809c04`: typecheck PASS; targeted QRH/P5/P6/W2 suite 58/58 PASS; full Node suite 1239 total / 1238 PASS / 0 FAIL / 1 SKIP; production build PASS; targeted Playwright QRH acceptance 8/8 PASS across desktop Chromium, mobile Chromium, iPad landscape and iPad portrait.

### Changed
- **PR #238 — QRH.2 source-faithful operational contract**
  - introduced abnormal/emergency schema v2 with explicit Emergency/Abnormal procedure class, explicit memory-item semantics, source-faithful nested conditions/branches, section introductions and explicit effectivity;
  - separated source-exact operational QRH data from optional Training overlays so operational publication no longer requires invented training setup, objectives, prompts or debrief prose;
  - preserved backward compatibility for legacy abnormal payloads while preventing conditional v2 procedures from being silently flattened into Training expected-response sequences;
  - updated operational projection, QRH presentation, structured authoring starter and aircraft search for the v2 contract; browser fixtures now exercise v2 semantics directly;
  - acceptance on head `59bc099`: typecheck PASS; targeted QRH/P5/P6 suite 43/43 PASS; full Node suite 1232 total / 1231 PASS / 0 FAIL / 1 SKIP; production build PASS; targeted Playwright QRH acceptance 8/8 PASS across desktop Chromium, mobile Chromium, iPad landscape and iPad portrait.

### Changed
- **PR #237 — QRH.1 source inventory and contract-gap audit**
  - inventoried the reviewed CL-102B Emergency and Abnormal sections, including index/category coverage and major page-effectivity families;
  - recorded AFM precedence, page-level effectivity and boxed memory-item semantics as non-publishable source evidence;
  - documented generic contract gaps blocking source-faithful QRH publication: Emergency-vs-Abnormal class, explicit memory semantics, conditional/substep structure, training-only required metadata and serial/AMK effectivity;
  - added focused regression coverage and moved Operational QRH into active implementation;
  - acceptance: typecheck PASS; QRH.1 focused suite 4/4 PASS; full Node suite 1224 total / 1223 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because runtime/UI behavior did not change.

### Changed
- **PR #236 — technical documentation consolidation**
  - consolidated the repository documentation surface to exactly four maintained Markdown files: `README.md`, `ROADMAP.md`, `CHANGELOG.md`, and `TECHNICAL_DOCUMENTATION.md`;
  - removed 68 superseded milestone, audit, specification, deployment and compliance Markdown files from the active tree while retaining their history in Git and pull requests;
  - moved current architecture, source governance, identity/SSO, persistence/privacy, Active Flight, checklist/fast-path, Performance/Partial Power, declared distances, W&B, UX/PWA, administration, deployment, security/compliance and Learjet reference-aircraft contracts into the living technical reference;
  - redirected documentation-dependent tests to the consolidated technical reference or executable contracts and added a regression guard preventing documentation sprawl from returning;
  - acceptance: typecheck PASS; full Node suite 1220 total / 1219 PASS / 0 FAIL / 1 SKIP; production build PASS; no Playwright rerun required because runtime/UI behavior did not change.


### Fixed
- **PR #234 — EFB checklist session synchronization**
  - main Flight Deck checklist, top checklist progress and CHECKLIST fast-path drawer now share one canonical EFB checklist session;
  - completed items and selected phase synchronize bidirectionally;
  - fast-path drawer adds phase reset, two-step reset-all, phase-complete markers and next-phase navigation;
  - fast-path CURRENT STEP now follows the selected phase;
  - EFB checklist persistence is scoped to the current Active Flight ID and stored locally on the device, with one-time migration from prior unscoped/legacy checklist state;
  - Learn checklist-training persistence remains separate;
  - focused acceptance: typecheck PASS, targeted suite 30/30 PASS, production build PASS; targeted Playwright smoke was not run because local port 3000 was occupied;
  - merged and deployed to production; manual synchronization smoke remains the final acceptance step.

### Changed
- **PR #230 — Learjet operational checklist rebuild**
  - digitized CL-102B Normal Procedures N-2 through N-18 into the universal checklist contract;
  - added source provenance, target-profile applicability and guarded governed publication tooling;
  - the reviewed CL-102B checklist package is now governed and published in production.
- **PR #231 — Learjet checklist publisher CJS runtime fix**
  - replaced unsupported top-level await with an explicit async entrypoint;
  - added a real-runtime regression test proving the publisher reaches its confirmation guard under the project Node/tsx execution mode.
- **PR #232 — Learjet checklist publisher local environment loading**
  - the explicit publisher now loads `.env.local` when present using Node 24 `--env-file-if-exists`;
  - keeps the confirmation guard intact and avoids requiring production database credentials to be copied manually into PowerShell;
  - targeted acceptance: typecheck PASS, publisher/checklist suite 10/10 PASS, production build PASS.
- **PR #233 — authenticated production-runtime Learjet checklist release flow**
  - moved the one-shot governed checklist publication into an authenticated Training-admin server action so protected production database credentials never need to be pulled or exposed locally;
  - CLI and admin publication share one governed release helper for CL-102B validation, source identity/fingerprint checks, source registration, idempotence, approval and publication;
  - added the explicit **Publish reviewed Learjet checklist** admin control with required confirmation;
  - targeted acceptance: typecheck PASS, checklist/admin suite 11/11 PASS, production build PASS;
  - authenticated production publication completed successfully.
- **PR #227 — Partial Power EFB simplification**
  - simplified the Learjet 35A Partial Power workflow to pilot-facing essentials;
  - exposed one explicit **Partial Power · Aeronca** mode;
  - reduced explanatory copy while keeping the visible **TRAINING · 25% LIMIT UNVERIFIED** source boundary.
- **PR #228 — Partial Power EFB hard simplification**
  - kept TORA directly editable for intersection departures;
  - removed mandatory duplicate ASDA entry from the primary workflow and added an optional ASDA override;
  - removed checklist-style Partial Power eligibility confirmations from the pilot UI;
  - made METAR application automatic by default, with periodic refresh and automatic recalculation of an existing result;
  - retained manual QNH/OAT overrides with a compact **AUTO METAR** reset.

### Fixed
- **PR #229 — EFB FLY route repair**
  - new-shell FLY no longer dead-ends when governed DB modules are sparse;
  - current bundled Learjet Takeoff/Landing performance is available in the Flight Deck;
  - CHECKLIST and QRH retain their existing source-authority/freshness gates;
  - the legacy flag-off FLY route keeps its historical strict behavior;
  - an explicit fail-closed Flight Deck empty state is shown when no operational module is available.
- Hardened Playwright local-server handling so tests do not silently reuse a server started with the wrong fixture or feature-flag environment.
- Updated stale B4/declared-distance/weather regression contracts after the EFB simplification.

### Documentation / roadmap
- Added **15.1 SimBrief Active Flight import + takeoff-weight prefill**.
- Added **15.2 Learjet climb + cruise Reference performance**.
- Completed the **15.3 EFB / FLY content-completeness audit**:
  - confirmed the dead-end FLY route;
  - confirmed missing Learjet governed data for CHECKLIST, QRH and REF;
  - confirmed current Takeoff/Landing PERF is populated through the bundled Learjet performance package;
  - added a production-content acceptance requirement so visually available but empty EFB slots cannot be treated as complete.

### Production
- PR #227 deployed successfully to `training.fly-tally.com`.
- PR #228 deployed successfully to `training.fly-tally.com`.
- **PR #229** deployed successfully to `training.fly-tally.com`; the Learjet 35A FLY route now returns HTTP 200 in the new EFB shell and production readiness remains healthy.
- **PR #230 + #233 — Learjet CHECKLIST live in production**: the reviewed CL-102B Normal Procedures package was published through the authenticated governed release flow; production FLY renders populated checklist phases and `/api/readiness` remains HTTP 200 / ready with source-governed release healthy.

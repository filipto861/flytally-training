# Learjet 35A/36A Performance Source-Envelope Audit

**Status:** IN PROGRESS  
**Roadmap:** 13 — Performance source-envelope completion  
**Branch:** `feat/performance-source-envelope`  
**Started:** 2026-09-24

## Purpose

The goal of this phase is to widen FlyTally performance coverage only where the applicable approved source actually publishes a wider envelope than the currently digitized checklist tables.

This phase does **not** authorize mathematical extrapolation beyond a published source boundary.

## Source authority

Operational data changes must follow the highest-authority applicable source.

1. Applicable FAA-approved AFM / AFMS.
2. Bombardier/Learjet checklist or Pilot's Manual data where effectivity and authority are suitable and do not conflict with the AFM.
3. FlightSafety training material only as secondary cross-check / locator evidence.

The currently available FM-102 file establishes AFM identity and authority, but its available copy does not include the Section V performance chart pages needed for the wider-envelope digitization. Therefore, the FlightSafety reproductions can identify likely AFM figures/pages and demonstrate that a source-envelope gap exists, but they are not being promoted into new operational rows in this phase.

## Current governed envelopes

| Metric | Current governed source | Current encoded envelope | Audit finding |
| --- | --- | --- | --- |
| Takeoff N1 · standard nozzle · anti-ice OFF | Target source FM-102 Fig. 5-14; stored nodes checklist-derived and cross-checked against FlightSafety reproduction | PA 0–10,000 ft; OAT -51 to +52 °C with sparse hot/high regions | **Gap identified.** AFM reproduction shows altitude topology extending beyond 10,000 ft, including an upper chart region to 15,000 ft. Authoritative Section V page required before extension. |
| V1 · Flaps 8° | CL-102B P-8 thru P-11 | PA 0–10,000 ft; OAT -18 to +38 °C; GW 10,000–18,300 lb; sparse high/hot cells | **Gap identified.** AFM Fig. 5-26 reproduction shows an altitude panel through 14,000 ft. Authoritative AFM page required. |
| Takeoff Distance · Flaps 8° | CL-102B P-8 thru P-11 | Same coordinate envelope as V1 | **Gap identified.** AFM Fig. 5-25 reproduction shows altitude references through 14,000 ft and a separate altitude scale to 15,000 ft. Authoritative AFM page required. |
| V1 / Takeoff Distance · Flaps 20° | CL-102B P-14 thru P-17 family | Current encoded table envelope to 10,000 ft | **Not yet closed.** Applicable AFM Flaps 20 figures/pages must be identified and reviewed separately. |
| VR / V2 · Flaps 8° / 20° | Published weight schedules | GW 10,000–18,300 lb; weight-only | No altitude extension inferred. Endpoint/effectivity audit still required. |
| VREF | Published landing-speed schedule | GW 10,000–15,300 lb; weight-only | No altitude extension inferred. Endpoint/effectivity audit still required. |
| Factored Landing Distance · Flaps 40° | CL-102B P-56/P-57/P-58 | PA 0–10,000 ft; OAT -18 to +38 °C; GW 10,000–15,300 lb; sparse high/hot cells | **Gap identified.** AFM landing chart reproductions show altitude references through 14,000 ft. Authoritative AFM source pages required before extension. |

## Secondary-source locator evidence

The FlightSafety Learjet 35/36 Pilot Training Manual reproduces the following AFM figures and is useful for locating the authoritative source pages:

- AFM Figure 5-14, page 5-25 — Takeoff Thrust Setting, anti-ice OFF, standard nozzle. The reproduced chart includes pressure-altitude labeling below sea level and an upper region extending to 15,000 ft.
- AFM Figure 5-25, page 5-40 — Takeoff Distance, Flaps 8°. The reproduced chart shows altitude references through 14,000 ft and a separate altitude scale to 15,000 ft.
- AFM Figure 5-26, page 5-41 — Critical Engine Failure Speed V1, Flaps 8°. The reproduced chart shows altitude references through 14,000 ft.
- AFM Figure 5-49, page 5-66 — Landing Weight Limit, anti-ice OFF. The reproduced chart shows altitude references through 14,000 ft.
- AFM Figure 5-52, page 5-69 — Actual Landing Distance. The reproduced chart shows altitude references through 14,000 ft.

These reproductions are **evidence of a likely wider approved chart envelope, not authorization to transcribe new operational rows**.

## Required source closure

Before any dataset extension is committed, obtain and verify the applicable approved AFM/AFMS chart page(s), including effectivity/configuration.

Priority:

1. FM-102 Fig. 5-14 / p. 5-25 — standard-nozzle Takeoff N1.
2. FM-102 Fig. 5-25 / p. 5-40 — Flaps 8 Takeoff Distance.
3. FM-102 Fig. 5-26 / p. 5-41 — Flaps 8 V1.
4. Applicable Flaps 20 V1 / Takeoff Distance figures.
5. FM-102 Fig. 5-49 / p. 5-66 — Landing Weight Limit.
6. FM-102 Fig. 5-52 / p. 5-69 — Actual Landing Distance / factored-distance relationship as applicable.

## Data-authoring rules after source closure

- Digitize only values/geometry actually supported by the applicable approved chart.
- Preserve configuration and effectivity.
- Preserve sparse / irregular chart boundaries.
- Do not fill missing high/hot cells merely to make a rectangular grid.
- Bounded interpolation is allowed only inside complete published support regions.
- Never use the last two table points to extrapolate beyond the source.
- Do not silently convert ACTUAL landing distance into FACTORED distance unless the applicable source explicitly defines and authorizes that relationship for the intended dataset.
- Add boundary and seam tests before enabling expanded operational coverage.

## Acceptance plan

For every expanded dataset:

1. exact source-node tests;
2. bounded interpolation inside complete source cells;
3. exact lower/upper boundary tests;
4. just-inside and just-outside boundary tests;
5. sparse-corner fail-closed tests;
6. interpolation-seam continuity checks;
7. source/effectivity/provenance assertions;
8. full repository Node suite;
9. production build;
10. desktop/mobile/iPad Playwright acceptance.

## Current conclusion

The current 10,000-ft table limits are not automatically the final AFM limits for all performance metrics. A real source-envelope gap exists. However, the authoritative Section V pages needed to extend those datasets are not present in the currently available FM-102 copy, so the correct state is **source-closure blocked**, not “extrapolate from the current table.”

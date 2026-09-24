# B6 — Takeoff Wind Correction Source Contract

**Status:** Final acceptance in progress  
**Branch:** `feat/b6-takeoff-wind`  
**Roadmap:** `ROADMAP.md` B6

## Purpose

B6 adds wind correction only as a governed post-baseline transform. The existing CL-102B takeoff datasets remain the zero-wind baseline and must not be rewritten to include weather.

Canonical topology:

```text
zero-wind Takeoff Distance + signed runway wind component
  -> corrected Takeoff Distance

zero-wind V1 + signed runway wind component
  -> corrected V1
```

VR, V2 and N1 are not wind-corrected by B6.

## Confirmed source behavior

### Signed wind convention

The AFM chart wind panel is explicitly drawn:

- `-10 kt` on the **TAIL** side;
- `0 kt` at the reference line;
- positive values on the **HEAD** side through `+30 kt`.

FlyTally therefore uses the existing signed runway component convention:

- headwind = positive;
- tailwind = negative.

No absolute-value conversion is permitted.

### Do not pre-factor the wind component

FlightSafety Chapter 20 states that the graphical wind corrections use tower winds and already incorporate the regulatory treatment of **50% of headwind** and **150% of tailwind** components.

Therefore the B6 transform input is the actual signed runway wind component derived from APPLIED weather and runway heading. The runtime must **not** multiply the input by 0.5/1.5 before entering the chart-derived transform; doing so would apply the regulatory factor twice.

### Flaps 8 — direct graphical source available

FlightSafety Learjet 35/36 Pilot Training Manual, Chapter 20 reproduces the applicable Gates Learjet 35A/36A AFM charts:

- Figure 20-2 / AFM Figure 5-25, page 5-40 — **Takeoff Distances, Flaps 8°**;
- Figure 20-3 / AFM Figure 5-26, page 5-41 — **Critical Engine Failure Speed V1, Flaps 8°**.

Both charts contain the wind correction panel after the zero-wind reference line.

The transform is baseline-dependent. It is not a single fixed percentage or fixed knot delta.

### FlightSafety worked-example acceptance point

The older Learjet 30 Series Pilot Training Manual uses:

- OAT: 60°F;
- pressure altitude: 1,300 ft;
- takeoff weight: 15,000 lb;
- wind: 15 kt headwind;
- flaps: 8°.

The worked example reads:

- corrected V1: **118 KIAS**;
- corrected takeoff field length: **3,400 ft**.

The current B8 zero-wind distance runtime already resolves the same baseline condition independently at about 3,699.5 ft. B6 must apply the wind transform after that baseline and reproduce the source example within chart-reading precision.

## Source extraction rules

1. Digitize the wind panel independently from the zero-wind PA/OAT/weight grid.
2. Preserve explicit zero-wind identity rows.
3. Preserve headwind and tailwind branches separately; do not assume symmetry.
4. Store only values that can be supported by the chart.
5. Use bounded interpolation inside the published source envelope only.
6. If a required source corner is unavailable, return unsupported.
7. Never extrapolate beyond the chart wind envelope.
8. Re-check the high baseline-distance region around 8,000–10,000 ft before publishing data because upper tailwind lines approach/leave the chart envelope.
9. The source-derived corrected output must use the same physical unit as its baseline axis.

## Flaps 20 — publication blocker

CL-102B provides the governed zero-wind Flaps 20 V1 and takeoff-distance baseline used by the current calculator. The available FlightSafety Chapter 20 reproduction, however, shows the graphical correction examples for Flaps 8.

Do **not** bind the Flaps 8 wind transform to Flaps 20 merely because the correction panels appear generic.

B6 Flaps 20 support remains fail-closed until the applicable AFM Flaps 20 graphical correction source is directly verified. If the verified Flaps 20 chart proves the correction geometry is identical, that equivalence must be recorded explicitly in the dataset provenance/notes.

## Runtime contract

B6 introduces a generic governed calculator kind:

```ts
{
  kind: "post-baseline-transform",
  operation: "takeoff",
  baselineAxisKey: "...",
  modifierAxisKey: "...",
  outputKey: "..."
}
```

Contract invariants:

- exactly two distinct axes;
- exactly one corrected output;
- baseline-axis and corrected-output units agree;
- exact source rows or bounded interpolation only;
- runtime contains no Learjet-specific formulas.

## B6.1 implementation status

Verified Flaps 8 source grids are now encoded as governed datasets:

- `takeoff-distance-wind-flaps8.json` — graph-digitized distance correction, 100 ft source-reading resolution;
- `v1-wind-flaps8.json` — graph-digitized V1 correction, 1 KIAS source-reading resolution.

The datasets include explicit zero-wind identity nodes and intentionally sparse source regions where the graphical envelope does not support a stored corner. The generic runtime must fail closed in those regions.

Flaps 20 remains intentionally unpublished until its applicable AFM graphical correction source is directly verified.

## B6.3 canonical operation integration status

The draft branch now wires the verified transform into the canonical Takeoff operation:

- APPLIED METAR observation supplies the signed runway wind component;
- calm wind resolves explicitly to 0 kt;
- variable wind without a usable direction remains unavailable rather than guessed;
- the operational component is rounded to 0.1 kt for snapshot identity and calculation stability;
- corrected V1 and Takeoff Distance are persisted in Snapshot V2;
- Snapshot V2 stores the derived runway wind component and invalidates independently on wind drift;
- manual QNH/OAT overrides no longer discard the APPLIED observation, because that observation independently owns runway-wind provenance;
- the Takeoff calculator source identity is bumped to `takeoff-summary-wind-v1`, so pre-B6 snapshots cannot silently remain current;
- Flaps 20 with exactly 0 kt wind may continue to use its governed zero-wind baseline, while any nonzero wind fails closed until a verified Flaps 20 correction source exists.

The canonical integration passed its targeted local acceptance on 2026-09-24: typecheck PASS and **81/81** targeted Node tests PASS on head `221097dd9ee46d7f49edfe9faecbac0b069eccbc`.

A subsequent compatibility review hardened the declaration boundary:
- aircraft/flap configurations with no `windCorrection` declaration preserve their existing governed baseline and do not suddenly require wind;
- Learjet Flaps 20 now explicitly declares an empty wind-correction boundary, so zero wind may use the governed baseline while nonzero/unknown wind remains fail-closed pending direct source verification.

That compatibility hardening and the new deterministic browser acceptance are pending the final B6.4 gate.

## B6.4 browser acceptance

The browser-only CI aircraft now includes a dedicated opt-in `8-wind` flap fixture with deterministic V1 and Takeoff Distance post-baseline transforms. Existing default browser performance remains uncorrected, proving backward compatibility for aircraft that do not declare a wind-correction contract.

The Playwright acceptance:
- injects deterministic APPLIED LKPR METAR wind;
- calculates wind-corrected V1/TOD while N1/VR/V2 remain unchanged;
- verifies Snapshot V2 stores `runwayWindComponentKt` and both wind dataset IDs;
- reloads with a newer AVAILABLE METAR and confirms the stored result does not silently change;
- exercises explicit **Apply & recalculate** and verifies the corrected outputs update;
- runs across desktop, mobile, iPad landscape and iPad portrait projects.

## Acceptance before operational integration

Source/data gate:

- multiple exact source nodes on tailwind, zero-wind and headwind branches;
- explicit zero-wind identity across multiple baseline ordinates;
- high-distance sparse-edge checks;
- FlightSafety 15-kt-headwind worked-example cross-check.

Runtime gate:

- generic contract validation;
- exact-node evaluation;
- bounded interpolation;
- independent headwind/tailwind tests;
- fail-closed outside baseline or wind envelope.

Only after these pass should the correction be wired into the canonical Takeoff operation snapshot and UI.

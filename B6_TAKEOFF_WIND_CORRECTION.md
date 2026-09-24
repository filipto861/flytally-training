# B6 — Takeoff Wind Correction Source Contract

**Status:** Source extraction in progress  
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

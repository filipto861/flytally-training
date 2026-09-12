# M38 — Performance Calculator MVP

M38 replaces the primary generic performance-table browsing experience with a pilot-oriented EFB-style Takeoff / Landing calculator while preserving all published reference data behind progressive disclosure.

## Safety boundary

The currently published Training performance payload does not contain a complete digitized AFM dry takeoff/landing chart grid. M38 therefore does **not** reconstruct, approximate or invent that chart logic.

The pilot enters the corrected dry takeoff field length or dry landing distance obtained from the controlling approved/source chart. FlyTally then applies only correction factors that are explicitly present as exact published dataset rows.

- no nearest-row substitution;
- no hidden interpolation of correction factors;
- no extrapolation;
- unsupported source conditions fail closed;
- source notes and provenance remain available;
- the result is a training aid, not a substitute for approved aircraft/operator performance documentation.

## Takeoff

The calculator can use an exact published takeoff-weight row and runway/configuration correction factor. It returns:

- corrected takeoff field length;
- applied factor;
- margin against entered TORA/available runway;
- percentage of entered runway used.

When a source distinguishes configuration in its output columns (for example wet runway flap configuration), the UI presents that distinction explicitly.

## Landing

The calculator applies an exact published runway-surface landing factor to the pilot-entered dry baseline and returns:

- corrected landing distance;
- applied factor;
- margin against entered LDA;
- percentage of entered runway used;
- exact stored VREF/VAPP for a selected source-table landing weight when available.

Temperature-limited source factors fail closed if required OAT is absent or outside the published boundary.

## Architecture

`lib/performance-calculator.ts` discovers calculator capabilities from the shape of the aircraft's published performance datasets. It contains no aircraft ID or aircraft-specific branch. Aircraft without a compatible correction table simply expose only the dry baseline calculation rather than receiving invented behavior.

The existing generic `PerformanceExplorer` remains unchanged and is available only under **Reference data & other performance tables**.

M38 is UI/runtime only. It requires no database migration and no content promotion.

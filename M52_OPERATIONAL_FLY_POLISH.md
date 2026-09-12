# M52 — Operational Fly polish

M52 tightens two cockpit workflows without adding another Fly tool.

## Whole-checklist reset

The operational checklist now exposes a separate `Reset all` action in overall progress. It uses a deliberate two-step `Reset all` → `Confirm all` interaction, clears every completed item, returns to the first phase and persists the clean state through the existing offline/localStorage path. The existing current-phase reset remains available.

## Bounded performance interpolation

Fly now applies bounded software interpolation to compatible source-backed runway-distance grids. The policy is operational and does not rewrite or relabel the governed source dataset. The existing generic interpolation engine remains responsible for the calculation and therefore:

- uses exact published rows unchanged when inputs land on a source point;
- linearly/bilinearly interpolates only between complete surrounding published rows;
- never interpolates categorical runway surface values;
- refuses a calculation if any required bounding row is missing;
- never extrapolates outside the published altitude / ISA-deviation envelope.

The Fly result explicitly says `Published table value` for an exact source row or `Interpolated between published rows` when software interpolation was used.

## Architecture boundary

No aircraft identifier or aircraft-specific formula is introduced in either feature. Reset is generic to any runtime checklist, and interpolation is generic to any compatible native runway-distance grid. Reference/source policy remains unchanged outside the operational Fly calculation path.

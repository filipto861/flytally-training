# v3.1 M2B1 — Declarative factor and metric runtime

M2B1 removes the next layer of Learjet-shaped semantics from the performance engine.

## Declarative factor execution

A `distance-factor` dataset now executes entirely from its governed calculator contract:

- the baseline selection and factor come from data,
- correction options may be fixed factors or output-backed source values,
- lookup axes are explicitly bound and remain exact-row only,
- axis-backed condition tables use declared condition/factor keys,
- applicability constraints use declared external inputs and lte/gte limits,
- no declared factor is interpolated or extrapolated.

The old `wet8` / `wet20` / `compactedSnow` / `wetIce` conventions remain only in the migration fallback for already-published pre-v3.1 content.

## Declarative metric lookup

A `metric-lookup` dataset now returns generic labeled/unit-bearing result metrics from an exact source row. The runtime does not need `weight`, `vref` or `vapp` field names.

The existing landing UI still projects legacy `vref`/`vapp` when those keys exist. M2B2 will render generic metrics directly.

## Validation hardening

Publication now rejects declarative factor/metric datasets with unbound axes. This prevents a new aircraft from publishing a calculator contract that the runtime could only partially evaluate.

## Next

M2B2 moves all operational labels, units, generic metrics and constraint inputs into governed rendering metadata and converts Weight & Balance authoring/display units to a declarative boundary.

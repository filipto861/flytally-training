# v3.1 M2B2 — Declarative operational UI and W&B units

## Performance UI

Governed v3.1 calculator datasets now use one shared declarative workspace in both the full learner Performance page and the compact Fly deck.

The UI reads labels, units, selectors, exact lookup axes, constraint inputs and generic result metrics directly from the published calculator contract. A new aircraft therefore does not inherit fixed `ft`, `lb`, `KIAS`, `VREF`, `VAPP` or runway-condition vocabulary from the reference aircraft.

Runway-grid result labels and units are taken from the bound outputs. Distance-factor baseline/runway inputs and generic metric outputs use their own governed metadata. Fly state remains persisted per aircraft + variant.

Already-published pre-v3.1 datasets deliberately stay on the legacy adapter until they are explicitly republished with calculator metadata.

## Unit safety

Publication fails closed if a declared runway grid mixes incompatible units across ground-run / obstacle-distance / available-runway values, or mixes temperature/deviation units that the current arithmetic cannot safely combine. Distance-factor baseline and available-runway units must likewise agree.

This does not add implicit conversion or extrapolation.

## Weight & Balance

W&B content may now declare pilot/source-facing units for:

- mass,
- arm,
- moment,
- fuel volume.

Each declares a positive `fromNormalized` conversion factor and optional display precision. Internal source-of-truth calculations remain normalized to kg, mm, kg·mm and litres.

Pilot-entered loading is converted from the declared display unit back to normalized values before mass, moment and CG calculations. Results, envelope limits, station limits and validation messages are converted back to the aircraft's declared presentation units.

Legacy payloads omit the unit block and retain the existing SI behavior.

## Remaining M2 closure

M2C will extend the disposable PostgreSQL no-code acceptance harness with a non-Learjet performance vocabulary and non-SI W&B presentation. Passing that path will prove that these contracts survive the real governed database publication/read-back boundary before v3.1 moves to Studio hardening.

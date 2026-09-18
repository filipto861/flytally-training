# v3.1 M2 — Generic operational calculator contracts

## M2A — declarative performance semantics ✅

Performance datasets may now declare an explicit flight phase plus a typed `calculator` contract. Dataset field names remain aircraft-owned vocabulary. Generic runtime code consumes declared bindings instead of requiring names such as `airportAltitudeFt`, `surface` or `distance50ftM`.

M2A introduces three calculator contract families:

- `runway-distance-grid` — explicit altitude / ISA-deviation / surface axes and source-temperature / ground-run / obstacle-distance outputs,
- `distance-factor` — explicit baseline/runway inputs plus either output-backed or axis-backed factor selection and optional governed constraints,
- `metric-lookup` — an explicit lookup axis and one or more result outputs.

The publication validator fails closed if a calculator references an axis or output that the dataset does not actually publish. Dataset `phase` and calculator `operation` must also agree.

The generic runway-distance calculation path already consumes the new bindings, so a second aircraft can use arbitrary dataset keys without source-code changes. Existing published pre-v3.1 datasets remain readable through a deliberately isolated compatibility mapping until their governed payloads are republished with explicit metadata.

The Performance Explorer prefers declared phase metadata and falls back to historical title/id inference only for pre-v3.1 content.

## Safety boundary retained

No change weakens the existing performance rules:

- source rows remain authoritative,
- interpolation is performed only when the governed dataset explicitly enables `linear-explicit`,
- every bounding source row must exist,
- extrapolation remains prohibited,
- source provenance remains attached to the governed dataset.

## M2B remaining work

M2 is not complete yet. The next slice will:

1. execute declared `distance-factor` and `metric-lookup` contracts without hard-coded factor/speed field names,
2. render operational labels and units from governed metadata rather than fixed ft/lb/m/KIAS copy,
3. move temperature and similar applicability limits into declared constraints,
4. make Weight & Balance source/display units declarative while preserving normalized calculation safety,
5. extend no-code acceptance with a non-Learjet-shaped performance vocabulary.

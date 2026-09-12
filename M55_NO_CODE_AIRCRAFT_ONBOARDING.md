# M55 — No-code aircraft onboarding

M55 closes the remaining gap between the governed PostgreSQL content architecture and day-to-day aircraft onboarding. A new aircraft can now be configured, scoped and authored through Training administration without adding aircraft-specific React or Next.js code.

## Aircraft and configuration data

Aircraft identity remains stored in `training_aircraft_types`. Administrators can edit the display name, manufacturer and model from Aircraft settings.

Configuration variants remain optional. Draft aircraft can define variant profiles with:

- a stable variant key,
- a human-readable display name,
- explicit equipment tags,
- an optional configuration note.

The learner repository already reads these profiles from PostgreSQL. Runtime applicability therefore uses only configured data and never infers equipment from an aircraft or variant name.

Variant/equipment configuration is frozen once the aircraft catalogue entry is published. This prevents a configuration edit from silently changing the applicability of already released learner content. A future controlled configuration-revision workflow can extend this boundary if live-aircraft reconfiguration is needed.

## Structured applicability authoring

Modern structured starter payloads now expose optional applicability fields wherever the runtime supports them:

- checklist phases and items,
- procedures,
- performance datasets,
- limitation items,
- systems,
- flows,
- avionics topics,
- knowledge questions,
- abnormal/emergency scenarios and stages.

Each block can target registered variants and/or explicit equipment tags using `variants`, `equipmentAllOf`, `equipmentAnyOf` and `equipmentNoneOf`. Empty lists mean common content. Weight & Balance remains unchanged because its current content contract does not expose the universal applicability object.

The new-module composer shows the exact registered variant keys and equipment tags alongside the editor so authors do not need to discover configuration identifiers in source code or raw database data.

## Release integrity

The M43 variant integrity boundary is preserved and extended. Approval and publication now fail closed when a governed payload references either:

- an unregistered variant key, or
- an unregistered equipment tag.

This prevents spelling mistakes or invented equipment identifiers from silently making source-backed content disappear at runtime.

## Non-goals

M55 does not make every training domain mandatory, does not infer missing aircraft modules, does not add aircraft-specific code, and does not change learner calculations or Fly behavior. Sparse aircraft remain valid: only genuine source-backed modules need to exist.

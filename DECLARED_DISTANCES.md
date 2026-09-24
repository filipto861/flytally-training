# Runway Declared Distances

**Status:** Contract hardening in progress  
**Branch:** `feat/declared-distance-contract`

## Purpose

Freeze a generic, source-safe runway declared-distance boundary before Partial Power / Reduced Thrust Takeoff is allowed to consume runway availability.

The bundled airport dataset currently provides physical runway surface geometry only. Physical surface length is useful context, but it is not a declared TORA, ASDA, TODA or LDA.

## Generic contract

`lib/aviation/declared-distances.ts` defines four declared-distance identities:

- TORA — Takeoff Run Available;
- ASDA — Accelerate-Stop Distance Available;
- TODA — Takeoff Distance Available;
- LDA — Landing Distance Available.

Each declared distance carries its own provenance:

- `manual` — explicitly entered by the user;
- `provider` — supplied by a future authoritative provider with provider identity/revision.

The contract deliberately does not infer declared distances from:

- physical runway surface length;
- displaced-threshold geometry;
- runway identifier;
- airport identity;
- another declared-distance field.

## Learjet 35/36 takeoff constraint

For the source topology used by the Learjet 35/36 takeoff field-length data:

`usableTakeoffFieldLengthFt = min(TORA, ASDA)`

Both TORA and ASDA are mandatory.

Fail-closed behavior:

- missing TORA -> no takeoff declared-distance solution;
- missing ASDA -> no takeoff declared-distance solution;
- TODA does not replace either field;
- LDA does not participate in takeoff;
- non-positive or non-finite values are invalid;
- provider provenance must carry an explicit provider ID.

This contract does not yet enable Partial Power calculation.

## Why this remains separate from physical runway context

`SelectedRunwayContext.surfaceLengthFt` remains the physical surface length from the bundled OurAirports snapshot. It may continue to be displayed as runway context.

The Partial Power solver must consume only the explicit declared-distance contract. It must never read `surfaceLengthFt` as a fallback.

## Next implementation steps

1. Add operation-owned manual TORA/ASDA inputs without making them mandatory for existing full-rated Takeoff.
2. Preserve provenance and input identity for calculations that explicitly depend on declared distances.
3. Add a provider adapter boundary for future authoritative declared-distance data.
4. Only then enable the Partial Power assumed-temperature solver.

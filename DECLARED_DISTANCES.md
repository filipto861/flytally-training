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

## Operation-owned manual input status

The Takeoff operation now owns optional manual **TORA** and **ASDA** fields.

Important boundary:

- existing full-rated Takeoff does **not** require either field;
- changing/selecting a different runway clears the manual declared distances;
- current full-rated Snapshot V2 does not persist or depend on TORA/ASDA because that calculation does not consume them;
- the UI displays the resolved declared takeoff limit only when both fields are present and valid;
- physical runway length remains display/context only.

## Next implementation steps

1. Validate the generic contract + operation-owned input boundary locally.
2. Add a provider adapter boundary for future authoritative declared-distance data.
3. When Partial Power is introduced, persist TORA/ASDA provenance and identity only in calculations that actually consume those inputs.
4. Only then enable the Partial Power assumed-temperature solver.

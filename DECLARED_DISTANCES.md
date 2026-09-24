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

## Provider adapter boundary

A provider-neutral adapter is now defined in `lib/aviation/declared-distance-provider.ts`.

The adapter requires an explicit airport/runway query identity and refuses to bind a payload for a different airport or runway. Provider responses may be complete or partial; missing ASDA/TORA stays missing and is never synthesized from another declared-distance field or from physical runway geometry.

Provider payloads preserve:
- provider ID;
- optional provider revision;
- airport ICAO;
- runway identifier;
- individual TORA/ASDA/TODA/LDA values.

Invalid values or provenance fail closed through the same generic declared-distance validator.

No live authoritative provider is connected by this phase.

## Acceptance status

Local contract acceptance on 2026-09-24:
- `npm run typecheck` PASS;
- declared-distance/provider/operation/runway/B4 targeted suite **31/31 PASS**.

A responsive browser acceptance is now staged to verify that:
- TORA/ASDA remain optional for existing full-rated Takeoff;
- `min(TORA, ASDA)` is presented correctly;
- the current full-rated result remains unchanged;
- the current full-rated Snapshot V2 does not persist declared distances it did not consume;
- selecting a different runway clears the manual TORA/ASDA values.

## Next implementation steps

1. Complete the targeted browser/build gate.
2. Close the declared-distance hardening PR.
3. When Partial Power is introduced, persist TORA/ASDA provenance and identity only in calculations that actually consume those inputs.
4. Only then enable the Partial Power assumed-temperature solver.

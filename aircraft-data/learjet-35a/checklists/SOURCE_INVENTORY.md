# Learjet 35A/36A Normal Checklist Source Inventory

## Purpose

Source inventory for roadmap item **15.3b CHECKLIST fast path**.

This file is an extraction/audit aid only. It is not itself published operational content. The final universal `checklists` payload must use registered governed source identities and pass the existing applicability, approval, freshness and source-authority gates before publication.

## Primary source

**Bombardier Learjet Model 35/36 Crew Checklist & Quick Reference Handbook, CL-102B, Change 2 (May 2008).**

Source boundary stated by CL-102B:
- applicable to Learjet Model 35 and 36 series aircraft, subject to page-level effectivity;
- checklist procedures are suggested/abbreviated and do not supersede the FAA-approved AFM;
- where there is a conflict, the FAA-approved AFM takes precedence.

For the operational CHECKLIST dataset, CL-102B is therefore treated as an operating-reference source, not as a replacement for AFM limitations or emergency authority.

## Normal Procedures phase inventory

| Universal phase candidate | CL-102B location | Notes / effectivity to preserve |
| --- | --- | --- |
| Exterior Preflight | N-2 | Normal checklist source; through-flight markers exist on selected items. |
| Cabin Preflight | N-4 | Normal checklist source. |
| Before Starting Engines | N-5 / N-5.1 | Separate pages for aircraft without vs with Rosemount pitot-static system. Do not merge the configuration-specific static-source wording blindly. |
| Starting Engines | N-8 | Normal checklist source; includes battery-voltage requirements and start sequence. |
| Before Taxi — Two Engine | N-9 | Keep separate from one-engine branch. |
| Taxi and Before Takeoff — Two Engine | N-9 | Includes takeoff-data review and configuration checks. |
| Before Taxi — One Engine | N-10 | Separate one-engine operating branch. |
| Taxi and Before Takeoff — One Engine | N-11 | Separate one-engine operating branch. |
| Runway Lineup | N-12 | Contains configuration/equipment-dependent thrust-reverser item. |
| After Takeoff | N-13 | Contains configuration/equipment-dependent thrust-reverser item. |
| Climb | N-13 | 10,000 ft and transition-altitude/18,000 ft checks. |
| Cruise | N-14 | Pressurization, fuel management, engine/system monitoring. |
| Descent | N-14 | Includes transition-level checks. |
| Approach | N-14 | Includes landing-data setup and Aeronca-specific indication item. |
| Before Landing | N-16 | Contains TR-4000 and FC-200 applicability-sensitive items. |
| Go Around | N-16 | Normal go-around sequence. |
| After Landing / Clearing Runway | N-17 | Contains TR-4000 applicability-sensitive item. |
| Shutdown | N-17 / N-18 | Procedure continues across the page boundary. |
| Quick Turnaround | N-18 | One- or no-engine-shutdown procedure; keep separate from the normal shutdown path. |

## Excluded from checklist digitization

**N-15 Landing Speeds and Distances** is performance/reference data, not a challenge-response checklist phase. Do not duplicate those values into the checklist payload. The existing governed Performance implementation remains the owner of calculated landing performance.

## Applicability/equipment mapping required before publication

The following source distinctions must be mapped to the aircraft configuration vocabulary already used by FlyTally before affected checklist items are published:

- Rosemount pitot-static system;
- TR-4000 thrust reversers;
- Aeronca thrust reversers / position indication;
- FC-200 autopilot;
- other explicit “if installed” qualifiers encountered during item-level extraction.

Do not infer these tags from aircraft names, simulator variants or serial-number guesses.

## Digitization rules

1. Preserve CL-102B challenge and response wording; do not rewrite operational actions for style.
2. Preserve source-defined order.
3. Preserve page/effectivity distinctions rather than collapsing mutually exclusive variants.
4. Represent warnings/cautions only when the source explicitly contains them.
5. Keep training explanations out of the operational fast-path projection.
6. Do not promote performance tables into checklist items.
7. Every phase/item in the final universal payload must carry a registered source reference.
8. Publication remains blocked until the canonical registered CL-102B manual/revision/source-reference IDs are confirmed and the item-level applicability mapping is complete.

## Next extraction batch

Begin with the configuration-common core:
- Cabin Preflight;
- Starting Engines;
- Runway Lineup common items;
- After Takeoff common items;
- Climb;
- Cruise;
- Descent;
- Approach common items;
- Go Around;
- After Landing common items;
- Shutdown common items.

Then add configuration-scoped items/branches after the equipment-tag mapping is verified.

# M41 — Universal Weight & Balance

M41 adds Weight & Balance as a first-class, governed aircraft module without introducing aircraft-specific source code.

## Content contract

A published `weight-balance` payload carries:

- exact empty-aircraft mass, arm and moment;
- source-backed loading stations and arms;
- per-station minimum/maximum constraints;
- fuel volume-to-mass density when fuel is entered by volume;
- takeoff and landing mass limits;
- a mass-indexed CG envelope;
- optional two-point CG display scale (for example `% MAC`);
- exact source references and normal governed version/source links.

The database domain column already accepts arbitrary text, so M41 needs no schema migration.

## Calculator behavior

The learner calculator computes each station as `mass × arm`, adds the published empty-aircraft moment, and derives CG as `total moment ÷ total mass`.

When a fuel-burn station is configured, the calculator evaluates both takeoff and planned landing states. Landing fuel cannot exceed takeoff fuel. Mass, station and CG-envelope limits fail closed.

Envelope limits may vary with mass. The calculator linearly evaluates the forward/aft boundary only between published envelope points and does not extrapolate beyond the encoded mass range.

## Product behavior

- Weight & Balance appears in the Reference area only when the aircraft has a published module.
- The aircraft home exposes it through Quick access when available.
- The Content Studio can create and review structured `weight-balance` drafts.
- The learner page contains no manufacturer/model-specific logic.
- Source/method details remain visible behind progressive disclosure.

## Safety boundary

This is a training/planning aid. The current aircraft weighing record and applicable operating documentation remain controlling. M41 never invents a missing loading station, arm, envelope point or fuel conversion.

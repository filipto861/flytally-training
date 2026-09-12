# M46 — Cockpit UX polish

M46 tightens the operational `Fly` experience without changing the publication-driven aircraft content model.

## Checklist

- Adds a compact overall checklist progress indicator.
- Highlights the next unchecked item in the active phase.
- When the pilot checks the expected next item, the next unchecked item is brought into view automatically.
- Auto-scroll respects `prefers-reduced-motion`.
- Completed phases remain visually distinct in the phase strip.
- Phase reset is now a two-step action (`Reset` → `Confirm`) to reduce accidental loss of in-flight progress.
- Touch targets and focus-visible states are strengthened for phone/tablet use.

## Performance

- Input controls use larger mobile touch targets.
- Focus states are clearer, including grouped value/unit inputs.
- Numeric results use tabular figures for faster scanning.
- The sticky result card retains the M45 mobile flight-deck behavior with stronger legibility.

## Offline status

`Preparing offline` now has a distinct visual state, while reduced-motion users do not receive the pulse animation.

## Boundary

M46 remains aircraft-agnostic. It adds no aircraft-specific values, explanations, training content, or duplicated source data.

# M50 — FlyTally brand + in-flight emergency quick reference

M50 continues the pilot-first simplification after M47–M49.

## Fly boundary

Fly is deliberately limited to three operational tools when source-backed data exists:

- Checklist
- Performance
- Emergency

No systems learning, procedure training, question bank, scoring, debrief, explanation or practice mode is rendered in Fly.

## Emergency presentation

The Emergency view is a QRH-style presentation layer over already-published abnormal/emergency content. It does not create, infer or rewrite aircraft procedures.

Only validated universal abnormal content is allowed into the in-flight view. It is filtered against the selected aircraft configuration before rendering. Legacy abnormal training without structured applicability remains available in Learn/Reference but is intentionally excluded from Fly.

The operational view shows procedure title, category/phase, applicable configuration note, published WARNING/CAUTION/NOTE notices, ordered stage labels, exact `expectedResponse` actions and compact source/authority details. Training-only setup, prompts, explanations, objectives, debrief, difficulty and time estimates are not rendered.

## FlyTally visual system

Training now imports a small shared-style layer based on the current FlyTally Logbook light design system:

- background `#f4f7fb`
- surface `#ffffff`
- text `#102033`
- muted `#66788d`
- border `#d5dee8`
- primary FlyTally green `#0b946e`
- secondary blue `#087fb8`

Navigation and normal operational selection use the FlyTally green language. Emergency remains deliberately distinct using the existing FlyTally danger semantics rather than recoloring the whole flight deck.

## Boundary

No aircraft-specific values, calculation logic, database schema, content publication rules or source text are changed by M50.

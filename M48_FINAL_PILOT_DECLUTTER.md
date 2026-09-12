# M48 — Final pilot declutter

M48 addresses the remaining high-friction items found while reviewing the live M47 production UI as a pilot.

## Fly

The 15-phase horizontal checklist strip was still a navigation layer competing with the checklist itself. It is replaced by one compact phase selector that:

- shows the current phase position,
- marks completed phases with a check,
- keeps arbitrary phase jumping available,
- preserves previous/next phase controls,
- preserves local progress and two-step reset protection,
- becomes sticky and touch-sized on mobile.

## Learn

Deep learner pages now use task names as their primary headings (`Systems`, `Procedures`, `Checklist training`) instead of repeating aircraft-specific source document titles that are already contextualized by the aircraft navigation.

Source-backed titles and content remain unchanged in the underlying published data; M48 only simplifies presentation hierarchy.

## Boundary

No aircraft-specific values, source content, database schema, performance logic or publication rules are changed.

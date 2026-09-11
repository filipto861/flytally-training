# M37 — Pilot-first UX

M37 reorganizes the normal learner-facing application around pilot tasks rather than the internal content-domain model.

## Primary mental model

Every aircraft has four primary destinations:

- **Home** — one recommended next action plus a small quick-access list;
- **Training** — systems, procedures, knowledge, avionics and workflow material;
- **Checklists** — normal and abnormal / emergency checklist material;
- **Reference** — Quick Reference, performance and limitations.

Progress and aircraft variant remain available as utilities, not primary navigation destinations.

## Interaction rules

- only the active task area exposes its module-level links;
- unpublished modules never appear;
- sparse aircraft remain valid and simply omit empty task areas;
- Quick Reference appears only when both performance and limitations are published;
- no aircraft-specific branch or label is hard-coded into the navigation;
- Aircraft Home does not repeat the complete module catalogue;
- source/governance metadata stays out of the primary pilot workflow while remaining preserved in governed content and module provenance;
- the global product header is reduced to product identity plus account actions.

## Aircraft library

The product entry screen is now a simple aircraft picker. Publisher, revision, repository and governance implementation details are intentionally not presented as primary information to a pilot.

## Scope

M37 is a learner UX/navigation change only. It does not change learner content, source authority, publication state, progress persistence or database schema.

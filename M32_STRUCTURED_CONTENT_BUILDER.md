# M32 — Structured Content Builder

## Objective

Make routine content maintenance a structured authoring task instead of a JSON-editing task while preserving the governed content lifecycle introduced in M8/M29/M31.

M32 is deliberately **aircraft-agnostic**. The builder edits the persisted payload shape and validates it against the same content contracts used by approval/publication. It contains no Learjet-specific branches and requires no aircraft-specific React component.

## Product boundary

The builder does not change governance:

`published/approved/draft version -> structured edit -> new immutable human draft -> validation -> human approval -> publish`

An existing content version is never mutated in place. Source-reference selection remains a separate governed relationship and is submitted with the new draft.

## M32 capabilities

- type-aware scalar editing for text, numbers and booleans;
- multiline editing for explanatory/operational fields;
- recursive object editing;
- structured arrays with add, duplicate, remove and reorder controls;
- sensible blank prototypes for the existing universal training-domain collections;
- performance rows generated from the currently defined axes/outputs when an empty dataset receives a new row;
- embedded source-family selection by human-readable source title rather than requiring the author to type a manual ID;
- live contract validation through `validateContentPayload`;
- serialized `payload` remains the only content value submitted to the existing governed server action;
- raw JSON remains available only as an advanced synchronized escape hatch and must be applied back into the builder before submission.

## Supported content model

Because the editor follows the payload tree instead of the aircraft identity, the same component works across the current content domains, including:

- Checklists
- Procedures
- Performance
- Limitations
- Systems
- Flows
- Avionics
- Knowledge
- Abnormal/emergency content
- legacy payloads still present during migration

Adding another aircraft that uses these contracts requires content/data only, not a new editor implementation.

## Safety and provenance

M32 does not turn a content payload into its own source of truth. Technical data must still be source-backed and reviewed. Duplicating a structured item is only an authoring convenience; copied `sources` and `applicability` fields remain visible and must be reviewed before the new draft is approved.

The advanced JSON editor cannot bypass validation, approval or publication gates. Server-side governance remains authoritative even when client-side validation reports a valid payload.

## Acceptance

M32 is complete when:

1. the normal review/edit path uses `StructuredContentBuilder` instead of asking for raw JSON;
2. the builder serializes the result into the existing `reviseVersionAction` path;
3. client-side contract feedback uses the same `validateContentPayload` rules as governance;
4. no aircraft-specific condition is introduced;
5. raw JSON is demoted to an advanced escape hatch;
6. TypeScript, unit/regression tests and the production build pass;
7. the production deployment remains operationally ready after merge.

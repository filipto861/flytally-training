# v3.1 M3 — Studio hardening

M3 makes the existing governed architecture practical for repeatable aircraft packages. The boundary is stricter than merely "possible without source-code changes": normal second-aircraft work should not require raw database edits or memorizing internal configuration identifiers.

## M3A — configuration authoring ✅

### Common equipment without fake learner variants

An aircraft can now register equipment that applies to every configuration even when the aircraft has no variants.

The persistence implementation uses one reserved internal configuration profile in the existing variant table. That profile:

- is never exposed as a learner-selectable variant,
- is filtered from admin variant counts and registered variant applicability,
- contributes its equipment tags to the aircraft's common equipment set,
- remains editable only while the aircraft catalogue entry is draft, exactly like variant configuration.

Learner applicability resolves equipment as:

`common aircraft equipment + selected variant-only equipment`.

No equipment is inferred from manufacturer, model or variant names.

### Applicability picker

Structured authoring now receives the registered variant profiles and the union of common + variant-specific equipment tags.

The four applicability arrays are no longer ordinary free-text collections in the structured editor:

- `variants`
- `equipmentAllOf`
- `equipmentAnyOf`
- `equipmentNoneOf`

They render as explicit selectable choices. Existing unknown identifiers remain visible as **unregistered** so an old draft can be repaired rather than silently losing scope. New authors no longer need to copy internal keys from another page.

The server-side governance boundary remains authoritative and still rejects unknown identifiers at approval/publication.

## M3B next

The next slice will remove the remaining need for raw JSON during normal operational module composition, especially:

- choosing/changing performance calculator contract shapes,
- configuring runway-grid / distance-factor / metric-lookup bindings,
- W&B setup helpers,
- source/reference setup ergonomics for a new aircraft package.

## M3 acceptance direction

Before M4, Studio must be able to create a realistic sparse aircraft package from profile → sources → references → configuration → modules → review → publication with raw JSON and direct database editing unused.

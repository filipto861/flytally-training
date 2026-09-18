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


## M3B — operational module composer ✅

M3B removes the normal need to shape performance and Weight & Balance payloads in the raw JSON escape hatch.

### Performance dataset behavior

Every performance dataset now has a governed Studio behavior selector:

- **Reference only** — table/reference data without a calculator,
- **Metric lookup** — exact source-row lookup with generic result outputs,
- **Runway distance grid** — takeoff/landing altitude + ISA + surface grid,
- **Distance factor** — source-backed runway correction factors.

Changing behavior creates a valid starter structure while preserving dataset identity, notes, sources and applicability. Calculator `kind` is managed by the behavior selector instead of being an arbitrary text field.

Calculator `operation` is synchronized with dataset `phase`; the user cannot accidentally leave those two governance fields contradictory.

Axis/output bindings use the keys that exist in the current dataset. Metric result outputs are chosen from the current published output inventory. Distance-factor selector behavior can be switched between named correction options and an axis-backed factor table.

Rows still use the existing **Sync row keys** action after axes or outputs change, preserving the explicit source-table authoring boundary.

### Weight & Balance setup

The W&B editor now provides normal controls for:

- station input type (mass vs fuel volume),
- fuel density field creation/removal when the station type changes,
- optional separate landing-mass limit,
- selecting the fuel-burn station from stations configured as fuel.

The normalized kg/mm/kg·mm/l calculation contract from M2 remains unchanged.

### Registered source references

Structured source arrays can now insert an exact reference directly from the aircraft's registered source library. Studio copies the governed manual family / chapter / section / page citation into the payload.

When such an exact registered citation is present in the payload, the builder also emits its reference ID into the governed draft form. This removes the previous two-step failure mode where an author could correctly cite a manual location in the payload but forget to link the same reference as version provenance.

Manual entry remains available as an advanced repair path, and server-side source-family/source-authority validation remains authoritative.

## M3C next

M3C will make package readiness explicit and prove one complete synthetic package through the same Studio-facing contracts: identity, common/variant equipment, source, exact reference, structured operational modules, review, publication and learner discovery — with no raw JSON or direct database authoring step.


## M3C — package readiness and Studio-only release gate ✅

M3C closes Studio hardening by making the whole package release boundary explicit and enforceable.

### Unrestricted applicability no longer needs raw JSON

The earlier starter representation used empty applicability arrays. Governance correctly rejects empty arrays when a restriction key is present, which meant common content could display a contract error until the author manually removed those fields.

Studio now represents **no restriction** as an empty applicability object. The four registered pickers are still always visible; selecting a variant/equipment rule adds the corresponding property, and clearing the final selection removes that property again.

This applies to Weight & Balance as well as all other scoped universal modules. Common content can therefore remain common through normal Studio controls.

### Shared package-release readiness

The new package readiness gate evaluates the current governed database state immediately before catalogue release:

1. at least one immutable controlled source revision,
2. at least one exact source reference,
3. at least one published genuine learner module,
4. every effective published payload still matches its current content contract,
5. every published applicability identifier still exists in the **current** aircraft variant/equipment configuration,
6. every effective published module has complete classified provenance and operational domains use operational source authority,
7. no unresolved stale-source review affects the effective package.

Draft/approved work is reported as a warning but does not invalidate an otherwise sound current release.

This matters because aircraft configuration remains editable until catalogue publication. A module that was valid when published can no longer slip into catalogue release after its required equipment tag or variant is removed.

### One gate in UI and server

The same readiness model is visible in:

- **Onboarding → Package gate**, with pass/block/waiting state for each check,
- **Aircraft Settings → Catalogue**, where the publish action is shown only when the package is ready,
- **server-side `publishGovernedAircraft`**, which re-evaluates readiness before the existing atomic catalogue update.

The UI is therefore explanatory; the server remains authoritative.

### Studio-only acceptance boundary

The normal Studio path now covers:

`aircraft identity → common/variant equipment → immutable source revision → exact source reference → structured module → applicability → provenance → review/approval → module publication → package readiness → catalogue publication`.

Raw JSON remains hidden under **Advanced tools** as a repair/contract escape hatch, not a required onboarding step. Admin pages do not author through direct SQL.

The disposable PostgreSQL no-code harness is extended so a future acceptance run must assert `packageReadiness.ready === true` before publishing the synthetic aircraft catalogue entry.

**M3 status: complete.**

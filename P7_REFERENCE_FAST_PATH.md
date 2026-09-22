# P7 — Reference / REF Fast-Path Inventory

**Phase:** P7.1  
**Status:** inventory / frozen-boundary contract  
**Branch:** `feat/redesign-p7-reference`

## 1. Frozen W3 contract

P7 owns only the existing `REF` slot. It must not change the frozen fast-path
information architecture:

```ts
fastPathTabs = ["checklist", "qrh", "perf", "ref"]
```

CHECKLIST, QRH and PERF are already functional and remain outside P7.

## 2. Existing reference surfaces

The repository already has three relevant reference surfaces:

1. `/reference` — capability-driven hub linking to canonical reference tools.
2. `/quick-reference` — combined published limitations + performance source
   rows when both domains exist.
3. `/limitations` — searchable, configuration-filtered published limitations.

There is also legacy `reference-knowledge` content with old quick-reference
groups. It remains readable for migration-era routes but is **not** promoted
into the new-shell REF fast path.

## 3. P7 source of truth

The new-shell REF fast path uses the existing governed universal
`limitations` domain.

Reasons:

- limitations are explicitly cockpit/reference data;
- applicability is already defined and configuration-filtered;
- provenance is already carried by group/item source references;
- PERF already owns operational performance lookup, so REF must not duplicate
  or invent performance calculations;
- no new reference content domain is required.

P7 may project published limitations into a presentation DTO. That DTO is not a
new content model and has no persistence or authoring lifecycle.

## 4. Reference-page convergence

When `FT_NEW_SHELL=true`, `/reference` should use the same limitations
presentation contract as REF while also linking to the canonical full tools
that actually exist for the aircraft.

Flag-off `/reference` remains unchanged until C4b.

`/quick-reference` and `/limitations` remain valid canonical deep links;
P7 does not delete or rewrite them.

## 5. Configuration and variant boundary

Reference data must be filtered only through the existing aircraft
applicability resolver. No model-name inference or aircraft-specific branch is
permitted.

The full `/reference` route uses the explicit selected variant from its query.
The fast path receives published reference content and aircraft configuration
metadata so it can resolve the current `variant` query client-side instead of
silently displaying data from another configuration.

Unknown variants fail closed to common/declared configuration behavior.

## 6. P7 sub-slices

### P7.2 — adapter / presentation contract

- governed universal limitations only
- preserve labels, values, units, conditions, notices and provenance
- no performance computation
- no legacy `reference-knowledge` promotion

### P7.3 — fast-path + full-page convergence

- replace the W3 REF placeholder
- use one shared presentation component for fast path and new-shell
  `/reference`
- preserve canonical full-route links
- preserve aircraft/variant query context

### P7.4 — acceptance

- deterministic limitations fixture
- Node guards
- four-project Playwright acceptance
- flag-off legacy reference remains available

## 7. Out of scope

- new reference content authoring model
- changes to PERF
- changes to QRH
- P6 Scenario/Debrief
- D0 Active Flight
- visual redesign beyond the minimum presentation needed for P7 function
- legacy retirement (C2/C4b)

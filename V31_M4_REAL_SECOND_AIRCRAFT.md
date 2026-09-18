# v3.1 M4 — Real second-aircraft onboarding

**Status: PASS — 2026-09-18**

M4 uses the real production aircraft already onboarded from the controlled BRISTELL LSA flight-manual package for S/N 809/2025 / OK-EUI 10. It is intentionally evaluated as data already present in the governed Training database rather than re-created as a duplicate aircraft.

## Real source identity

The controlled source package is the Czech **BRISTELL LSA Letová příručka**, document **LSA-LP-2-29-1-CZ**, base issue 12/2022 with revision 1 pages issued 04/2025.

The title page identifies:

- registration **OK-EUI 10**,
- serial number **809/2025**.

The aircraft-specific source identifies:

- engine **ROTAX 912 ULS 3**,
- three-blade hydraulically in-flight-adjustable **Woodcomp KW-21** propeller.

These facts are stored as governed aircraft configuration data, not learner runtime code.

## Production package evidence

Read-only inspection of **FlyTally Training Production / main** on 2026-09-18 found:

- aircraft id: `bristell-lsa`
- catalogue state: **published**
- explicit configuration variant: `sn809-2025`
- controlled source revisions: **3**
- exact registered source references: **42**
- effective published learner modules: **8**
- unresolved stale-source flags: **0**

Published domains:

- abnormal,
- checklists,
- knowledge,
- limitations,
- performance,
- procedures,
- systems,
- weight-balance.

Every effective published module has an explicit approval record and at least one governed version-source link. Current linked-source counts range from four to eleven per module.

The package therefore traverses the same immutable source → draft/version → approval → publication model used by the generic Studio lifecycle.

## Aircraft-specific configuration remains data

The S/N 809/2025 variant stores its equipment inventory in database metadata, including the installed engine, propeller and aircraft-specific equipment. Applicability in published payloads references the registered variant/equipment identifiers.

There is no static learner aircraft registration for this package.

A repository-wide search at M4 closure found no learner/core occurrence of:

- `bristell`
- `rotax-912-uls`
- `kw-21`
- `sn809-2025`
- `ok-eui`

The learner runtime continues to resolve the aircraft through the PostgreSQL catalogue, published-domain discovery, generic applicability and generic module/calculator boundaries.

## M4 result

The first structurally different real aircraft exists alongside the reference aircraft without an aircraft-specific React route, calculator implementation, applicability branch or static catalogue entry.

**M4 acceptance: PASS.**

## M5 entry condition

M5 will use this same production package. It must verify learner behavior rather than only governance/data presence:

1. aircraft discovery / Home,
2. Fly,
3. Learn,
4. Reference,
5. per-aircraft progress,
6. variant/equipment applicability,
7. sparse-domain behavior,
8. Performance and Weight & Balance runtime behavior.

The current BRISTELL performance payload predates v3.1 declarative calculator metadata for several datasets. M5 must explicitly identify which behavior still uses the legacy compatibility adapter and move only genuinely operational calculator datasets to the generic governed contract where necessary. No aircraft-specific runtime code is permitted.

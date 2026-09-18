# v3.1 M6 — Scale closure

**Status: PASS**

M6 asks a deliberately different question from M4/M5: after a real second aircraft has exercised the architecture deeply, does adding a **third sparse aircraft** still require application development?

The acceptance answer is **no**.

## Scale-proof package

The M6 fixture represents a third aircraft with:

- no variants,
- one controlled POH revision,
- one exact source reference,
- one genuine `systems` module,
- no Quick Start,
- no checklists,
- no performance,
- no W&B,
- no limitations,
- no abnormal module,
- no avionics,
- no flows,
- no knowledge module.

This is intentionally sparse. v3.1 requires missing domains to remain absent rather than forcing fake completeness.

## Existing Studio/content path only

M6 creates the Systems payload from the existing `createStructuredStarterPayload(..., "systems")` boundary and fills only source-backed content data.

The unchanged current contracts then prove:

1. the payload validates through the universal Systems contract,
2. generic repository discovery reports only `systems`,
3. the Home capability model exposes Learn but not Fly or Reference,
4. the Studio onboarding model reaches `ready` with one genuine published module,
5. the shared package-readiness model reaches 100% when source/provenance/applicability/freshness facts pass.

No third-aircraft code path, route, calculator or static catalogue registration exists.

## Strong implementation criterion

The M6 implementation itself adds **no production learner/runtime behavior**. The closure change set consists of:

- this evidence document,
- a scale-closure regression test,
- the roadmap update.

There is no new aircraft handling in `app/`, `components/` or production `lib/`.

That is the intended end-state of multi-aircraft scale: once the generic architecture exists, another sparse aircraft is a governed content/admin task.

## v3.1 result

Across v3.1:

- M1 audited and isolated the real semantic coupling,
- M2 made operational calculators and W&B aircraft-agnostic and proved PostgreSQL read-back,
- M3 made Studio configuration/composition/release repeatable,
- M4 proved a real structurally different production aircraft exists entirely as governed data,
- M5 proved that real package through the learner/runtime boundaries and corrected the one generic Flight Deck metadata defect it exposed,
- M6 proves the third-aircraft path needs no new product/runtime implementation.

**v3.1 Multi-aircraft Product Scale: PASS.**

The next release track is **v3.2 — Learjet Performance**, using the demanding reference aircraft to deepen the generic performance engine without undoing the multi-aircraft boundary.

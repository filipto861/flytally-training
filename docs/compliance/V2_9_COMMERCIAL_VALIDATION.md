# FlyTally Training v2.9 — Commercial & External Validation Boundary

Status: implementation in progress  
Canonical commercial launch gate: FlyTally Logbook.

## C1 boundary

FlyTally Training does not maintain a second launch-stage or legal-clearance truth source.

The canonical v2.9 commercial-readiness contract lives in FlyTally Logbook, which owns the canonical legal centre. Training continues to link to that centre through `NEXT_PUBLIC_FLYTALLY_LEGAL_URL`.

This avoids a split-brain state where Logbook could be private beta while Training independently claims a commercial or regulator-validated status.

## Training-specific external gates

The shared commercial gate includes a mandatory Training source/publication-rights review. That gate is distinct from Training's technical content approval workflow:

- draft/review/approve/publish proves the content passed FlyTally's governed technical workflow;
- source authority proves the material is operationally appropriate for the configured aircraft and use;
- neither one proves copyright, NDA, licence or derivative-publication rights.

A source-derived content set must therefore not be treated as commercially publishable merely because it is technically published in Training.

## C3 — Shared entitlement boundary

C3 introduces a provider-agnostic entitlement contract without choosing prices, plans or a payment provider.

Logbook remains the entitlement authority. Its short-lived FlyTally identity assertion now carries a signed entitlement snapshot (identity contract `ft2`). Training validates that snapshot, persists it into its own signed session and requires an active `training.access` grant before issuing or accepting learner access.

The contract supports time-bounded grants so an expired entitlement cannot survive only because a Training session cookie has a longer lifetime.

Rollout is backward-compatible: legacy `ft1` identity assertions and pre-C3 Training sessions retain their existing private-beta access until normal expiry. New sessions use the entitlement-bearing contract. The legacy fallback is a migration aid only and must be removed or explicitly closed before C6 can authorize a commercial launch.

Training does not know or care which commercial provider created a durable grant. Provider, organization and manual-grant decisions remain on the canonical Logbook side.

C3 deliberately does **not** introduce prices, paid aircraft packs, checkout, card storage or a public-content paywall.

## C4 — Signature and regulatory validation boundary

The canonical C4 assurance taxonomy and authority-validation state live in FlyTally Logbook and its public legal centre. Training does not maintain a parallel approval truth source.

Training must not claim EASA, ÚCL, LAA ČR, manufacturer or operator approval unless an actual approval and its exact scope are recorded and reflected through the shared v2.9 validation process.

QES is a reviewed strategy decision, not a presumed requirement. Existing FlyTally account attestations, in-person signature captures and server HMAC evidence must not be relabelled as advanced or qualified electronic signatures.

Training-specific manufacturer/source approval remains distinct from aviation-authority acceptance. A manufacturer review of aircraft training content would not automatically make FlyTally an authority-approved training organisation or approved logbook.

C4 remains fail-closed for commercial launch until the shared regulatory evidence version is explicitly committed after external validation.

## C5 — Brand & public claims boundary

The canonical C5 registry and trademark/marketing-claim evidence state live in FlyTally Logbook and the shared legal centre. Training links directly to that public policy rather than keeping a second trademark truth source.

Training may describe itself as **Source-backed aircraft training** or a **Source-backed training and reference aid** only while published learner content preserves the governed source/provenance boundary. Those descriptions do not mean manufacturer, operator or aviation-authority approval.

Training must not market a technically published aircraft package as manufacturer-approved, EASA/ÚCL/LAA-approved, official, fully compliant or otherwise externally endorsed merely because its source and human review gates passed.

The FlyTally name is used as the product brand, but Training must not add a registered-trademark claim or the `®` symbol unless the shared C5 evidence state later permits it.

C5 remains fail-closed for commercial launch until the canonical trademark/brand decision, marketing-claims review and matching external evidence are recorded.

## Planned v2.9 continuation

- C2 — consume the final externally reviewed shared legal/commercial surface.
- C3 ✅ — consume the shared signed entitlement contract without aircraft-specific or provider-specific code.
- C4 ✅ — consume the shared signature assurance / regulatory-validation boundary and keep manufacturer, authority and QES claims separate; external validation evidence remains pending.
- C5 ✅ — consume the shared brand/claims policy, keep source-backed wording scoped and prohibit unsupported trademark/manufacturer/authority claims; external evidence remains pending.
- C6 — participate in the shared commercial release audit.

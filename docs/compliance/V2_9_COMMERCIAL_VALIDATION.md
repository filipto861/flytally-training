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

## Commercial access model

C1 deliberately does not introduce subscriptions, paid aircraft packs, entitlements or a public-content paywall.

Those decisions belong to v2.9 C3 after the shared business model is chosen. Until then:

- current Training authentication/progress behavior remains unchanged;
- learner data remains private;
- currently published reference content keeps the v2.8 technical access behavior;
- no new commercial-access claim is inferred from that behavior.

## External validation

Training must not claim EASA, ÚCL, LAA ČR, manufacturer or operator approval unless an actual approval and its exact scope are recorded and reflected through the shared v2.9 claim/validation process.

QES is also a decision gate, not a presumed requirement. The existing FlyTally attestations must not be relabelled as qualified electronic signatures.

## Planned v2.9 continuation

- C2 — consume the final externally reviewed shared legal/commercial surface.
- C3 — apply the chosen shared entitlement/billing model without aircraft-specific code.
- C4 — record the Training-specific regulator/manufacturer validation decision where applicable.
- C5 — keep marketing claims and source-rights evidence aligned with published aircraft content.
- C6 — participate in the shared commercial release audit.

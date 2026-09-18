# FlyTally v2.8 — C5/C6 Release Audit

Audit date: 18 September 2026  
Scope: FlyTally Training plus the cross-product boundary with FlyTally Logbook.  
Release stage: private beta.

## Release classification

**Technical private-beta gate:** pass when the candidate GitHub verification is green, the merge commit is deployed from `main`, and production smoke/readiness checks remain healthy.

**Public/commercial legal clearance:** not asserted by this engineering audit. The external/legal blockers below must be closed separately before FlyTally is described as cleared for a broad public commercial launch.

## C5 — privacy, security and public-access boundary

### Identity and authenticated data

- Training uses the narrow FlyTally identity assertion contract rather than Logbook database/session internals.
- Learner progress, Training account export/delete and all Training mutations require a valid Training session.
- Admin capabilities remain role-gated.
- State-changing browser requests fail closed unless they have a matching Origin or, when Origin is unavailable, explicit `Sec-Fetch-Site: same-origin` metadata.
- Sensitive/authenticated JSON responses use private/no-store or no-store caching as appropriate.

### Training privacy reset

- Server-side Training learner events and aircraft state can be erased independently of the main FlyTally account.
- Deletion leaves only the minimal reset marker required to prevent pre-deletion offline events from being replayed later.
- Progress ingestion and deletion acquire the same account-scoped PostgreSQL transaction advisory lock. This closes the race where an old-device sync could otherwise start concurrently with deletion, observe the old reset state and commit stale progress after the delete transaction.
- Current-device clearing removes Training local/session storage, FlyTally Training caches and Training service-worker registrations.

### Cross-product privacy wording

- The canonical legal centre is owned by Logbook at `https://fly-tally.com/legal`; Training links to it instead of maintaining a second legal text.
- Training self-service controls cover Training learner progress only.
- Main identity/account deletion and Logbook aviation-record retention/deletion remain Logbook responsibilities.
- The canonical Privacy notice must explicitly describe Training learner progress/state and the separate Training deletion surface; this wording is synchronized as part of the v2.8 release audit.

### Public and sharing boundaries

- Training currently exposes published catalogue/aircraft/reference content without requiring a Training session. Learner progress, account data, mutations and administration remain authenticated.
- That technical accessibility does **not** establish copyright, licence, NDA or other publication rights for source-derived content. Each content set must have an explicit rights decision before it is treated as suitable for broad public access.
- Training has no user-data public-sharing feature in v2.8.
- Logbook public flight sharing is a separate boundary: secret-token links expose a deliberately limited public DTO, can be revoked, are marked noindex/nocache, and provide a reporting route. Private remarks, licence data, costs, signatures, certification details and crew identity are excluded from the public payload.

## C6 — regression and release controls

The release gate requires:

- TypeScript validation;
- complete unit/regression suite;
- production build;
- operational Flight Deck source-authority/freshness fail-closed tests;
- bounded-performance/interpolation and no-extrapolation tests;
- authentication, mutation-origin and security-header tests;
- Training privacy export/delete/reset/device-clear tests;
- delete-versus-progress-sync serialization regression;
- Vercel feature-branch preview suppression;
- one production deployment only after validated merge to `main`.

No test may be weakened merely to make the release gate green. A failing safety/privacy assertion must be resolved in product logic or the release must remain blocked.

## External/legal launch blockers

These items are intentionally **not** represented as solved by code:

1. **Operator/controller identification** — the canonical legal notice still carries private-beta placeholder operator identification. Formal operator/controller identity and required business/contact particulars must be supplied before public commercial launch.
2. **Legal review of notices and terms** — Privacy, Terms, retention wording, lawful bases, data-subject rights handling and any consumer/commercial terms require jurisdiction-appropriate legal review before commercial launch.
3. **Processor/DPA and international-transfer review** — production use of Vercel, Neon, Resend, Google, Esri/ArcGIS, OpenAI and any later provider must have the required processor records, contracts and transfer mechanism review for the actual deployment.
4. **Training source and publication rights** — copyright/licence/NDA permission must be established for every manual/source and for any derivative content exposed publicly. Technical publication approval is not a rights grant.
5. **Aviation/regulatory review** — FlyTally must not imply authority approval, operational-manual status or regulatory acceptance that has not actually been granted. Any regulator-facing claim must be separately substantiated.
6. **Operational privacy/support process** — DSAR, incident, security and public-content reporting contacts/processes must be staffed and executable in practice, not only documented in UI copy.

## Accepted technical follow-ups

These do not invalidate the current private-beta release but must be reassessed before materially broader exposure:

- introduce a durable shared rate-limit/abuse-control layer where traffic and threat modelling justify it; do not rely on per-instance memory as a security control;
- revisit whether published Training content should remain anonymously accessible once the source-rights model and commercial access model are finalized;
- keep the processor register, retention schedule, public-share boundary and aviation-safety wording under regression review whenever a new provider or public surface is introduced.

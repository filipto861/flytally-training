# FlyTally Training v1.0 release gate

A green application build alone is not a production release. The final gate covers application behavior, infrastructure, source governance and human acceptance.

## Automated gates

- Pull requests: TypeScript, unit/regression tests and production build.
- `npm run test:v1-content`: aggregate source-backed reference-content acceptance.
- `GET /api/health`: process liveness only.
- `GET /api/readiness`: production configuration, Training PostgreSQL connectivity, progress persistence, current-content freshness, AI-draft audit persistence, identity replay protection, published modular aircraft content and source-governance status.
- GitHub `Production readiness probe`: verifies the real production custom domain after pushes to `main`.
- `No-code aircraft acceptance`: proves a second aircraft can use the generic PostgreSQL/content path without aircraft-specific application code.

## Source-governance boundary

FlyTally Training does **not** host source manuals. There is no release requirement for a manual Blob store, manual-upload table, source-document viewer or download endpoint.

A governed source revision records only what the product needs for traceability:

- source family/title and publisher,
- immutable revision and issue date,
- authority classification and applicability notes,
- exact chapter / section / page references,
- optional external citation URI,
- optional SHA-256 fingerprint and local filename/byte-count metadata.

When an administrator selects a local PDF for fingerprinting, SHA-256 is computed in the browser. The file input is not submitted and the PDF bytes do not leave the administrator's device. The original source material remains under the administrator's lawful access outside FlyTally.

`profiles.sourceGovernedRelease` is satisfied by fresh published training content whose effective modules have classified immutable source provenance. It does not test document storage because document storage is intentionally not a Training capability.

## Production configuration gate

A production-ready Training deployment requires:

- `TRAINING_CONTENT_BACKEND=postgres`,
- a Training-owned `TRAINING_DATABASE_URL`,
- strong `TRAINING_SESSION_SECRET`,
- strong shared `FLYTALLY_IDENTITY_SECRET`,
- HTTPS `FLYTALLY_LOGBOOK_URL`,
- governed aircraft content reviewed and published into PostgreSQL,
- progress, aircraft state, AI-draft audit and identity-assertion persistence initialized through the explicit bootstrap path.

No Vercel Blob credential is part of the source-content contract.

## First-deploy database bootstrap

A new Training database must be initialized before the first SSO callback:

```bash
TRAINING_DATABASE_URL='postgresql://...' npm run db:init
```

`db:init` provisions and verifies the active Training persistence boundaries. Runtime learner requests do not self-provision schema. Historical databases may still contain legacy `training_manual_assets` data from earlier milestones; M31 does not provision or use that relation.

## Content and revision governance

Source revisions are immutable. Registering a newer revision creates stale-review state for affected currently published content rather than silently rewriting approved material.

Content versions are immutable too. Draft creation, source links, approval and publication remain governed transitions. A newer draft can coexist with the current live release until review and publication are complete.

**Re-source this payload without rewriting it** creates a new `human` draft with the exact existing payload and selected fingerprint-backed source references. It never mutates the live version and does not auto-approve or auto-publish.

AI-assisted authoring remains draft-only. Selected references, source-excerpt hash/length, provider/model, provider response identity and warnings are retained in the AI audit record. AI cannot become the technical authority or bypass human approval.

## Aircraft-agnostic readiness

Operational readiness is based on the modules an aircraft actually publishes. A sparse aircraft is valid; it is not required to reproduce the Learjet module set.

The generic release model requires:

- at least one genuine published learner module,
- usable modular content through `TrainingContentRepository`,
- no unresolved stale-source review on effective published training content,
- source provenance for a source-governed release,
- no aircraft-ID special cases in the learner runtime.

## Identity and progress

FlyTally identity handoff is short-lived and one-time. Training consumes the assertion `jti` before issuing its own session cookie. Replay is rejected.

Learner progress is Training-owned, synchronized independently from content governance and remains isolated by aircraft/configuration. Admin sessions retain the shorter privilege lifetime defined by the session policy.

## Human acceptance gate

Before declaring v1.0 complete on `training.fly-tally.com`, verify on desktop and mobile:

1. `npm run db:init` succeeds against the target Training database before first SSO login.
2. published aircraft load from PostgreSQL without aircraft-specific runtime branches.
3. the available learner modules for each aircraft work end-to-end through generic routes/components.
4. progress survives a second browser/device and sign-out affects only the Training session.
5. a consumed SSO assertion cannot be replayed and admin session expiry follows the shorter privilege TTL.
6. admin can register a source revision without uploading the source PDF, optionally compute a local SHA-256 fingerprint, create exact page references, draft/review/approve/publish content and observe stale review after a newer source revision.
7. no source-document upload/download/viewer surface exists in the production application.
8. AI-assisted drafts retain their audit record and still require explicit human approval/publication.
9. `/api/readiness` returns HTTP 200 for the operational profile and reports source-governance state independently.
10. the no-code second-aircraft PostgreSQL acceptance passes.

Only after these checks should the release be called FlyTally Training v1.0.

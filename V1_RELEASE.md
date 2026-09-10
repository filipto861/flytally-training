# FlyTally Training v1.0 release gate

The product is not v1.0-ready merely because the application build is green. The final release gate covers application behavior, infrastructure and controlled content.

## Automated gates

- Pull requests: TypeScript, unit/regression tests and production build.
- `npm run test:v1-content`: the Learjet reference implementation must pass the aggregate source-backed content gate, including the complete Cold & Dark → Shutdown path, all nine baseline systems and the product authority boundary.
- `GET /api/health`: process liveness only; it intentionally does not touch dependencies.
- `GET /api/readiness`: production configuration, Training PostgreSQL connectivity, persistent-progress tables, controlled-manual persistence, live private controlled-manual storage, AI-draft audit persistence, the identity assertion replay ledger, a readable published-aircraft catalog and **at least one complete v1 aircraft bundle** through the configured content repository. It returns HTTP 503 until all are true.
- Manual GitHub workflow `No-code aircraft acceptance`: must pass against a disposable PostgreSQL database before the no-code multi-aircraft architecture is marked proven.

The aggregate content gate is aircraft-agnostic. It evaluates a resolved `AircraftContentBundle`; the Learjet test adds the v1 reference-aircraft specifics such as the exact nine-system baseline and complete practical flight phase sequence.

The runtime completeness check is aircraft-agnostic too. A v1-ready aircraft must expose Quick Start, Systems, Normal Flight, Cockpit Orientation, Abnormal/Emergency, Quick Reference, Knowledge and a controlled manual. Readiness does not special-case the Learjet aircraft ID.

## Production configuration gate

A production-ready Training deployment requires:

- `TRAINING_CONTENT_BACKEND=postgres`
- a Training-owned `TRAINING_DATABASE_URL`
- strong `TRAINING_SESSION_SECRET`
- strong shared `FLYTALLY_IDENTITY_SECRET`
- HTTPS `FLYTALLY_LOGBOOK_URL`
- a private Vercel Blob store authenticated by the deployment-scoped `VERCEL_OIDC_TOKEN` (preferred on Vercel) or `BLOB_READ_WRITE_TOKEN` as an explicit/local fallback
- governed Learjet content bootstrapped/reviewed/published into PostgreSQL
- Training progress, aircraft-state, controlled-manual asset, AI-draft audit and identity-assertion tables initialized through the explicit admin/deployment bootstrap path

Static TypeScript content remains a development/bootstrap adapter and is not an acceptable v1.0 production backend.

The learner PostgreSQL content adapter is deliberately **read-only at runtime**: ordinary aircraft/library/lesson requests do not execute schema DDL. Schema creation and governance changes belong to the admin/write/bootstrap path. Aircraft-library hydration is batched rather than issuing one aircraft/variant/manual query set per published aircraft.

Persistent progress follows the same boundary. Runtime progress requests perform only SELECT/INSERT/UPSERT operations; they never create tables or indexes. A sync batch is ingested in one PostgreSQL statement, and per-aircraft continuation state is derived from canonical persisted events so idempotent replay cannot move state using conflicting client data. Excessive future device-clock skew is normalized to server time without discarding otherwise valid offline progress.

Controlled manuals are also part of readiness rather than an optional admin extra. A browser-computed SHA-256 is only the expected digest: before an asset becomes `ready`, Training streams the stored private Blob, recomputes SHA-256 and byte count server-side, and compares both to the signed upload metadata. Upload URLs are non-overwriting. Proven byte/digest mismatches fail closed; transient readback failures remain retryable.

Production readiness goes one step further than table/config checks. For at least one complete v1 aircraft, a controlled PDF must be `attached` to a manual revision that is actually referenced by the **currently published** learner content. `/api/readiness` performs a lightweight private-Blob `HEAD` on up to three such candidates and requires stored size and `application/pdf` metadata to still match the verified database record. SHA-256 is not recomputed on every health probe because attachment is possible only after the server-side byte-integrity gate has already passed.

Registering an immutable controlled manual revision uses one non-interactive PostgreSQL transaction: claim the verified asset, resolve its server-owned URI/checksum, insert the revision, create stale-content flags and attach the asset. A failed revision or uniqueness constraint rolls the whole transaction back, so the admin workflow cannot leave the PDF claimed while the revision or stale-governance state only partially exists. External controlled sources use the same transactional revision/stale-flag boundary.

Interactive content governance is transactional as well. Draft version numbering is serialized per aircraft/domain/content key; the content item, immutable draft and all aircraft-owned source links are created together. Approval and publication serialize on content-item identity so a human approval cannot be separated from its state transition and competing publication attempts cannot leave multiple effective versions or a stale publication pointer.

AI-assisted authoring has an additional provenance invariant. The source excerpt hash/length, selected references, provider/model, provider response id and warnings are inserted into `training_ai_draft_runs` in the **same PostgreSQL transaction** as the AI-assisted draft and its source links. An `ai-assisted` version without that audit row cannot be approved or published. AI authoring performs no runtime schema DDL; the audit table is provisioned only through explicit Training database initialization/bootstrap and is part of `/api/readiness`.

FlyTally identity handoff is short-lived **and one-time**. After cryptographic verification, Training atomically consumes the assertion `jti` in its own PostgreSQL replay ledger before issuing the Training session cookie. Replaying the same signed assertion is rejected, and the authentication callback does not create schema at runtime. SSO return targets are normalized as same-origin local paths before either application redirects through the handoff.

Training session privilege lifetime is role-sensitive. Standard learner sessions may remain valid for up to seven days; admin sessions are capped at twelve hours. The reader enforces the current role-specific maximum too, so a legacy longer-lived admin cookie cannot keep stale administrative authority after this policy is deployed.

## Human acceptance gate

Before declaring v1.0 complete on `training.fly-tally.com`, verify on desktop and mobile:

1. Learjet appears from PostgreSQL and opens without aircraft-specific application branches.
2. Quick Start, cockpit orientation and Cold & Dark → Shutdown First Flight work end-to-end.
3. Learn / Practice / Flow / Challenge & Response modes remain usable on touch and desktop.
4. abnormal scenarios, Quick Reference / FLY mode and knowledge review work end-to-end.
5. sign-in returns from FlyTally Logbook, progress survives a second browser/device, sign-out clears only the Training session, a previously consumed identity callback cannot be replayed, and an admin session expires/re-authenticates on the shorter privilege TTL.
6. admin can initialize Training-owned runtime tables, upload a controlled PDF whose stored bytes pass server-side SHA-256 verification, register and atomically attach an immutable revision, create source references, generate an AI-assisted draft whose audit is atomically retained, draft/review/approve/publish content and observe stale-content review after a newer revision.
7. current approved AFM/QRH/operator material remains explicitly controlling over Training content.
8. `/api/readiness` returns HTTP 200, including persistent-progress, live controlled-manual storage, AI-draft audit persistence, identity replay-protection and complete-v1-aircraft checks.

Only after these checks and the no-code PostgreSQL acceptance run should the release be called FlyTally Training v1.0.

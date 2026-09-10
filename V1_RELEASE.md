# FlyTally Training v1.0 release gate

The product is not v1.0-ready merely because the application build is green. The final release gate covers application behavior, infrastructure and controlled content.

## Automated gates

- Pull requests: TypeScript, unit/regression tests and production build.
- `npm run test:v1-content`: the Learjet reference implementation must pass the aggregate source-backed content gate, including the complete Cold & Dark → Shutdown path, all nine baseline systems and the product authority boundary.
- `GET /api/health`: process liveness only; it intentionally does not touch dependencies.
- `GET /api/readiness`: production configuration, Training PostgreSQL connectivity, persistent-progress tables and at least one published aircraft through the configured content repository. It returns HTTP 503 until all are true.
- Manual GitHub workflow `No-code aircraft acceptance`: must pass against a disposable PostgreSQL database before the no-code multi-aircraft architecture is marked proven.

The aggregate content gate is aircraft-agnostic. It evaluates a resolved `AircraftContentBundle`; the Learjet test adds the v1 reference-aircraft specifics such as the exact nine-system baseline and complete practical flight phase sequence.

## Production configuration gate

A production-ready Training deployment requires:

- `TRAINING_CONTENT_BACKEND=postgres`
- a Training-owned `TRAINING_DATABASE_URL`
- strong `TRAINING_SESSION_SECRET`
- strong shared `FLYTALLY_IDENTITY_SECRET`
- HTTPS `FLYTALLY_LOGBOOK_URL`
- private controlled-manual Blob storage configured for the Training project
- governed Learjet content bootstrapped/reviewed/published into PostgreSQL
- Training progress and aircraft-state tables initialized through the explicit admin/deployment bootstrap path

Static TypeScript content remains a development/bootstrap adapter and is not an acceptable v1.0 production backend.

The learner PostgreSQL content adapter is deliberately **read-only at runtime**: ordinary aircraft/library/lesson requests do not execute schema DDL. Schema creation and governance changes belong to the admin/write/bootstrap path. Aircraft-library hydration is batched rather than issuing one aircraft/variant/manual query set per published aircraft.

Persistent progress follows the same boundary. Runtime progress requests perform only SELECT/INSERT/UPSERT operations; they never create tables or indexes. A sync batch is ingested in one PostgreSQL statement, and per-aircraft continuation state is derived from canonical persisted events so idempotent replay cannot move state using conflicting client data.

## Human acceptance gate

Before declaring v1.0 complete on `training.fly-tally.com`, verify on desktop and mobile:

1. Learjet appears from PostgreSQL and opens without aircraft-specific application branches.
2. Quick Start, cockpit orientation and Cold & Dark → Shutdown First Flight work end-to-end.
3. Learn / Practice / Flow / Challenge & Response modes remain usable on touch and desktop.
4. abnormal scenarios, Quick Reference / FLY mode and knowledge review work end-to-end.
5. sign-in returns from FlyTally Logbook, progress survives a second browser/device, and sign-out clears only the Training session.
6. admin can initialize Training-owned runtime tables, upload a controlled PDF, register an immutable revision, create source references, draft/review/approve/publish content and observe stale-content review after a newer revision.
7. current approved AFM/QRH/operator material remains explicitly controlling over Training content.
8. `/api/readiness` returns HTTP 200, including the persistent-progress check.

Only after these checks and the no-code PostgreSQL acceptance run should the release be called FlyTally Training v1.0.

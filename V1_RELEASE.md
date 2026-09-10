# FlyTally Training v1.0 release gate

The product is not v1.0-ready merely because the application build is green. The final release gate covers application behavior, infrastructure and controlled content.

## Automated gates

- Pull requests: TypeScript, unit/regression tests and production build.
- `GET /api/health`: process liveness only; it intentionally does not touch dependencies.
- `GET /api/readiness`: production configuration, Training PostgreSQL connectivity and at least one published aircraft through the configured content repository. It returns HTTP 503 until all three are true.
- Manual GitHub workflow `No-code aircraft acceptance`: must pass against a disposable PostgreSQL database before the no-code multi-aircraft architecture is marked proven.

## Production configuration gate

A production-ready Training deployment requires:

- `TRAINING_CONTENT_BACKEND=postgres`
- a Training-owned `TRAINING_DATABASE_URL`
- strong `TRAINING_SESSION_SECRET`
- strong shared `FLYTALLY_IDENTITY_SECRET`
- HTTPS `FLYTALLY_LOGBOOK_URL`
- private controlled-manual Blob storage configured for the Training project
- governed Learjet content bootstrapped/reviewed/published into PostgreSQL

Static TypeScript content remains a development/bootstrap adapter and is not an acceptable v1.0 production backend.

## Human acceptance gate

Before declaring v1.0 complete on `training.fly-tally.com`, verify on desktop and mobile:

1. Learjet appears from PostgreSQL and opens without aircraft-specific application branches.
2. Quick Start, cockpit orientation and Cold & Dark → Shutdown First Flight work end-to-end.
3. Learn / Practice / Flow / Challenge & Response modes remain usable on touch and desktop.
4. abnormal scenarios, Quick Reference / FLY mode and knowledge review work end-to-end.
5. sign-in returns from FlyTally Logbook, progress survives a second browser/device, and sign-out clears only the Training session.
6. admin can upload a controlled PDF, register an immutable revision, create source references, draft/review/approve/publish content and observe stale-content review after a newer revision.
7. current approved AFM/QRH/operator material remains explicitly controlling over Training content.
8. `/api/readiness` returns HTTP 200.

Only after these checks and the no-code PostgreSQL acceptance run should the release be called FlyTally Training v1.0.

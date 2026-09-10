# FlyTally Training deployment runbook

This runbook defines the first production deployment order. A green application build alone is not a release.

## 1. Create the isolated Training deployment

Create a dedicated Vercel project from `filipto861/flytally-training`; do not reuse the Logbook project. The intended production hostname is `training.fly-tally.com`.

The repository pins Node.js `24.x`, matching GitHub verification and the Vercel runtime contract. Dependency installation must use the committed `package-lock.json` (`npm ci`).

## 2. Provision Training-owned dependencies

Provision a PostgreSQL database dedicated to Training and a private Vercel Blob store for controlled manuals. The Training database must not be the FlyTally Logbook database.

Configure the Training production environment:

- `TRAINING_DATABASE_URL` — dedicated Training PostgreSQL connection string.
- `TRAINING_SESSION_SECRET` — independent random secret, at least 32 characters.
- `FLYTALLY_IDENTITY_SECRET` — random shared identity-handoff secret, at least 32 characters; the exact same value must be configured in Logbook.
- `FLYTALLY_LOGBOOK_URL` — HTTPS production origin of FlyTally Logbook.
- `TRAINING_CONTENT_BACKEND=postgres` — static content is not a production backend.
- private Blob authentication — Vercel deployment OIDC is preferred; `BLOB_READ_WRITE_TOKEN` is the supported explicit fallback.
- `OPENAI_API_KEY` when live admin AI drafting is required; AI drafting remains draft-only regardless of configuration.

Do not configure `TRAINING_ACCEPTANCE_DATABASE_URL` to the production database.

## 3. Configure the Logbook side of SSO

The Logbook deployment must contain:

- `TRAINING_APP_URL=https://training.fly-tally.com`
- the same `FLYTALLY_IDENTITY_SECRET` configured in Training.

Logbook issues the short-lived identity assertion; Training consumes it once and creates its own session. Neither application shares the other's session cookie or database.

## 4. Initialize the database before first SSO

Run the idempotent bootstrap against the production Training database before the first identity callback:

```bash
TRAINING_DATABASE_URL='postgresql://...' npm run db:init
```

The command creates/verifies Training-owned persistence only. It does not publish aircraft content. Ordinary runtime requests intentionally do not self-provision schema.

## 5. Migrate and govern the Learjet seed

After SSO is configured, sign in with an admin account. The static-seed transition action is a privileged migration, not a passive import: after an explicit confirmation it records the acting administrator as the migration approver and immediately publishes seed bundles that are not already published. Review the current source-backed Learjet v1 seed before confirming the action.

The migration bootstrap reference preserves the existing source metadata but does **not by itself satisfy controlled-manual production readiness**. Before release, the currently published learner versions must reference a source reference belonging to an attached controlled manual revision whose private Blob has passed byte/signature/hash verification. If the seed was migrated first, register the controlled revision and source reference, create replacement governed versions using that controlled source, explicitly approve/publish them, and resolve the resulting stale-source review state as appropriate.

A production aircraft is not complete merely because its catalogue row or bootstrap bundles are published. The current learner content must resolve all v1 capabilities and the controlled source must remain reachable.

## 6. Verify production readiness

Check:

```text
GET https://training.fly-tally.com/api/health
GET https://training.fly-tally.com/api/readiness
```

`/api/health` proves process liveness only. `/api/readiness` must return HTTP 200 before release; it validates production configuration, PostgreSQL, progress persistence, controlled-manual persistence/storage, AI audit persistence, identity replay protection, published catalogue access and at least one complete v1 aircraft.

## 7. Prove the no-code second-aircraft architecture separately

Use a disposable/preview PostgreSQL database, never production. The manual GitHub workflow requires both the `TRAINING_ACCEPTANCE_DATABASE_URL` secret and explicit disposable-target confirmation. The standalone equivalent is documented in `NO_CODE_ACCEPTANCE.md`.

Only a successful real PostgreSQL acceptance run counts as evidence that the multi-aircraft no-code criterion is proven.

## 8. Human release acceptance

Complete the desktop/mobile and cross-device checks in `V1_RELEASE.md`, including SSO replay rejection, progress synchronization, controlled manual upload/verification, governed authoring, stale-source handling and admin session expiry. Only then call the deployment FlyTally Training v1.0.

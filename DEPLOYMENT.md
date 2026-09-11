# FlyTally Training deployment runbook

This runbook defines the production deployment order. A green application build alone is not a release.

## 1. Create the isolated Training deployment

Create a dedicated Vercel project from `filipto861/flytally-training`; do not reuse the Logbook project. The intended production hostname is `training.fly-tally.com`.

The repository pins Node.js `24.x`, matching GitHub verification and the Vercel runtime contract. Dependency installation must use the committed `package-lock.json` (`npm ci`).

## 2. Provision Training-owned dependencies

Provision a PostgreSQL database dedicated to Training. The Training database must not be the FlyTally Logbook database.

Configure the Training production environment:

- `TRAINING_DATABASE_URL` — dedicated Training PostgreSQL connection string.
- `TRAINING_SESSION_SECRET` — independent random secret, at least 32 characters.
- `FLYTALLY_IDENTITY_SECRET` — random shared identity-handoff secret, at least 32 characters; the exact same value must be configured in Logbook.
- `FLYTALLY_LOGBOOK_URL` — HTTPS production origin of FlyTally Logbook.
- `TRAINING_CONTENT_BACKEND=postgres` — static content is not a production backend.
- `OPENAI_API_KEY` when live admin AI drafting is required; AI drafting remains draft-only regardless of configuration.

M31 deliberately has no source-document storage dependency. FlyTally Training does not host source documents and therefore requires no manual Blob store, manual-download capability or source-document storage credential. Administrators retain lawful access to their source material outside FlyTally and may register source identity, revision, authority, exact page references and an optional locally computed SHA-256 fingerprint.

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

The command creates/verifies active Training-owned persistence only. It does not publish aircraft content or create a source-document store. Ordinary runtime requests intentionally do not self-provision schema.

## 5. Migrate and govern aircraft content

After SSO is configured, sign in with an admin account. Static-seed transition actions are privileged migrations, not passive imports: after explicit confirmation they record the acting administrator as the migration approver and publish seed bundles that are not already published.

Source governance is record-based rather than document-hosting based. FlyTally persists immutable source identity, revision, authority, exact references and optional SHA-256 fingerprints. The source document itself remains outside FlyTally.

Use the admin review flow rather than copying bundle JSON by hand:

1. register the immutable source revision;
2. optionally select the PDF locally so the browser computes a SHA-256 fingerprint without uploading the file;
3. create the relevant page/chapter source reference(s);
4. open each currently published bundle and use **Re-source this payload without rewriting it**;
5. select only fingerprint-backed source reference(s) that support that bundle when stronger source identity is required;
6. Training creates a new immutable `human` draft with the exact existing payload and the selected provenance;
7. review the unchanged payload against the source material you hold lawfully outside FlyTally, then explicitly approve and publish the new version;
8. resolve any stale-source review state only after the replacement has been checked.

The re-source action never mutates the published version and does not auto-approve or auto-publish the replacement. FlyTally does not host source documents, so there is no manual viewer, upload library or download endpoint in this workflow.

## 6. Verify production readiness

Check:

```text
GET https://training.fly-tally.com/api/health
GET https://training.fly-tally.com/api/readiness
```

`/api/health` proves process liveness only. `/api/readiness` exposes two explicit profiles:

- `profiles.operational` — the learner application can use its production PostgreSQL backend, persistence, identity boundary and current published modular aircraft content. This controls the endpoint's HTTP 200/503 status.
- `profiles.sourceGovernedRelease` — at least one fresh published aircraft has complete classified source provenance across all of its currently published training modules.

Source-document storage is intentionally absent from readiness because it is not a FlyTally capability.

## 7. Prove the no-code second-aircraft architecture separately

Use a disposable/preview PostgreSQL database, never production. The manual GitHub workflow requires both the `TRAINING_ACCEPTANCE_DATABASE_URL` secret and explicit disposable-target confirmation. The standalone equivalent is documented in `NO_CODE_ACCEPTANCE.md`.

Only a successful real PostgreSQL acceptance run counts as evidence that the multi-aircraft no-code criterion is proven.

## 8. Human release acceptance

Complete the desktop/mobile and cross-device checks in `V1_RELEASE.md`, including SSO replay rejection, progress synchronization, governed authoring, stale-source handling and admin session expiry. Source records and references must remain reviewable without exposing or storing the underlying source documents.

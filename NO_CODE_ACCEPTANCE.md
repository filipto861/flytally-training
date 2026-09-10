# Second-aircraft no-code acceptance

FlyTally Training is considered genuinely no-code for a new aircraft only when the PostgreSQL acceptance harness passes against a disposable Training database.

The harness first runs the same idempotent Training database bootstrap used for deployment, then creates a brand-new aircraft ID at runtime, adds a variant and immutable controlled-source revision, creates source provenance, publishes valid bundles for all five generic content domains, publishes the aircraft catalogue entry, and reads the result back through `PostgresTrainingContentRepository` and `getAircraftContentBundle`. It finally deletes the synthetic aircraft by cascade.

It deliberately does **not** add a React component, route, repository method, aircraft-specific `if`/`switch`, or learner-facing aircraft literal. The test fixture is data used to exercise the same admin/content contracts that a real second aircraft uses.

Run only against a disposable or preview database. The standalone command requires an explicit destructive-test acknowledgement in addition to the database URL:

```bash
TRAINING_ACCEPTANCE_DATABASE_URL='postgresql://...' \
TRAINING_ACCEPTANCE_CONFIRM_DISPOSABLE='I_UNDERSTAND_THIS_IS_DISPOSABLE' \
npm run test:no-code-aircraft
```

The runner refuses to start without the acknowledgement. It also refuses when `TRAINING_DATABASE_URL` is present and exactly matches `TRAINING_ACCEPTANCE_DATABASE_URL`. This is an additional guard, not a substitute for checking the target database yourself.

Never point `TRAINING_ACCEPTANCE_DATABASE_URL` at production. The test performs real schema initialization, writes and cleanup. A skipped default unit test is not acceptance evidence; the dedicated command must complete successfully against PostgreSQL before the no-code criterion is marked complete.

The manual GitHub Actions workflow adds the same safety boundary: it requires the disposable database secret plus an explicit boolean confirmation before the runner receives the acknowledgement token. Dependencies are installed from the committed lockfile with `npm ci`.

The dedicated runner executes TypeScript server modules with the React Server condition enabled, so imports guarded by `server-only` behave the same way they do in the Next.js server runtime instead of failing in the standalone Node acceptance process.

## First-deploy database bootstrap

A completely empty Training database must be initialized **before the first FlyTally SSO callback**, because authentication already consumes the one-time identity assertion ledger. Run:

```bash
TRAINING_DATABASE_URL='postgresql://...' npm run db:init
```

The command is idempotent. It provisions all Training-owned content, progress, controlled-manual, identity and AI-audit persistence and then verifies every required relation. It does not seed or publish aircraft content.

## Controlled manual assets

Manual PDFs are stored separately from PostgreSQL in a **private Vercel Blob store**. The browser computes the expected SHA-256, the server authorizes a short-lived pathname-scoped `PUT`, and the browser uploads directly to Blob. Before the asset becomes selectable for an immutable manual revision, Training reads the private object back once and verifies MIME type, actual `%PDF-` signature, byte count and server-computed SHA-256. Private reads use short-lived signed `GET` URLs.

This keeps large manuals out of serverless request bodies while preserving revision provenance and proven byte identity in PostgreSQL.

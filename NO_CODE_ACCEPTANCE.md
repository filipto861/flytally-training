# Second-aircraft no-code acceptance

FlyTally Training is considered genuinely no-code for a new aircraft only when the PostgreSQL acceptance harness passes against a disposable Training database.

The harness creates a brand-new aircraft ID at runtime, adds a variant and immutable controlled-source revision, creates source provenance, publishes valid bundles for all five generic content domains, publishes the aircraft catalogue entry, then reads the result back through `PostgresTrainingContentRepository` and `getAircraftContentBundle`. It finally deletes the synthetic aircraft by cascade.

It deliberately does **not** add a React component, route, repository method, aircraft-specific `if`/`switch`, or learner-facing aircraft literal. The test fixture is data used to exercise the same admin/content contracts that a real second aircraft uses.

Run only against a disposable or preview database:

```bash
TRAINING_ACCEPTANCE_DATABASE_URL='postgresql://...' npm run test:no-code-aircraft
```

Never point `TRAINING_ACCEPTANCE_DATABASE_URL` at production. The test performs real writes and cleanup. A skipped default unit test is not acceptance evidence; the dedicated command must complete successfully against PostgreSQL before the no-code criterion is marked complete.

## Controlled manual assets

Manual PDFs are stored separately from PostgreSQL in a **private Vercel Blob store**. The browser computes SHA-256, the server authorizes a short-lived pathname-scoped `PUT`, and the browser uploads directly to Blob. The server then verifies the stored object's size and MIME type with authenticated metadata before the asset becomes selectable for an immutable manual revision. Private reads use short-lived signed `GET` URLs.

This keeps large manuals out of serverless request bodies while preserving revision provenance and checksum identity in PostgreSQL.

# FlyTally Training Development

## Canonical branch

`main` is the only long-lived branch.

Use short-lived branches:

- `feat/*` for product capabilities,
- `fix/*` for defects,
- `chore/*` for infrastructure and maintenance,
- `docs/*` for documentation-only work.

Delete merged branches. Release history belongs in commits, pull requests and releases, not permanent version branches.

## Candidate-first workflow

Prefer one coherent candidate over repeated remote iterations:

1. start from the current `main`,
2. make and review the complete scoped change,
3. run targeted checks while developing,
4. create one coherent candidate commit when practical,
5. publish the short-lived branch once the candidate is internally consistent,
6. run the GitHub verification gate,
7. merge only after the gate is green,
8. delete the branch.

Do not trigger repeated Vercel builds for intermediate commits. Vercel should be connected only when deployment validation is actually useful.

## Verification

The foundation gate is:

```bash
npm run typecheck
npm test
npm run build
```

`npm run verify` runs all three.

`package-lock.json` is committed and is the canonical dependency graph for CI and deployment builds. GitHub verification installs with `npm ci`, which fails closed when `package.json` and the lockfile are out of sync; dependency changes must therefore update and commit both files together.

## Database bootstrap

Training owns its PostgreSQL schema. A new target database must be initialized before the first identity callback:

```bash
TRAINING_DATABASE_URL='postgresql://...' npm run db:init
```

The command is idempotent, provisions every required Training-owned persistence boundary and verifies the expected relations. It does not seed aircraft content.

Schema DDL has a strict boundary: it may live in the dedicated schema-provisioning functions and be invoked by explicit deployment/admin bootstrap only. Ordinary learner reads, progress sync, identity callbacks, admin catalogue reads/writes, content drafting/review/approval/publication, manual upload/finalization/download and manual-revision registration perform only the SELECT/DML required by their product operation. If deployment bootstrap was skipped, those requests must fail visibly rather than silently mutating database structure during a runtime request.

The standalone database and no-code acceptance runners load TypeScript through `tsx` with Node's `react-server` condition so `server-only` module boundaries are preserved outside Next.js.

## Architecture rules

- Keep Logbook and Training as separate repositories and deployments.
- Do not copy Logbook database tables or auth internals by default.
- Do not introduce a monorepo or Git submodules for convenience.
- Prefer explicit cross-product contracts over shared internal implementation.
- Keep AI-generated training content in draft state until source provenance and human approval are satisfied.
- Add database schema only as required by real product capabilities.
- Preserve immutable manual revision provenance.

## Scope discipline

The first Training product is an aircraft manual learning system. Flight-school administration is a later product stage, not a reason to overbuild the initial schema.

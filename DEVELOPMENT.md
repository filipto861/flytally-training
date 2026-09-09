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

The initial repository intentionally has no dependency lockfile because it was created remotely without a package installation. The first environment that performs a successful `npm install` must commit the generated `package-lock.json`; after that, CI should move from `npm install` to `npm ci`.

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

# FlyTally Training

FlyTally Training is the training and learning product in the FlyTally ecosystem. It is intentionally separated from FlyTally Logbook so training content, learning workflows and future school features can evolve without turning the pilot logbook into a monolith.

## Product direction

The first product slice is an aircraft-type training workspace built from authoritative manuals:

- aircraft types and manual libraries,
- revision-controlled source documents,
- lessons and study modules,
- interactive procedures and checklists,
- question banks and quizzes,
- learner progress and attempts,
- source citations and human approval for technical content.

AI may assist with extraction, structuring and drafting. It is never the source of truth. Publishable technical content must remain traceable to a specific manual revision and be explicitly approved.

## Repository boundaries

- `flytally-logbook` — operational pilot logbook and regulatory evidence.
- `flytally-training` — learning content, procedures, checklists, quizzes and progress.
- a future school/organization product is not part of this repository unless the real product boundary later proves otherwise.

The products may share a FlyTally account, but they do not share source trees or directly depend on each other's internal database schemas. Identity handoff uses an explicit signed contract.

## Development

FlyTally Training targets Node.js 24. Install the committed dependency graph exactly:

```bash
npm ci
npm run dev
```

Verification:

```bash
npm run verify
```

Before using a new PostgreSQL database, initialize the Training-owned schema with `npm run db:init`. Production deployment order and environment contracts are documented in `DEPLOYMENT.md`.

See `ARCHITECTURE.md`, `DEVELOPMENT.md`, `ROADMAP.md`, `V1_RELEASE.md` and `NO_CODE_ACCEPTANCE.md` before changing product or release boundaries.

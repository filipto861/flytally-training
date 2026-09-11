# FlyTally Training

FlyTally Training is the training and learning product in the FlyTally ecosystem. It is intentionally separated from FlyTally Logbook so training content and learning workflows can evolve without turning the pilot logbook into a monolith.

## Product direction

The first product slice is an aircraft-type training workspace built from authoritative source material:

- aircraft types and immutable source records,
- revision-controlled provenance without source-document hosting,
- lessons and study modules,
- interactive procedures and checklists,
- question banks and quizzes,
- learner progress and attempts,
- exact source citations and human approval for technical content.

FlyTally Training is not a document library. Source PDFs remain outside the product. Administrators may register source metadata, revision, authority, page references and an optional SHA-256 fingerprint computed locally in the browser.

AI may assist with structuring and drafting from intentionally supplied excerpts. It is never the source of truth. Publishable technical content must remain traceable to a specific source revision and be explicitly approved.

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

See `ARCHITECTURE.md`, `CONTENT_ARCHITECTURE.md`, `DEVELOPMENT.md`, `ROADMAP.md`, `V1_RELEASE.md` and `NO_CODE_ACCEPTANCE.md` before changing product or release boundaries.

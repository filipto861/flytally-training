# FlyTally Training

FlyTally Training is the aircraft learning, training and operational-reference product in the FlyTally ecosystem. It is intentionally separate from FlyTally Logbook so training content, aircraft packages and EFB workflows can evolve without coupling to the regulatory logbook runtime.

## Documentation

The repository intentionally keeps a small documentation surface:

- **`ROADMAP.md`** — authoritative implementation direction, status and next work.
- **`CHANGELOG.md`** — accepted/released history.
- **`TECHNICAL_DOCUMENTATION.md`** — living technical/product architecture, governance, safety, data, UX and deployment reference.
- **`README.md`** — this short entry point.

Historical milestone/specification Markdown files were consolidated into the living technical documentation. Exact historical wording remains available through Git history and pull requests.

## Core product rules

- Aircraft-specific technical content is governed data; reusable runtime behavior remains aircraft-agnostic.
- Operational content is source-governed and fails closed when provenance, authority, applicability or source envelope is insufficient.
- AI may assist drafting but is never source authority and never bypasses human approval.
- Training and Logbook share identity through an explicit contract, not database/session internals.
- LEARN and EFB are separate product modes; Active Flight defines flight context while Performance owns calculations.

## Development

FlyTally Training targets Node.js 24.

```bash
npm ci
npm run dev
```

Primary verification:

```bash
npm run typecheck
npm test
npm run build
```

or:

```bash
npm run verify
```

A new Training PostgreSQL database must be explicitly initialized with `npm run db:init` before normal runtime use. Production deployment and environment rules are maintained in `TECHNICAL_DOCUMENTATION.md`.

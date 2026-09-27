# FlyTally Training

FlyTally Training is the aircraft learning, training and operational-reference product in the FlyTally ecosystem. It is intentionally separate from FlyTally Logbook so aircraft content, training and EFB workflows can evolve without coupling to the regulatory logbook runtime.

## Documentation

Start here, in this order:

1. **`ROADMAP.md`** — current phase, next work, dependencies and frozen planning decisions.
2. **`FEATURES.md`** — canonical product capability inventory.
3. **`CHANGELOG.md`** — what actually changed.
4. **`TECHNICAL_DOCUMENTATION.md`** — current technical/product architecture, governance, safety, data, UX and deployment contracts.
5. **`README.md`** — this short repository entry point.

The five-file surface is intentional. Detailed milestone history belongs in `CHANGELOG.md`, tests, pull requests and Git history rather than new routine milestone Markdown files.

## Core product rules

- Aircraft-specific technical content is governed data; reusable runtime behavior remains aircraft-agnostic.
- Operational content is source-governed and fails closed when provenance, authority, applicability or source envelope is insufficient.
- AI may assist drafting but is never source authority and never bypasses human approval.
- Training and Logbook share identity through an explicit contract, not database/session internals.
- LEARN and EFB are separate product contexts; Active Flight defines flight context while Performance owns calculations.
- Missing or source-blocked aviation data remains unavailable rather than being replaced by representative values.

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

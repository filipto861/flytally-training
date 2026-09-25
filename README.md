# FlyTally Training

FlyTally Training is the aircraft-learning and EFB product in the FlyTally ecosystem. It is intentionally separate from FlyTally Logbook so training content, governed aviation references and simulator workflows can evolve without turning the regulatory logbook into a monolith.

Production: `https://training.fly-tally.com`

## Documentation

The repository intentionally keeps documentation compact:

- **[ROADMAP.md](ROADMAP.md)** — authoritative product direction, implementation order and status.
- **[CHANGELOG.md](CHANGELOG.md)** — accepted and released change history.
- **[TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md)** — current architecture, content/source governance, identity, EFB, Performance, UX, deployment, safety and development contracts.

Historical milestone/specification documents were consolidated into the technical documentation. Detailed historical evidence remains in Git history and pull requests.

## Development

Node.js 24.x is required.

```bash
npm ci
npm run dev
```

Foundation verification:

```bash
npm run verify
```

A new Training PostgreSQL database must be initialized explicitly with `npm run db:init` before first use. See `TECHNICAL_DOCUMENTATION.md` for deployment and governance details.

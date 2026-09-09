# FlyTally Training Roadmap

## Foundation — current

- separate private repository
- canonical `main`
- Next.js / React / TypeScript skeleton
- provenance and approval invariant
- development and architecture contracts
- basic CI verification

## v0.1 — Manual-driven aircraft training

- aircraft type catalogue for training
- manual upload and metadata
- immutable manual revisions
- source references by revision / section / page
- AI-assisted extraction into draft content
- human review and approval workflow
- course / module / lesson structure
- source-aware learner presentation

## v0.2 — Procedures and checklist trainer

- structured procedures and steps
- normal / abnormal / emergency classification
- Learn mode
- Practice mode
- Flow training
- Challenge & Response
- memory-item handling with explicit source provenance

## v0.3 — Knowledge and progress

- question banks and quizzes
- source-linked questions
- attempts and scoring
- lesson completion
- aircraft-type progress dashboard
- weak-area review

## v0.4 — Shared FlyTally identity

- stable cross-product user identity
- SSO/session contract with FlyTally Logbook
- account linking/migration plan if needed
- no direct cross-database coupling

## Later — organization and flight-school capabilities

Only after the individual Training product is proven:

- organizations and memberships
- students and instructors
- training programs and syllabi
- flight exercises
- instructor sign-offs
- formal training records
- school administration

A separate `flytally-school` product remains an option if those workflows become a materially different application boundary.

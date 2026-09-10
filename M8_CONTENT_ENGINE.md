# M8 — Content Engine & Aircraft Administration

## Core rule

Aircraft-specific technical content is governed data. Product behaviour is code.

The administration model therefore manages aircraft, variants, manual families/revisions, source references, generic content bundles, immutable content versions, human approvals, publications and stale-content flags in PostgreSQL.

## Workflow

`aircraft -> variant -> manual -> immutable revision -> source references -> draft version -> human approval -> publication`

Publishing is impossible without an explicit approved review record. A draft marked `ai-assisted` has exactly the same approval requirement as a human/import draft. AI origin never grants publication authority.

## Current product domains

The generic content engine currently publishes five bundle domains consumed by the existing `TrainingContentRepository` interface:

- `learning`
- `normal-flight`
- `orientation`
- `abnormal`
- `reference-knowledge`

These are product-domain keys, not aircraft-specific branches. A second aircraft uses the same records and learner components.

## Revision control

Manual revisions are insert-only. Registering a new revision of an existing manual family creates stale-review flags for published content sourced from older revisions of that manual. The current publication is not silently changed or unpublished.

## Transition from static Learjet data

The admin includes an explicit bootstrap migration that copies the current static seed into the same PostgreSQL aircraft/content model and publishes it under the admin's verified FlyTally identity. Once the database has been seeded and reviewed, `TRAINING_CONTENT_BACKEND=postgres` switches learner reads to the PostgreSQL adapter without changing any learner-facing route or component.

This bootstrap is transitional tooling. Future aircraft are created and published through the content model rather than source-code registries.

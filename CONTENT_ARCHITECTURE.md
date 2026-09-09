# FlyTally Training — Content Repository Architecture

## Objective

Adding a new aircraft must become a **content operation**, not an application-development project.

The target production workflow is:

`Create aircraft -> register variants -> register manual revision -> import/draft content -> review sources -> approve -> publish`

After publication, the aircraft should appear in the learner-facing Aircraft library automatically. No new route, React component, aircraft-specific `if`, or deployment should be required merely because a new aircraft type was added.

## Current transition state

The Learjet 35/36 reference content is still physically stored in TypeScript source files while the v1.0 content contracts are stabilised. That is a temporary bootstrap adapter, not the target storage architecture.

As of the content-repository foundation, learner-facing pages no longer retrieve aircraft material directly from those source registries. They consume the asynchronous `TrainingContentRepository` contract through the application composition boundary in `lib/content-store.ts`.

This distinction is deliberate:

- **today:** `StaticTrainingContentRepository` reads the existing Learjet source-backed records;
- **target:** `PostgresTrainingContentRepository` reads published records from PostgreSQL;
- **learner UI:** unchanged between those two storage implementations.

## Non-negotiable boundary

Aircraft-specific content is data. Product behaviour is code.

Learner-facing routes and components must therefore not:

- contain literal aircraft IDs,
- import static aircraft registries to resolve content,
- switch on manufacturer/model to select a page or component,
- define cockpit regions that only one aircraft can use,
- require a new route for every aircraft,
- query PostgreSQL directly from client components.

Server routes resolve content through `TrainingContentRepository` and pass plain resolved data into interactive client components.

A regression test enforces the first part of this boundary across `app/` and `components/`.

## Repository contract

The repository currently exposes asynchronous reads for:

- aircraft catalogue
- aircraft metadata / manuals
- Quick Start and essential systems
- normal First Flight / checklist flow
- cockpit orientation
- abnormal and emergency scenarios

M6 extends the same contract for:

- Quick Reference / FLY mode
- question banks and knowledge checks

M7 extends persistence for learner state without coupling learner progress to content approval state.

M8 adds the authoring/admin write side: source ingestion, draft content, approval, publication and revision-change handling.

The read contract is asynchronous now even though the temporary adapter is in-memory. This prevents a future PostgreSQL migration from forcing a rewrite of every page from synchronous to asynchronous data access.

## PostgreSQL content model direction

Do not model one database table per Learjet screen. Persist stable product-domain records instead.

Core identity/source records:

- `aircraft_types`
- `aircraft_variants`
- `manuals`
- `manual_revisions`
- `source_references`
- `content_approvals`

Published training domains:

- learning paths / lessons / system topics
- procedures / phases / steps
- cockpit regions / controls / hotspots
- scenarios / stages
- quick-reference groups / items
- question banks / questions / answers

Every published technical record must retain stable IDs, revision-aware source references and approval evidence.

Manual revisions remain immutable. Publishing a new revision may mark dependent content stale, but must not silently mutate previously approved content.

## No-code aircraft acceptance test

The architecture is considered ready for multi-aircraft scaling only when this can be demonstrated against the PostgreSQL/admin implementation:

1. Insert/register a second aircraft without modifying application source.
2. Add at least one variant and controlled manual revision.
3. Publish Quick Start, normal procedure, cockpit orientation, one abnormal scenario and Quick Reference data through the content pipeline.
4. The aircraft appears automatically in the Aircraft library.
5. Existing generic Learn / Checklist / Practice / Reference routes render the second aircraft from its data.
6. The Learjet continues to render from the same components.
7. No aircraft-ID branch is added to `app/`, `components/` or the repository interface.

Until this acceptance test passes, FlyTally Training is **database-ready**, not yet fully no-code multi-aircraft.

## Why not move every table into PostgreSQL immediately?

The v1.0 domains are still evolving. Prematurely freezing all content structures into relational tables would create migration churn and encourage schema designed around the first aircraft.

The repository boundary lets the product stabilise the domain contracts first. PostgreSQL persistence can then be introduced behind a proven interface, while the source/approval invariants are preserved from the beginning.

The rule is therefore: do not postpone the storage boundary, but also do not invent a giant speculative schema. Add persisted domains when their product contract is real.

# FlyTally Training — Content Repository Architecture

## Objective

Adding a new aircraft must become a **content operation**, not an application-development project.

The target production workflow is:

`Create aircraft -> register variants -> register source revision -> create exact references -> draft content -> review sources -> approve -> publish`

After publication, the aircraft should appear in the learner-facing Aircraft library automatically. No new route, React component, aircraft-specific `if`, or deployment should be required merely because a new aircraft type was added.

## Source-document boundary

FlyTally Training is **not a manual library** and does not host source documents.

The application persists only the governed facts required to audit training content:

- source family identity and publisher,
- immutable revision code and issue date,
- authority classification and applicability notes,
- exact chapter / section / page references,
- optional citation URI,
- optional SHA-256 fingerprint and basic local file metadata.

When an administrator wants a fingerprint, the browser computes SHA-256 locally. The selected PDF is not submitted to FlyTally. There is no product manual-upload store, viewer or download endpoint.

The source document remains under the administrator's own lawful access outside FlyTally. Drafting may use only the relevant excerpt intentionally supplied for that authoring task; the source document itself is not retained as a product asset.

## Current transition state

The Learjet 35/36 reference content is still physically stored in TypeScript source files while the v1.0 content contracts are stabilised. That is a temporary bootstrap adapter, not the target storage architecture.

Learner-facing pages consume the asynchronous `TrainingContentRepository` contract through the application composition boundary in `lib/content-store.ts`.

- **bootstrap adapter:** `StaticTrainingContentRepository` reads existing source-backed records;
- **production:** `PostgresTrainingContentRepository` reads approved/published records from PostgreSQL;
- **learner UI:** unchanged between those storage implementations.

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

## Repository contract

The repository exposes aircraft catalogue/metadata plus first-class training modules such as systems, procedures, checklists, cockpit orientation, abnormal/emergency scenarios, performance, limitations, quick reference, avionics and knowledge content. The module set is sparse and belongs to aircraft data; no aircraft is required to mimic the Learjet curriculum.

Learner progress persistence is independent of content approval state. The admin write side owns source records, immutable drafts, approval, publication and revision-change handling.

## PostgreSQL content model direction

Do not model one database table per aircraft screen. Persist stable product-domain records instead.

Core identity/source records include:

- `training_aircraft_types`
- `training_aircraft_variants`
- `training_manuals` (source families)
- `training_manual_revisions` (immutable source records)
- `training_source_references`
- governed content versions / approvals / publications / stale flags

The historical `training_manual_assets` relation may exist in an upgraded database from earlier milestones, but M31 does not provision or use it. It is legacy data, not an active product persistence boundary.

Every published technical record must retain stable IDs, revision-aware source references and approval evidence. Manual/source revisions remain immutable. Publishing a new revision may mark dependent content stale, but must not silently mutate previously approved content.

## No-code aircraft acceptance test

The architecture is considered ready for multi-aircraft scaling only when this can be demonstrated against the PostgreSQL/admin implementation:

1. Register a second aircraft without modifying application source.
2. Add only the variants genuinely required by its applicability model.
3. Register at least one governed source revision and exact source reference.
4. Publish whatever first-class training modules that aircraft actually supports.
5. The aircraft appears automatically in the Aircraft library.
6. Existing generic learner routes render the second aircraft from its data.
7. The Learjet continues to render from the same components.
8. No aircraft-ID branch is added to `app/`, `components/` or the repository interface.

## Content-contract evolution

Avoid freezing a relational table around every current UI. The repository boundary allows product-domain contracts to evolve without designing the database around the first aircraft. Persist only stable product concepts and keep provenance, approval and applicability explicit.

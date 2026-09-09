# FlyTally Training Architecture

## 1. Product boundary

FlyTally Training is a separate web application and repository from FlyTally Logbook.

Production boundary: `training.fly-tally.com`.

FlyTally Logbook remains responsible for operational flight records, certification evidence and regulatory logbook functions. FlyTally Training is responsible for simulator-oriented aircraft learning, procedures, checklists, cockpit orientation, scenarios, knowledge, reference and progress.

No runtime code is imported directly from the Logbook repository. Cross-product capabilities must use explicit contracts or shared services only when a real requirement exists.

## 2. Primary user and learning model

The primary v1.0 user is a simulator pilot learning a new aircraft/add-on.

The product is optimized for practical competence rather than exhaustive type-rating-style study.

Core learning principles:
- default normal training starts Cold & Dark and ends Shutdown / Cold & Dark,
- checklist/procedure flow is the spine of learning,
- theory is delivered progressively when the pilot needs it,
- the source manual remains available for depth and provenance,
- manual chapter order is reference structure, not the primary learner journey.

The preferred information pattern is:

`Action -> Why? -> Show me / System detail -> Source`

A user should be able to ignore deeper layers when they only need to complete a normal simulator flight.

## 3. Technology baseline

- Next.js 16
- React 19
- TypeScript with strict checking
- server-first application architecture
- PostgreSQL for persistent v1.0 product state
- Vercel deployment at `training.fly-tally.com`

Persistence is part of v1.0 because progress, attempts and aircraft learning state must survive across sessions and devices.

## 4. Reference implementation rule

Learjet 35/36 is the v1.0 reference aircraft.

It is used to prove all product capabilities end-to-end, but it must not become a special-case architecture.

Aircraft-specific content is data. Product behavior is generic.

Any implementation that requires future aircraft to duplicate Learjet-specific UI or business logic should be treated as an architectural smell and refactored before multi-aircraft scaling.

## 5. Identity boundary

Training should use the same stable FlyTally account identity as Logbook without duplicating user accounts.

Until the shared identity contract is implemented:
- do not copy Logbook auth code into Training,
- do not query the Logbook database directly,
- do not treat Logbook session internals as a public API,
- keep Training user references compatible with an external/stable FlyTally user identity.

The v1.0 identity phase must define a narrow SSO/session contract and migration strategy before persisted user state is considered final.

## 6. Source and provenance model

Training content follows this provenance chain:

`Manual -> Manual revision -> Source reference -> Draft training content -> Human approval -> Published training content`

A source reference identifies manual revision and, where available, section and page.

Approved content never silently changes when a new manual revision is uploaded. A new revision may mark affected content stale and propose an update, but must not overwrite approved material automatically.

For simulator-derived checklists and procedures, the UI must distinguish between:
- source-backed simulator training content,
- and an approved operational AFM/QRH checklist.

The product may derive simulator-oriented flows from the available source set, but it must not falsely label them as approved aircraft checklists.

## 7. AI boundary

AI is a content-production assistant, not source authority.

Allowed uses include:
- extracting candidate facts, procedures and limitations from manuals,
- proposing Quick Start and system lesson structure,
- generating draft simulator checklists from supported source material,
- generating draft questions from approved/source-backed content,
- producing concise learner-friendly explanations,
- identifying possible differences between manual revisions.

AI output remains draft until required provenance and approval gates are satisfied.

## 8. Core product domains

### Aircraft
Aircraft types, variants, training status and aircraft-level navigation.

### Manuals and revisions
Controlled source documents, immutable revisions, source metadata and revision-change handling.

### First Flight
A complete normal simulator sector from Cold & Dark through Shutdown. This is the primary practical learning journey.

### Checklists and procedures
Structured normal, abnormal and emergency procedural content with reusable steps, phases, explanations, source references and trainer modes.

Required v1.0 modes:
- Learn
- Practice
- Flow
- Challenge & Response

### Cockpit orientation
Cockpit panels/regions, control locations, images/diagrams, hotspots and Show me links from training actions.

### Systems and Quick Start
Concise pilot-oriented system learning that supports actual operation rather than reproducing entire manual chapters.

### Scenarios
Abnormal and emergency practice with recognition, control priority, immediate action and checklist continuation.

### Reference
Speeds, limitations, capacities, memory items, system summaries, quick checklist access and compact FLY mode.

### Assessment
Source-linked questions, answers, attempts, scoring, explanations and weak-area identification.

### Progress
Aircraft-level completion, attempts, recently practiced content and cross-device continuation.

### Content administration
Aircraft/manual registration, draft generation, review, approval, publication and stale-content handling.

### Organizations — later
School/organization management, instructor sign-off and formal training records remain outside v1.0.

## 9. Learner information architecture

The v1.0 product should converge on six primary user-facing areas:

- Aircraft
- Learn
- Checklist
- Practice
- Reference
- Progress

Within an aircraft, the strongest entry point is:

`START HERE -> FIRST FLIGHT FROM COLD & DARK`

Source-management and content-admin interfaces are separate from the pilot learning experience and should not clutter the normal learner UI.

## 10. Anticipated persistence model

The v1.0 database is expected to grow incrementally around real product capabilities. Likely entities include:

- external user identity mapping
- aircraft_types
- aircraft_variants
- manuals
- manual_revisions
- source_references
- courses / learning_paths
- lessons
- systems_topics
- cockpit_regions
- cockpit_controls / hotspots
- procedures
- procedure_phases
- procedure_steps
- checklists
- checklist_items
- scenarios
- question_banks
- questions
- answers
- user_aircraft_progress
- procedure_attempts
- quiz_attempts
- weak_area_state
- content_approvals

Do not create the full schema speculatively. Add tables with the corresponding product milestone while preserving stable identifiers and provenance.

## 11. Safety and integrity invariants

- publishable technical content requires at least one source reference,
- publishable technical content requires explicit approval,
- approved content is not automatically overwritten by AI or newer manual revisions,
- manual revisions are immutable evidence objects,
- source provenance survives edits to training presentation,
- learner progress is separate from source-content approval state,
- Logbook regulatory evidence is never rewritten by Training,
- a simulator-derived checklist is never presented as an approved aircraft checklist unless the source set explicitly supports that status,
- normal training defaults to Cold & Dark -> Shutdown.

## 12. Deployment and development boundary

Training has its own GitHub repository and Vercel project.

`main` is the canonical long-lived branch. Product work uses short-lived feature/fix branches, candidate-first verification and PR merge after green CI.

Vercel production follows `main` and serves `training.fly-tally.com`.

The Learjet reference implementation may evolve incrementally in production during development, but the product must not be called v1.0 complete until the v1.0 acceptance scope in `ROADMAP.md` and `FEATURES.md` is satisfied.

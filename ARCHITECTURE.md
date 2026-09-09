# FlyTally Training Architecture

## 1. Product boundary

FlyTally Training is a separate web application and repository from FlyTally Logbook.

The intended deployment boundary is `training.fly-tally.com`. FlyTally Logbook remains responsible for operational flight records, certification evidence and regulatory logbook functions. Training is responsible for learning content, procedures, checklists, assessment and progress.

No runtime code is imported directly from the Logbook repository. Shared capabilities should become explicit contracts or shared services only when a real cross-product requirement exists.

## 2. Technology baseline

- Next.js 16
- React 19
- TypeScript with strict checking
- server-first application architecture
- PostgreSQL is the expected persistence layer when product data is introduced

The database is deliberately not introduced in the foundation commit. Schema design follows the approved product model rather than being inherited from Logbook.

## 3. Identity boundary

Training should ultimately use the same FlyTally account identity as Logbook, without duplicating user accounts.

Until a shared identity contract is implemented:

- do not copy Logbook auth code into Training,
- do not query the Logbook database directly,
- do not treat Logbook session internals as a public API,
- keep Training user references ready for an external/stable FlyTally user identity.

A later identity phase should define a narrow SSO/session contract and migration strategy before authenticated product data is created.

## 4. Authoritative content model

Training content follows this provenance chain:

`Manual -> Manual revision -> Source reference -> Draft training content -> Human approval -> Published training content`

A source reference identifies the manual revision and, when available, section and page. Approved content never silently changes when a new manual revision is uploaded.

When a manual is revised, affected approved content should be marked for review. New extraction may propose updates, but it must not overwrite approved material automatically.

## 5. AI boundary

AI is an assistant, not an authority.

Allowed uses include:

- extracting candidate procedures and facts from uploaded manuals,
- proposing lesson structure,
- generating draft questions from approved source material,
- explaining approved material in learner-friendly language,
- identifying possible differences between manual revisions.

AI output remains draft until the required provenance and approval gates are satisfied.

## 6. Core product domains

### Aircraft
Aircraft types and training variants. A course is tied to an explicit aircraft/type context rather than an ambiguous free-text label.

### Manuals
Source documents and immutable manual revisions. Each revision has its own identity and source metadata.

### Courses
Courses, modules and lessons built from approved content.

### Procedures and checklists
Structured procedural training, including normal, abnormal and emergency material. Planned trainer modes include Learn, Practice, Flow and Challenge & Response. Memory items require explicit source provenance.

### Assessment
Question banks, questions, answers, attempts and scoring. Questions should retain source references to the material they assess.

### Progress
Enrollment, lesson completion, procedure practice and assessment attempts.

### Organizations — later
School/organization management, instructor sign-off and formal training records are intentionally deferred until the individual training product is proven.

## 7. Anticipated persistence model

The expected first database model includes:

- users / external user identity mapping,
- aircraft_types,
- manuals,
- manual_revisions,
- manual_sources or source_references,
- courses,
- modules,
- lessons,
- procedures,
- procedure_steps,
- checklists,
- checklist_items,
- question_banks,
- questions,
- answers,
- enrollments,
- progress,
- attempts.

This is an architectural target, not permission to create all tables at once. Add persistence incrementally with each product capability.

## 8. Safety and integrity invariants

- publishable technical content requires at least one authoritative source reference,
- publishable technical content requires explicit approval,
- approved content is not automatically overwritten by AI or a newer manual revision,
- manual revisions are immutable evidence objects,
- source provenance survives edits to training presentation,
- learner progress is separate from source-content approval state,
- Logbook regulatory evidence is never rewritten by Training.

## 9. Deployment boundary

Training will receive its own Vercel project and deployment lifecycle. Do not attach this repository to the existing Logbook Vercel project.

A production deployment is intentionally deferred until the application foundation, dependency lockfile and verification gate are stable.

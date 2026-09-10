# M9 — Universal Aircraft Training Architecture

## Product rule

FlyTally Training is an aircraft-training platform, not a Learjet-shaped application.

Adding an aircraft must remain a content operation. Learner-facing application code must not branch on aircraft ID, manufacturer, engine count, systems installed or aircraft category.

## Modular aircraft model

An aircraft consists of identity, variants/configuration and any subset of published training modules. No module is globally mandatory.

First-class M9 domains:

- `checklists`
- `procedures`
- `performance`
- `limitations`
- `systems`
- `abnormal`
- `flows`
- `avionics`
- `knowledge`

The existing `learning`, `normal-flight`, `orientation` and `reference-knowledge` domains remain temporary migration adapters for the current Learjet seed.

Cockpit orientation is not part of M9 release completeness and is removed from the primary learner path for now.

## Checklist versus procedure

A checklist is concise operational verification. Each item can contain a challenge, response, optional short explanation, verification cue and a link to a detailed procedure.

A procedure is the deeper learning object. It can contain prerequisites, ordered actions, expected results, verification criteria, rationale and warning/caution/note items.

The same checklist data can drive Learn, Practice, Flow and Challenge & Response modes without copying the aircraft content.

## Performance

Performance is structured data, not aircraft-specific UI code. A performance dataset declares axes, outputs, rows and interpolation policy. The initial contract supports lookup/reference tables and explicitly defaults to no interpolation.

Examples include weight/flap-to-speed tables, altitude/temperature-to-power tables and landing-weight-to-VREF tables. More complex calculators can be added as new generic dataset kinds later without creating a Boeing or Bristell component.

## Applicability

Training records may carry applicability metadata for variants and equipment. This allows one aircraft family to support different engines, avionics and installed options without branching in React code.

A missing module means exactly that: the aircraft does not publish that training area. The UI must not invent or display an irrelevant placeholder curriculum.

## Source policy

FlyTally stores revision-aware provenance for published technical content. The product does not maintain separate real/simulator modes. The learner experience is organized as aircraft training, with a general operational disclaimer that current approved aircraft, operator and regulatory documentation remains authoritative for flight operations.

## Acceptance target

M9 is proven when two structurally different aircraft can be published through the same database/admin pipeline — for example a simple single-engine aircraft and a transport-category jet — and each exposes only its applicable modules without adding aircraft-specific routes, components or source-code branches.

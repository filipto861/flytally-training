# M33 — New Module Composer

## Goal

Make structured authoring usable for a brand-new aircraft/module without requiring an existing payload, AI generation, raw JSON, or aircraft-specific source-code registration.

## Product flow

`Content Studio → Start module → Structured Builder → governed human draft → review → approve → publish`

## Supported modern domains

- checklists
- procedures
- performance
- limitations
- systems
- flows
- avionics
- knowledge
- abnormal & emergency

Legacy content domains remain readable and governable but are not offered as the creation model for new aircraft.

## Safety and provenance boundary

Starter payloads contain structure only. They intentionally do not pre-fill aircraft facts, procedures, limits, performance values, or control positions. A technical draft still requires at least one governed exact source reference before it can be stored.

The composer writes only through `createGovernedDraftVersion` with `origin: human`. It does not approve, publish, mutate a live version, or write directly to the learner content store.

## Abnormal authoring

Universal abnormal/emergency detection is shape-based for authoring drafts, so an empty structured template is not misclassified as the legacy abnormal contract merely because its text fields have not yet been filled.

## Database / deployment

No schema migration is required. M33 adds authoring UI and starter-template logic above the existing governed PostgreSQL content lifecycle.

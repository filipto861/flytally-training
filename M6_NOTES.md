# M6 implementation note

M6 introduces an aircraft-agnostic activity event contract for learner progress. Interactive checklist completions, abnormal scenario completions and knowledge attempts write browser-local events keyed by `aircraftId`.

This is intentionally a persistence adapter, not the final store. M7 replaces browser-local storage with account-backed persistence while keeping the event/domain contract and learner-facing progress UI stable.

Quick Reference and Knowledge are also exposed through `TrainingContentRepository`; learner pages do not import aircraft-specific reference/question registries directly.

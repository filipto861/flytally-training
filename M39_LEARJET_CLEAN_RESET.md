# Learjet clean reset

The previous Learjet training package has been retired completely before the aircraft is rebuilt from a new controlled manual set.

## Reset boundary

- no Learjet aircraft is compiled into the static catalog;
- no Learjet source/manual identity is compiled into the application;
- no Learjet checklist, procedure, system, performance, limitation, knowledge, flow, cockpit-orientation or abnormal payload remains in the active library;
- the static content seed is intentionally empty and therefore cannot repopulate retired content during a deploy or database bootstrap;
- the universal content contracts, learner runtime, Content Studio, governance workflow and performance-calculation engine remain intact;
- an empty published catalog is treated as a valid operational rebuild state, while any future published aircraft must still satisfy the normal modular-content and freshness readiness rules.

## Re-onboarding

Learjet content must be created again from new source records through the governed database workflow. Old manual IDs, values and migrated payloads are not reused as a fallback.

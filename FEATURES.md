# FlyTally Training v1.0 Feature List

FlyTally Training v1.0 is the first complete product release. The Learjet 35/36 is the reference aircraft used to prove every v1.0 capability end-to-end before the product is considered complete.

## Product goal

A simulator pilot should be able to pick up an unfamiliar aircraft, understand only what matters, start from cold & dark, fly a complete normal sector, shut the aircraft down, practice procedures, review essential systems and build confidence without spending days reading the full manual.

Target first-aircraft learning time: roughly 2-4 focused hours before a competent first simulator flight.

## Core product surfaces

### Aircraft
- aircraft library
- aircraft profile and variants
- controlled source/manual library
- current training status and progress
- clear Start Here entry point

### Learn
- Quick Start aircraft orientation
- essential system lessons
- concise pilot-focused explanations
- progressive disclosure: action -> Why? -> deeper system detail -> source
- source references to manual revision / section / page

### Checklist
- normal simulator checklist from cold & dark through shutdown
- Learn mode with explanations
- Practice mode without explanations
- Flow mode for memory-based cockpit flows followed by checklist verification
- Challenge & Response mode
- phase-specific practice, e.g. engine start only
- reset and progress state
- simulator-oriented labeling; no implication that a derived checklist is an approved AFM checklist

### Practice
- complete guided First Flight from cold & dark to shutdown
- cockpit orientation
- normal procedures
- abnormal and emergency scenarios
- memory-item practice where supported by source material
- random/targeted procedure practice

### Reference
- limitations
- important speeds
- engine limits
- fuel capacities
- pressurization references
- memory items
- systems reference
- checklist quick access
- full controlled manual/source references
- compact FLY mode for use while actually flying the simulator

### Progress
- aircraft-specific completion
- checklist/procedure attempts
- quiz attempts and scores
- weak-area identification
- recently practiced items
- cross-device persistence

## First Flight experience

The default training experience always starts with a fully cold & dark aircraft and ends with shutdown / cold & dark.

The guided normal flight covers:
1. cockpit setup / power-up
2. engine start
3. taxi
4. before takeoff / lineup
5. takeoff
6. climb
7. cruise
8. descent
9. approach
10. landing
11. after landing
12. shutdown

The First Flight experience is the primary learning path. Manual chapter order is reference structure, not the learner journey.

## Cockpit orientation

v1.0 must support practical switch/panel orientation:
- cockpit regions/panels
- item-to-location mapping
- Show me from checklist/procedure items
- cockpit images or diagrams with highlighted locations
- orientation practice independent from the full flight

A 3D cockpit is not required for v1.0.

## Essential systems

Each important system should follow a consistent short format:
- what it does
- what powers/feeds it
- what the pilot controls
- what the pilot monitors
- normal configuration
- common failure implications
- short knowledge check
- source references

Learjet 35/36 baseline systems:
- electrical
- fuel
- powerplant
- hydraulics
- pneumatics / bleed air
- pressurization
- flight controls
- anti-ice / rain protection
- landing gear and brakes

## Abnormal and emergency training

v1.0 includes scenario-based practice for the reference aircraft, prioritizing simulator-relevant events such as:
- engine failure
- engine fire
- rejected takeoff
- generator failure
- hydraulic failure
- pressurization failure / decompression
- anti-ice related failures
- landing gear / flap abnormalities where supported by the source set

Scenarios must teach aircraft control, recognition, immediate actions and checklist use rather than merely display text.

## Knowledge and assessment

- source-linked question bank
- short quizzes by system/procedure
- immediate explanation after answers
- targeted weak-area review
- procedure/memory-item recall checks
- scoring and attempt history

The goal is reinforcement, not an airline-style exam simulator.

## Content engine and administration

v1.0 must make adding the next aircraft materially easier than hand-coding the Learjet.

Required administration workflow:
- create aircraft/type and variants
- upload/register manuals
- immutable manual revisions
- revision metadata
- source section/page references
- AI-assisted extraction into drafts
- draft lesson/procedure/checklist/question generation
- human review/edit
- explicit approval
- publish
- revision-change detection / stale-content flagging

AI output is never silently published or treated as source authority.

## Accounts and persistence

v1.0 includes real persisted user state:
- FlyTally user identity
- saved progress
- checklist/procedure attempts
- quiz history
- aircraft learning state
- cross-device continuation

Training should share FlyTally identity with Logbook through an explicit account/session contract, not by copying Logbook internals or directly coupling databases.

## Learjet 35/36 reference implementation acceptance

v1.0 is not complete until Learjet 35/36 demonstrates all major product capabilities in production:
- Quick Start
- cockpit orientation
- Cold & Dark -> Shutdown guided First Flight
- complete normal simulator checklist
- Learn / Practice / Flow / Challenge & Response modes
- essential systems
- abnormal/emergency scenarios
- limitations and Quick Reference / FLY mode
- quizzes and weak-area review
- persistent progress
- source provenance
- manual/revision administration workflow

The Learjet is a testbed and reference implementation, not a special-case architecture. New aircraft must use the same product model.

## Explicitly outside v1.0

- flight-school administration
- instructor/student organization management
- regulatory training records or certificates
- LMS/SCORM-style enterprise features
- native mobile apps
- 3D cockpit rendering
- direct MSFS/X-Plane telemetry or switch-state tracking
- multiplayer crew synchronization
- voice recognition as a required workflow

These may be considered after the individual simulator-training product is proven.

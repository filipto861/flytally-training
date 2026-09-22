# UX6.1 — Shell + IA Reference Concept

**Status:** READY FOR PRODUCT-OWNER GATE A  
**This document is a wireframe/specification, not implementation.**

## 1. Canonical IA

Keep the five top-level destinations:

```
AIRCRAFT
PROCEDURES
PERFORMANCE
TRAINING
FLIGHT
```

Secondary destinations stay under their existing parent. The redesign changes presentation, not route ownership.

## 2. Desktop shell

Target structure:

```text
┌────────┬─────────────────────────────────────────────────────────────────────────────┐
│        │ Learjet 35A   ·   Variant/Profile           Search      Active flight  User │
│  NAV   ├─────────────────────────────────────────────────────────────────────────────┤
│  RAIL  │                                                                             │
│        │  PAGE / WORKSPACE                                                            │
│  A     │                                                                             │
│  P     │  Task-specific 12-column layout                                              │
│  P     │                                                                             │
│  T     │  - Procedures: navigator | procedure | context                              │
│  F     │  - Performance: inputs | results                                             │
│        │  - Flight: lifecycle/status | brief/dependencies                             │
│        │                                                                             │
│        │                                                                             │
│        ├─────────────────────────────────────────────────────────────────────────────┤
│        │ Quick actions integrated with aircraft context: CHECKLIST · QRH · PERF · REF│
└────────┴─────────────────────────────────────────────────────────────────────────────┘
```

### Navigation rail

Target width: 68–76 px.

Each item has:

- simple icon;
- short accessible label;
- active indicator using shape + contrast, not color alone;
- tooltip/expanded label available without permanently widening the content.

The rail represents only the five canonical top-level IA destinations.

Systems and Reference must appear through contextual/sub-navigation, not by silently adding two more primary destinations.

### Aircraft context bar

One row only.

Left:
- aircraft display name;
- selected configuration/profile, subordinate.

Center/utility:
- global aircraft search.

Right:
- active-flight status/action;
- user/settings.

Avoid current “small metadata capsules everywhere” composition.

### Fast path

Desktop concept: integrate it as **aircraft quick actions**, not a floating pill.

Preferred placement for reference implementation:
- bottom edge of the aircraft context/sidebar region or a compact shell dock;
- visually anchored to the shell;
- still opens the existing modal/drawer fast-path panel;
- keyboard shortcuts preserved.

## 3. Desktop Procedures reference

```text
┌───────────┬──────────────────────────────────────┬─────────────────────┐
│ PHASES /  │ BEFORE START                         │ CONTEXT             │
│ PROCEDURES│ Normal · 8 items                     │                     │
│           │                                      │ Applicability       │
│ Search    │ □ Battery .................... ON     │ Source              │
│           │ □ Beacon ..................... ON     │ Notes               │
│ Preflight │ □ Fuel ....................... CHECK  │ Related reference   │
│ Before    │ □ Avionics ................... OFF    │                     │
│ Start  ●  │                                      │                     │
│ Taxi      │                                      │                     │
│ Takeoff   │                                      │                     │
│ ...       │                                      │                     │
│           │                         Prev   Next   │                     │
└───────────┴──────────────────────────────────────┴─────────────────────┘
```

Principles:

- checklist content gets the largest pane;
- procedure/phase selection never competes visually with the content;
- reset belongs in a low-emphasis overflow/action area;
- source context is available without interrupting scan flow.

## 4. Desktop Performance reference

```text
┌─────────────────────────────┬────────────────────────────────────────────┐
│ TAKEOFF INPUTS              │ TAKEOFF RESULT                             │
│                             │                                            │
│ Airport / runway            │ N1                     94.2 %              │
│ OAT                         │ V1                     121 kt              │
│ Pressure altitude           │ VR                     126 kt              │
│ Weight                      │ V2                     135 kt              │
│ Configuration               │                                            │
│                             │ TODR                   4,820 ft            │
│ [ Calculate ]               │ ASD                    4,540 ft            │
│                             │                                            │
│                             │ Validity / active-flight dependency        │
└─────────────────────────────┴────────────────────────────────────────────┘

Sources / assumptions  ▸
```

Results become visually dominant after calculation. Do not render input and output as a series of equal cards.

## 5. Desktop Flight reference

```text
ACTIVE FLIGHT                                    ACTIVE
LKPR 24  →  LOWW 29

┌────────────────────────────────┬─────────────────────────────────────────┐
│ FLIGHT CONTEXT                 │ READINESS / DEPENDENCIES                │
│ Departure / destination        │ Performance result                      │
│ Runway                         │ Checklist state                         │
│ Conditions                     │ Relevant notices                       │
│ Aircraft configuration        │                                         │
└────────────────────────────────┴─────────────────────────────────────────┘

FLIGHT BRIEF
[ task-specific brief content ]

RECENT FLIGHTS / ARCHIVE
```

The lifecycle state is obvious before secondary details.

## 6. iPad landscape

```text
┌──────┬────────────────────────────────────────────────────────────┐
│ rail │ aircraft context                                           │
├──────┼───────────────┬────────────────────────────────────────────┤
│      │ selector/list │ main task                                  │
│      │               │                                            │
│      │               │                                            │
└──────┴───────────────┴────────────────────────────────────────────┘
                         context → drawer when required
```

## 7. iPad portrait

- drawer or icon rail;
- full-width primary content;
- secondary context opens as sheet/drawer;
- bottom operational fast path remains reachable.

## 8. Mobile shell

```text
┌────────────────────────────────┐
│ ‹  Learjet 35A     Before Start│
├────────────────────────────────┤
│ BEFORE START                   │
│                                │
│ □ Battery ................. ON │
│ □ Beacon .................. ON │
│ □ Fuel .................... CK │
│ □ Avionics ................ OFF│
│                                │
│                     Next  →    │
├────────────────────────────────┤
│ CHECK   QRH    PERF     REF    │
└────────────────────────────────┘
```

Phase/procedure selection opens from the title or a compact selector into a bottom sheet.

No permanent stack of:
- search;
- phase filter;
- procedure selector;
- page title;
- extra metadata;
before the first actionable checklist item.

## 9. Library concept

Library must use the same design tokens, typography and shell language.

Desktop:

```text
FLYTALLY TRAINING
Your aircraft                                   Search

┌─────────────────────────────────────────────────────────────────┐
│ Learjet 35A                            Available      Open  →    │
│ Learjet 35A / governed profile                                  │
└─────────────────────────────────────────────────────────────────┘
```

Do not style it like a separate public marketing page.

## 10. Systems unavailable concept

When the Learjet Systems module is not published/applicable, keep the user inside the aircraft workspace:

```text
SYSTEMS

No published Systems package is available for this aircraft configuration.

The application has no governed Systems content to display.
[ Back to Aircraft ]     [ Open Reference ]
```

No generic global 404-style surface.

## 11. Gate A decision required

Before UX6.2 or broad visual code:

Product owner must answer whether this **shell and interaction architecture** is the desired direction.

Approval means:
- five-destination primary IA stays;
- compact rail/context-bar workspace accepted;
- desktop task-specific multi-pane layouts accepted;
- mobile content-first + bottom-sheet navigation accepted;
- detached desktop fast-path pill is retired.

If rejected, revise UX6.1 without touching the production visual implementation.

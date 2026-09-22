# P5 — Operational Fast-Path Inventory

**Phase:** P5.1  
**Status:** inventory / frozen-boundary contract  
**Branch:** `feat/redesign-p5-operational`  
**Purpose:** establish the existing operational contracts before QRH/checklist integration work.

## 1. Frozen W3 contract

The persistent fast-path information architecture is already defined and is not
redesigned in P5:

```ts
fastPathTabs = ["checklist", "qrh", "perf", "ref"]
```

Keyboard shortcuts remain Ctrl+Shift+1..4 in that order.

P5 may fill existing slots. It must not add, remove, rename, or reorder tabs.

## 2. Current fast-path implementation

| Slot | Current implementation | P5 ownership |
|---|---|---|
| CHECKLIST | `FtFastPathChecklist` using shared checklist session | P5.4 / P5.5 convergence only |
| QRH | Placeholder | P5.2 / P5.3 |
| PERF | `FtPerformancePresentation view="operational"` | Frozen; no P5 runtime changes |
| REF | Placeholder | **Not P5** — owned by P7 |

`FtShell` currently loads checklist and performance data for the fast path.
It does not yet load abnormal/emergency content for QRH.

## 3. Existing QRH source of truth

P5 does **not** create a new QRH or emergency model.

The existing M50/M54 operational path is:

```
published "abnormal" module
→ isUniversalAbnormalEmergencyContent
→ filterAbnormalEmergencyForConfiguration
→ toOperationalEmergency
→ OperationalEmergency
```

The existing `/fly` route already demonstrates this path.

### Authority boundary

Operational QRH may expose source-backed operational data such as:

- scenario title/category/phase
- expected response/actions
- warning/caution/note content
- configuration/boundary notes
- stage source references

Training-only fields must not leak into QRH presentation:

- `setup`
- `objectives`
- `debrief`
- stage `prompt`
- stage `explanation`
- `minutes`
- `difficulty`

Legacy abnormal training must not be promoted into the new-shell QRH merely
because it can be normalized for training.

## 4. Checklist session inventory

Checklist training and W3 fast-path checklist already share the canonical key:

```
checklistSessionStorageKey(...)
→ flytally-training-checklist-session:<aircraft>:<variant>:<title>
```

Both use `sessionStorage` and `ChecklistSessionSnapshot`.

A second legacy operational implementation still exists in
`components/operational-checklist.tsx`:

```
flytally:flight-checklist:v1:<aircraft>:<variant>:<title>
```

It uses `localStorage` and its own `StoredFlightChecklist` shape. This is the
P5.5 migration boundary. P5.1 does not migrate it.

## 5. P5 sub-slice boundaries

### P5.2 — QRH data adapter

- load only published universal abnormal content
- require existing validation
- apply selected-aircraft configuration filtering
- reuse `toOperationalEmergency`
- no legacy abnormal fallback
- no aircraft-name branching

### P5.3 — QRH fast-path presentation

- reuse `OperationalEmergency` behavior from M50/M54 where practical
- fill the existing W3 QRH slot
- preserve panel focus/escape behavior
- no second emergency presentation model

### P5.4 — checklist operational convergence

- preserve canonical `checklistSessionStorageKey`
- preserve one shared checklist session between training and fast path
- eliminate behavioral divergence only where required
- do not rewrite the checklist training modes

### P5.5 — legacy checklist migration

Migration is isolated from ordinary UI work. Required invariants:

- detect legacy key safely
- validate legacy payload
- map only known phase/item identities
- canonical write is authoritative
- repeated migration is a no-op
- malformed/stale payload fails closed
- legacy state cannot resurrect after canonical state exists

### P5.6 — acceptance

- deterministic generic fixture
- Node guards
- four Playwright projects
- flag-off legacy behavior preserved until C4b

## 6. Frozen / out-of-scope

P5 must not change without an explicit blocker:

- W3 tab names/order or shortcut mapping
- performance calculator/runtime files
- P4 procedure runtime/session ownership
- D0 Active Flight lifecycle
- P6 Scenario/Debrief runtime
- P7 REF implementation
- aircraft-specific rendering branches
- source-governance rules

## 7. P5.1 exit criteria

P5.1 is complete when:

1. W3 tab contract is recorded and executable-guarded.
2. Existing M50/M54 QRH pipeline is recorded and executable-guarded.
3. Shared checklist session vs. legacy operational checklist storage split is explicit.
4. REF ownership is explicitly P7, not P5.
5. No runtime/UI behavior changes are introduced by P5.1.

# FlyTally Training — Redesign Roadmap (W / P / C)

**Status:** Active  
**Last updated:** 2026-09-22  
**Owner:** Filip Točík  
**Scope:** Aircraft workspace redesign, new shell (`FT_NEW_SHELL`), legacy retirement

---

## 0. Why this document exists

The redesign sequence (W0–W3 → P0–P6 → C0–C4) was previously tracked across
working handoff notes, chat contexts, and executable test contracts. This
document consolidates all of them into one authoritative source.

**Rule 1:** if a phase is not in this document, it is not committed work.  
**Rule 2:** if this document disagrees with an executable test, the test wins.

---

## 1. Status legend

| Marker | Meaning |
|---|---|
| `merged` | Merged to `main` |
| `frozen` | Merged and intentionally not modified without explicit unfreeze |
| `gated` | Merged but only active behind `FT_NEW_SHELL=true` |
| `in-progress` | Active work on a feature branch |
| `planned` | Not yet started |
| `blocked` | Waiting on a dependency |
| `TBD` | Not yet determined |

---

## 2. Completed phases

### 2.1 Foundation (F)

| ID | Name | Contract | Commit | Status |
|---|---|---|---|---|
| F0 | Aircraft workspace foundation | `redesign-f0-workspace-foundation.test.ts` | `4e7e94a7` | `merged` `frozen` |
| F1 | (no standalone merge commit — closed as part of foundation) | — | — | `frozen` |
| F2 | New shell feature flag (`FT_NEW_SHELL`) | `redesign-f2-feature-flag.test.ts` | `7cc55193` | `merged` `frozen` |
| F3 | Playwright + iPad acceptance | `redesign-f3-playwright-config.test.ts` | `a8149025` | `merged` `frozen` |

### 2.2 New shell workspace (W)

| ID | Name | Contract | Commit | Status |
|---|---|---|---|---|
| W0 | Persistent aircraft shell | `redesign-w0-shell.test.ts` | `e5d58811` | `merged` `frozen` |
| W1 | Central content IA | `redesign-w1-content-ia.test.ts` | `2f28c5e2` | `merged` `frozen` |
| W2 | Global aircraft search | `redesign-w2-search.test.ts` | `f9c4318a` | `merged` `frozen` |
| W3 | Persistent fast path | `redesign-w3-fast-path.test.ts` | `a6eb4c52` | `merged` `frozen` |

### 2.3 New shell slices (P) — completed

| ID | Name | Contract | Commit | Status |
|---|---|---|---|---|
| P0 | Aircraft launch surface | `redesign-p0-launch-surface.test.ts` | `6a51ff8a` | `merged` `gated` |
| P1 | Flight Brief workspace | `redesign-p1-flight.test.ts` | `16e9cb86` | `merged` `gated` |
| D0 | Active Flight domain | (D0 suite) | `29211612` | `merged` `gated` |
| P2 | Performance presentation | `redesign-p2-performance.test.ts` | `1e4944c8` | `merged` `gated` |
| P3 | Systems + 2D Interactive Schematic | `redesign-p3-systems.test.ts` | `8b4e53c8` | `merged` `gated` |

### 2.4 Procedures (P4) — in progress

**Branch:** `feat/redesign-p4-procedures`  
**Last commit:** `cff66a7d`  
**Contract:** `redesign-p4-procedures.test.ts`

| Sub-slice | Content | Status |
|---|---|---|
| P4.1 | Procedure presentation helpers | ✅ done |
| P4.2 | Learn + Relevance views | ✅ done |
| P4.3 | Operate wrapper | ✅ done |
| P4.4 | Procedures page / index / detail | ✅ done |
| P4.5 | ProcedureBrowser integration + route gating | ✅ done |
| P4.6 | Deterministic procedures fixture | ✅ done (unit gate 884 / 883 / 0 / 1) |
| P4.7 | Procedures acceptance (e2e) | ✅ done — 284/284 (2026-09-22) |
| P4.8 | Final gate / PR / merge | 🔲 not started |

**Known debt (out of P4 scope):** `ProcedureLinearRunner` toggle changes
accessible name (`Complete` → `Uncheck`) together with `aria-pressed`. Pre-existing
frozen behavior. Candidate for a dedicated cleanup issue.

---

## 3. Current state

```
main:                        8b4e53c8 (P3)
feat/redesign-p4-procedures: cff66a7d (P4.7 verified)
production:                  FT_NEW_SHELL = OFF
```

**Playwright projects:** `desktop-chromium`, `mobile-chromium`, `ipad-landscape`, `ipad-portrait`  
**Pre-P4 baseline:** 252 passed (63 × 4)  
**P4.7 verified:** 284 passed (71 × 4)

---

## 4. Remaining phases

### 4.1 P5 — Operational fast-path closure

P5 does not introduce a new emergency model. M50 / M54 already own the
operational QRH layer. P5 fills the existing W3 fast-path slots and unifies
operational behavior.

**W3 fast-path contract is frozen:**

```
fastPathTabs = ["checklist", "qrh", "perf", "ref"]
```

| Sub-slice | Content | Size |
|---|---|---|
| P5.1 | Operational contract inventory + frozen boundaries (read-only) | S |
| P5.2 | QRH fast-path data adapter (validated universal abnormal → operational Emergency DTO) | M |
| P5.3 | QRH fast-path presentation (reuse `OperationalEmergency`, keep M54 behavior) | M |
| P5.4 | Checklist operational convergence (one `checklist-session` contract) | M |
| P5.5 | Legacy checklist state compatibility (`flytally:flight-checklist:v1:*` → shared session) | **M/L** |
| P5.6 | Acceptance / fast-path closure (Node + 4× Playwright) | M |
| P5.7 | REF fast-path closure — **owner to be decided before C4a** | TBD |

**P5 overall = M** (L if REF is included in P5).

**P5 exit criteria:**
- W3 tab contract unchanged
- QRH no longer a placeholder
- QRH uses M50/M54 operational model, not a new emergency model
- QRH renders only published, validated, configuration-applicable operational content
- Training-only fields (`setup/prompt/explanation/debrief/difficulty`) never appear in QRH
- Fast-path checklist and Checklist training use one `checklistSessionStorageKey`
- Legacy checklist state compatibility explicitly resolved
- Flag OFF is unchanged
- No aircraft-specific branch
- Node + 4× Playwright green

**REF decision (blocker before C4a):** the persistent fast path must not ship
with a placeholder. Either P5.7 is added to P5 or REF gets its own slice with
an explicit owner.

### 4.2 P6 — Training hub + Scenario + Debrief

Training hub is **not a new top-level destination.** The frozen IA already has
`TRAINING` (Quick Start / Orientation / Cold & Dark / Progress), and
`/aircraft/[id]/training` already exists as a capability-driven hub. P6 adds
new-shell presentation under the existing TRAINING section.

Scenario does **not** use the M1-E2A procedure graph runtime. The procedure
graph is an execution model; scenario is a reveal/debrief training model.
P6 reuses the existing abnormal/scenario domain — it does not fork a third
procedure runtime.

| Sub-slice | Content | Size |
|---|---|---|
| P6.1 | New-shell Training hub (`FtTrainingPage` under existing `/training`) | M |
| P6.2 | Scenario projection from universal abnormal content | M |
| P6.3 | Scenario session controller (extract from `ScenarioTrainer`, no graph fork) | M |
| P6.4 | Debrief + targeted repeat (source-defined, no AI scoring) | M |
| P6.5 | Progress integration + Active Flight lifecycle boundary | M |
| P6.6 | Deterministic fixture + Node + 4× Playwright acceptance | M |

**P6 overall = L.**

**Debrief placement:** inside TRAINING scenario lifecycle, not P1 Flight Brief.

**D0 Active Flight:** no hard dependency. Scenario training must not create,
mutate, or archive an Active Flight. A future explicit context handoff can be
its own slice.

**P6 exit criteria:**
- `/training` works in new shell as existing top-level TRAINING
- Scenario is source/configuration governed
- Reveal/debrief state is not procedure graph execution state
- Debrief is source-defined
- Completion enters the existing progress stream
- No implicit inference/scoring
- No D0 lifecycle side effects
- Flag OFF legacy unchanged
- Generic fixture + Node + 4× Playwright green

### 4.3 Cleanup (C0–C3)

| ID | Name | Depends on | Blocker |
|---|---|---|---|
| C0 | Operational offline data package | P0–P6 | Yes (before C4a) |
| C1 | Old route compatibility closure | C0 | Yes |
| C2 | Remove proven-unused legacy nav/UI | C1 | Yes |
| C3 | Update architecture docs | C2 | Yes |

### 4.4 C4 — Release flip (staged)

> **Critical:** C4 is not one step. Canary, global flip, and flag removal
> are three distinct stages separated by observation windows.

| Stage | Action | Rollback | Minimum duration |
|---|---|---|---|
| **C4a.0a** | Filip-only canary (account-subject allowlist) | Env change | 24–72 h |
| **C4a.0b** | Small beta cohort (2–3+ subjects) | Env change | ≥ 7 days |
| **C4a.1** | Global `FT_NEW_SHELL=true` | Env change | ≥ 2 weeks |
| **C4b** | Remove flag, delete legacy code | Code rollback / redeploy only | — |

**Canary mechanism:** server-side account-subject allowlist
(`FT_NEW_SHELL_CANARY_SUBJECTS`). Allowlist must never enter the client bundle.
Email is not part of rollout identity.

**Rollback after C4b:** no flag rollback exists. Only code rollback / redeploy
is possible, without ability to run both shells in parallel.

---

## 5. Release checklist

### 5.1 C4a — pre-conditions (before any flip)

**Code & tests**
- [ ] P0–P6 merged
- [ ] C0–C3 merged
- [ ] REF fast-path slot has explicit owner and is not a placeholder
- [ ] `npm run verify` green on `main`
- [ ] Current Playwright suite green on all 4 projects (P4 baseline: 284/284)
- [ ] No `skip` in redesign-specific tests

**Migration blockers**
- [ ] Legacy `OperationalChecklist` localStorage → shared checklist session migration implemented, idempotent, fail-closed
- [ ] Migration invariant: legacy state cannot resurrect after canonical write
- [ ] Malformed/obsolete legacy payload fails closed

**CI / infrastructure blockers**
- [ ] GitHub Actions runner/billing state resolved
- [ ] Hosted CI runs actual steps (not empty 8–9 s failures)
- [ ] `verify.yml` and browser smoke are authoritative again

**Observability**
- [ ] `/api/release-state` endpoint returns `shellRollout: off|canary|global` and `deploymentSha`
- [ ] Allowlist never exposed in response
- [ ] Runtime error visibility with correlation/request ID
- [ ] Errors filterable by `legacy | new`
- [ ] 404/5xx dashboard (or equivalent query) active
- [ ] Production synthetic smoke for new-shell routes
- [ ] Sentry optional; existence of a fast regression signal mandatory

**Performance (baseline before budget)**
- [ ] Legacy + new shell measured on same target hardware/network
- [ ] Baseline documented (LCP, route/bundle delta, interaction long tasks)
- [ ] Release regression budget agreed
- [ ] C4a gates against this budget
- [ ] `>200 ms` long tasks recorded as candidate guardrail, not as SLA yet

**Accessibility**
- [ ] Keyboard-only navigation verified
- [ ] Focus order and focus return verified
- [ ] Screen reader pass (VoiceOver or NVDA)
- [ ] Contrast audit
- [ ] Reduced motion
- [ ] Forced colors
- [ ] Touch targets (44px boundary)
- [ ] Narrow phone (375px) and iPad both verified

**Operational**
- [ ] Rollback procedure documented and rehearsed
- [ ] Communication plan: who is notified, what they are told
- [ ] Bug report channel communicated
- [ ] Beta cohort identified (subjects, not emails)

### 5.2 C4a.1 — global flip pre-conditions

- [ ] C4a.0a ran 24–72 h with no rollback
- [ ] C4a.0b ran ≥ 7 days with no rollback
- [ ] No P0–P6 regression issues open
- [ ] Beta feedback reviewed and triaged

### 5.3 C4b — flag removal pre-conditions

- [ ] C4a.1 ran ≥ 2 weeks with no rollback event
- [ ] Legacy route traffic measured (~0)
- [ ] Data migration completed (§7)
- [ ] Architecture docs already reflect new shell as canonical
- [ ] Changelog entry written

---

## 6. Rollback strategy

| Stage | Rollback mechanism | RTO |
|---|---|---|
| Before C4a.0a | `FT_NEW_SHELL=OFF` (already default) | N/A |
| C4a.0a | Remove subject from canary allowlist / disable canary | Operationally dependent on environment rollout |
| C4a.0b | Remove subjects from canary allowlist / disable canary | Operationally dependent on environment rollout |
| C4a.1 | Env change `FT_NEW_SHELL=false` | Operationally dependent on environment rollout |
| After C4b | No flag-based rollback; use normal code rollback/redeploy | Deployment-dependent |

**Implication:** the C4a observation windows preserve a simple feature-flag
rollback path before legacy removal. C4b must not proceed until the global
observation window has completed without a rollback event.

---

## 7. Data migration (legacy → new shell)

Storage contracts reviewed against current repo.

| State | Storage | Migration |
|---|---|---|
| Checklist training `/checklists` | `sessionStorage`, `checklistSessionStorageKey()` | **None** (already shared with W3 fast path) |
| W3 fast-path checklist | same `checklistSessionStorageKey()` | Already shared |
| Legacy Fly `OperationalChecklist` | `localStorage`: `flytally:flight-checklist:v1:*` | **Open migration concern** — must be resolved before C4a |
| P4 procedure session | existing `ProcedureBrowser` + procedure session | None (P4 reuses existing contract) |
| D0 Active Flight | `flytally-training:active-flight:v1:<aircraft>` + server | None shell-specific |
| P2 performance result | `flytally-training:performance-result:v1:<aircraft>:<activeFlight>` | None if key/schema stable |
| Scenario transient state | component-local `useState` (today) | P6 must decide persistence explicitly |

**Correction:** Active Flight carries `performanceDependency.snapshotId`, not
`performanceDependencyHash`. The performance result separately stores
`contextHash` and re-validates it via `computeContextHash()` on read. No
"Active Flight hash migration" exists.

**Largest remaining gap:** legacy `OperationalChecklist` localStorage → shared
checklist session. Migration invariants:
- Legacy key detected → validate payload → map only known identities →
  write canonical shared session → mark/import atomically
- Repeated migration = no-op
- Malformed/obsolete legacy state = fail closed
- Legacy state cannot resurrect after canonical write

Exit tests must cover: valid import, invalid payload, idempotence, stale/unknown
IDs, "legacy cannot resurrect after canonical write".

---

## 8. Known risks and open questions

### 8.1 Risks

| Risk | Impact | Mitigation |
|---|---|---|
| REF slot has no owner | Persistent fast path ships with placeholder | Decide REF ownership before C4a (§4.1) |
| Legacy `OperationalChecklist` migration | Users lose in-progress state on flip | P5.5 (M/L), full invariant suite |
| GitHub Actions billing/runner blocked | Cannot accept external PRs safely | Resolve in GitHub Billing before C4a |
| No error/regression signal | Blind flip, slow rollback trigger | `/api/release-state` + error visibility before C4a |
| No performance baseline | Cannot detect regression after flip | Baseline + budget before C4a |
| No a11y audit | Accessibility regressions reach users | Full-shell a11y gate before C4a |
| `ProcedureLinearRunner` a11y debt | Compounds in P5+ e2e | Dedicated cleanup issue |
| Learjet `/fly` fail-closed 404 | User-visible on flip | Content governance, tracked separately |
| P5/P6 scope larger than P4 | Release slips | Estimates done; P6 = L |

### 8.2 Open questions

| Question | Status |
|---|---|
| Beta / canary / per-user rollout strategy | **Defined:** server-side account-subject allowlist with C4a.0a → C4a.0b → C4a.1 stages |
| Post-C4b rollback mechanism | **Defined:** no flag rollback; normal code rollback / redeploy only |
| Release communication plan | **Not defined** |
| Formal standalone C4 acceptance document | **Does not exist**; §5 is the current redesign release checklist |
| S/M/L estimates for P5–C4 | **P5/P6 defined; C0–C4 still TBD** |
| Beta feedback handling | Review/triage is required before C4a.1; channel and operating process are **not defined** |

---

## 9. Authoritative sources

| Purpose | File |
|---|---|
| This roadmap (W/P/C redesign) | `REDESIGN.md` (this file) |
| Product-level release gate | `V1_RELEASE.md` |
| Product roadmap (v1.0 → v3.2) | `ROADMAP.md` |
| Executable contracts (per slice) | `tests/redesign-*.test.ts` |
| Playwright acceptance | `e2e/shell/aircraft-shell.spec.ts` |
| Release state endpoint | `/api/release-state` (to be created in C4a preconditions) |
| Open release issue | GitHub #51 — `v1.0 release certification` |

---

## 10. Changelog

| Date | Change | Author |
|---|---|---|
| 2026-09-22 | Initial consolidation from working handoff notes | Filip Točík |
| 2026-09-22 | P4.7 verified (284/284). P5/P6 scope added. C4 split into C4a.0a/0b/1 + C4b. REF, migration, CI identified as C4a blockers. | Filip Točík + DeepSeek + ChatGPT |

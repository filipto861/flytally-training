# FlyTally Training — Redesign Roadmap (W / P / UX / C)

**Status:** Active  
**Last updated:** 2026-09-22  
**Owner:** Filip Točík  
**Scope:** Aircraft workspace redesign, new shell (`FT_NEW_SHELL`), legacy retirement

---

## 0. Why this document exists

The redesign sequence (W0–W3 → P0–P7 → UX0–UX5 → C0–C4) was previously tracked across
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
| P4 | Procedures (Learn / Operate / Relevance) | `redesign-p4-procedures.test.ts` | `738b0c59` | `merged` `gated` |
| P5 | Operational fast-path closure | `redesign-p5-operational.test.ts` | `b9e910a4` | `merged` `gated` |
| P6 | Training hub + Scenario + Debrief | `redesign-p6-training.test.ts` | `28a0c014` | `merged` `gated` |
| P7 | Reference / REF fast-path closure | `redesign-p7-reference.test.ts` | `5488a9da` | `merged` `gated` |

**P4 verification:** `npm run verify` → 886 / 885 / 0 / 1, build PASS; Playwright 284/284 across desktop, mobile, iPad landscape and iPad portrait.

**P5 verification:** `npm run verify` → 908 / 907 / 0 / 1, build PASS; Playwright 288/288 across desktop, mobile, iPad landscape and iPad portrait.

**P6 verification:** targeted 14/14; `npm run verify` → 922 / 921 / 0 / 1, build PASS; Playwright 312/312 across desktop, mobile, iPad landscape and iPad portrait.

**P7 verification:** targeted 10/10; `npm run verify` → 932 / 931 / 0 / 1, build PASS; Playwright 332/332 across desktop, mobile, iPad landscape and iPad portrait.

**Known debt (out of P4 scope):** `ProcedureLinearRunner` toggle changes
accessible name (`Complete` → `Uncheck`) together with `aria-pressed`. Pre-existing
frozen behavior. Candidate for a dedicated cleanup issue.

---

## 3. Current state

```
main:                        5488a9da (P7 merged)
production:                  FT_NEW_SHELL = ON
runtime deployment:          dpl_EqXB1gwyWrG3FmpUJZt16KAo61DK (P4 runtime SHA 738b0c59)
```

**Playwright projects:** `desktop-chromium`, `mobile-chromium`, `ipad-landscape`, `ipad-portrait`  
**Pre-P4 baseline:** 252 passed (63 × 4)  
**P4.7 verified:** 284 passed (71 × 4)

**Production status:** the new shell is live for the single owner as a **development preview**. This is not the final visual design and is not the final release-complete state. Functional slices continue first, followed by an explicit full-shell UX/visual integration phase before legacy removal.

---

## 4. Remaining phases

### 4.1 P5 — Operational fast-path closure — **COMPLETE**

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

**P5 overall = M/L.** REF is no longer part of P5; it has an explicit standalone owner in P7.

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

**REF decision:** resolved. REF is owned by standalone **P7** and must be complete before final release / C4b.

### 4.2 P6 — Training hub + Scenario + Debrief — **COMPLETE**

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

### 4.3 P7 — Reference / REF fast-path closure — **COMPLETE**

P7 owns the remaining `REF` slot in the frozen W3 fast-path contract. It is a
standalone slice because reference browsing is a different concern from P5
operational checklist/QRH work and from P6 training scenarios.

P7 must reuse existing source-governed reference/quick-reference content and
routes where possible. It must not create a parallel reference content model
without a proven blocker.

| Sub-slice | Content | Size |
|---|---|---|
| P7.1 | Read-only inventory: current reference routes, content contracts, W3 REF placeholder, deep-link behavior | S |
| P7.2 | Generic REF adapter / presentation contract using existing governed reference content | M |
| P7.3 | Fast-path REF presentation + reference-page convergence | M |
| P7.4 | Deterministic fixture + Node guards + 4× Playwright acceptance | M |

**P7 overall = M.**

**P7 exit criteria:**
- W3 `REF` is no longer a placeholder
- Existing reference content remains source-governed
- No aircraft-specific rendering branch
- No second reference content model unless explicitly justified
- Deep links and selected-aircraft/variant context are preserved
- Flag OFF legacy behavior remains available until C4b
- Node + 4× Playwright green

### 4.4 UX0–UX5 — Full-shell visual integration and UX closure — **ACTIVE**

> **This phase is mandatory. The current production UI is a functional
> development scaffold, not the intended final visual state.**

The current W/P work deliberately prioritized architecture, route ownership,
state boundaries, content correctness, and deterministic acceptance. The
information architecture and functional contracts are valuable and remain
frozen where explicitly stated, but the visual composition is **not frozen**.

The final UX phase runs **after P5, P6 and P7**, so it can redesign the complete
product rather than polishing incomplete pages one by one.

| Slice | Content | Size |
|---|---|---|
| UX0 | Full-shell visual inventory using real production screenshots on desktop, iPad landscape/portrait and narrow mobile; define target visual principles and measurable layout issues | S — **COMPLETE** |
| UX1 | Shell composition: content max-width, sidebar proportions, aircraft header/top bar, search/active-flight placement, fast-path rail scale and density | M — **COMPLETE** |
| UX2 | Design hierarchy: typography scale, spacing rhythm, surfaces/cards, borders, primary/secondary actions, empty/loading/error states | M — **COMPLETE** |
| UX3 | Cross-page harmonization across P0–P7 so launch, Procedures, Performance, Systems, Training, Flight and Reference feel like one product | L |
| UX4 | Responsive + interaction polish: desktop, iPad, phone, keyboard/focus, touch targets, reduced motion, forced colors, screen-reader semantics | M/L |
| UX5 | Final visual acceptance: screenshot review, regression checks, performance baseline/budget, accessibility sign-off and final product-owner approval | M |

**UX overall = L.**

**Frozen during UX:** top-level IA (`AIRCRAFT / PROCEDURES / PERFORMANCE / TRAINING / FLIGHT`), W3 fast-path semantics (`CHECKLIST / QRH / PERF / REF`), generic aircraft-agnostic runtime contracts, source governance, and session/state ownership.

**Explicitly allowed to change during UX:** shell dimensions, density, visual
hierarchy, typography, card/panel composition, spacing, responsive behavior,
button emphasis, page composition, fast-path visual treatment, and other
presentation details.

**UX exit criteria:**
- No page is treated as visually final merely because its functional P-slice is green
- Desktop no longer reads as an under-filled technical wireframe
- Main content uses intentional width/density rather than viewport-wide empty space
- Shell, page headers, actions, panels and fast path have one coherent hierarchy
- All P0–P7 destinations pass desktop/iPad/mobile screenshot review
- Keyboard, focus, screen reader, contrast, reduced motion, forced colors and touch targets pass
- Performance baseline and agreed regression budget pass
- Product owner explicitly approves the final visual shell before C4b

### 4.5 Cleanup (C0–C3)

| ID | Name | Depends on | Blocker |
|---|---|---|---|
| C0 | Operational offline data package | P0–P7 + UX0–UX5 | Yes (before C4b) |
| C1 | Old route compatibility closure | C0 | Yes |
| C2 | Remove proven-unused legacy nav/UI | C1 | Yes |
| C3 | Update architecture docs | C2 | Yes |

### 4.6 C4 — Live preview → final release / legacy removal

> **Current reality:** the global flag is already ON for this single-user production instance. Treat C4a.1 as a live development-preview state, not as proof that the redesign is complete. Functional closure (P5–P7), UX0–UX5 and C0–C3 still precede C4b.

| Stage | Action | Rollback | Minimum duration |
|---|---|---|---|
| **C4a.0a** | **SKIPPED** — single-user production, direct global flip (2026-09-22) | — | — |
| **C4a.0b** | **SKIPPED** — no separate beta cohort in single-user production | — | — |
| **C4a.1** | Global `FT_NEW_SHELL=true` — **ACTIVE development preview since 2026-09-22** | Env change back to `false` | Until P5–P7 + UX0–UX5 + C0–C3 are complete |
| **C4b** | Finalize new shell as canonical; remove flag and proven-unused legacy code | Code rollback / redeploy only | Only after final acceptance |

**Canary mechanism:** server-side account-subject allowlist
(`FT_NEW_SHELL_CANARY_SUBJECTS`). Allowlist must never enter the client bundle.
Email is not part of rollout identity.

**Rollback after C4b:** no flag rollback exists. Only code rollback / redeploy
is possible, without ability to run both shells in parallel.

---

## 5. Release checklist

### 5.1 Final-release / C4b hardening checklist

**Note:** In the current single-user production context, staged canary/beta was explicitly skipped by owner decision. Global `FT_NEW_SHELL=true` was performed directly on 2026-09-22 so the incomplete new shell can be evaluated live. **This does not mean the UI is final.** All unchecked items below remain mandatory before the redesign is considered release-complete or before C4b legacy removal.

**Code & tests**
- [ ] P0–P7 merged
- [ ] UX0–UX5 completed and product-owner approved
- [ ] C0–C3 merged
- [ ] All four W3 fast-path slots (`CHECKLIST / QRH / PERF / REF`) are functional and not placeholders
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

### 5.2 Live development-preview acceptance

- [x] Single-user production override documented
- [x] `FT_NEW_SHELL=true` active in production
- [x] P0–P4 functional shell available for owner evaluation
- [x] P5 operational fast-path closure complete
- [x] P6 Training / Scenario / Debrief complete
- [x] P7 REF closure complete
- [ ] UX0–UX5 complete
- [ ] No open P0–P7 functional regressions

### 5.3 C4b — flag removal pre-conditions

- [ ] P5–P7 complete
- [ ] UX0–UX5 complete and visually approved
- [ ] C0–C3 complete
- [ ] Final-release hardening checklist (§5.1) green
- [ ] Legacy route traffic measured (~0) where meaningful
- [ ] Data migration completed (§7)
- [ ] Architecture docs reflect new shell as canonical
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
| Legacy Fly `OperationalChecklist` | `localStorage`: `flytally:flight-checklist:v1:*` | **Resolved in P5.5** — migrated once into canonical shared checklist session |
| P4 procedure session | existing `ProcedureBrowser` + procedure session | None (P4 reuses existing contract) |
| D0 Active Flight | `flytally-training:active-flight:v1:<aircraft>` + server | None shell-specific |
| P2 performance result | `flytally-training:performance-result:v1:<aircraft>:<activeFlight>` | None if key/schema stable |
| Scenario transient state | component-local `useState` (today) | P6 must decide persistence explicitly |

**Correction:** Active Flight carries `performanceDependency.snapshotId`, not
`performanceDependencyHash`. The performance result separately stores
`contextHash` and re-validates it via `computeContextHash()` on read. No
"Active Flight hash migration" exists.

**P5.5 migration status:** complete. Legacy `OperationalChecklist` state is
single-use, reconciled only against current checklist identities, canonical
state is authoritative, repeated migration is a no-op, malformed/future state
fails closed, and legacy state cannot resurrect after canonical state exists.

---

## 8. Known risks and open questions

### 8.1 Risks

| Risk | Impact | Mitigation |
|---|---|---|
| REF slot incomplete | Persistent fast path ships with placeholder | P7 owns REF; complete before final release/C4b |
| Legacy `OperationalChecklist` migration | Users lose in-progress state on flip | **Resolved in P5.5** with invariant suite |
| GitHub Actions billing/runner blocked | Cannot accept external PRs safely | Resolve in GitHub Billing before C4a |
| No error/regression signal | Blind flip, slow rollback trigger | `/api/release-state` + error visibility before C4a |
| Current UI is not release-quality | Functional shell reads as a sparse technical wireframe on desktop | Mandatory UX0–UX5 full-shell redesign after P5–P7 |
| No performance baseline | Cannot detect regression before final acceptance | UX5 baseline + budget before C4b |
| No a11y audit | Accessibility regressions reach users | UX4/UX5 full-shell a11y gate before C4b |
| `ProcedureLinearRunner` a11y debt | Compounds in P5+ e2e | Dedicated cleanup issue |
| Learjet `/fly` fail-closed 404 | User-visible on flip | Content governance, tracked separately |
| Learjet `/systems` fail-closed 404 in new shell | Published `systems` module is absent in production content | Publish governed systems content; not a P3 runtime regression |
| UX full-shell integration remains substantial | Release slips | P0–P7 merged; UX = L |

### 8.2 Open questions

| Question | Status |
|---|---|
| Beta / canary / per-user rollout strategy | **Owner override 2026-09-22:** skipped for single-user production; direct global flip active |
| Post-C4b rollback mechanism | **Defined:** no flag rollback; normal code rollback / redeploy only |
| Release communication plan | **Not defined** |
| Formal standalone C4 acceptance document | **Does not exist**; §5 is the current redesign release checklist |
| S/M/L estimates for remaining work | **P5 M/L, P6 L, P7 M, UX L; C0–C4 still TBD** |
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
| 2026-09-22 | P4 merged via PR #181 as squash commit `738b0c59`; status `merged` `gated`. | Filip Točík + DeepSeek + ChatGPT |
| 2026-09-22 | Single-user production override: staged canary/beta skipped; global `FT_NEW_SHELL=true` activated on deployment `dpl_EqXB1gwyWrG3FmpUJZt16KAo61DK`. | Filip Točík + DeepSeek + ChatGPT |
| 2026-09-22 | Roadmap corrected after live visual review: current shell classified as development preview, REF assigned to P7, and mandatory UX0–UX5 full-shell visual integration added before C4b. | Filip Točík + ChatGPT |
| 2026-09-22 | P5 merged via PR #182 as squash commit `b9e910a4`; local gate 908/907/0/1 + build PASS + Playwright 288/288. | Filip Točík + ChatGPT |
| 2026-09-22 | P6 merged via PR #183 as squash commit `28a0c014`; targeted 14/14, local gate 922/921/0/1 + build PASS + Playwright 312/312. | Filip Točík + ChatGPT |
| 2026-09-22 | P7 merged via PR #184 as squash commit `5488a9da`; targeted 10/10, local gate 932/931/0/1 + build PASS + Playwright 332/332. Functional P0–P7 sequence complete; UX0 begins. | Filip Točík + ChatGPT |
| 2026-09-22 | UX0 + UX1 merged via PR #185 as squash commit `ed4f039d`; targeted 10/10, local gate 942/941/0/1 + build PASS + Playwright 332/332. UX2 becomes next. | Filip Točík + ChatGPT |
| 2026-09-22 | UX2 merged via PR #186 as squash commit `fab1c37b`; targeted 6/6, local gate 948/947/0/1 + build PASS + Playwright 332/332. UX3 becomes next. | Filip Točík + ChatGPT |
| 2026-09-22 | UX3 merged via PR #187 as squash commit `9da366f3`; targeted 6/6, local gate 954/953/0/1 + build PASS + Playwright 332/332. UX4 becomes next. | Filip Točík + ChatGPT |
| 2026-09-22 | UX4 merged via PR #188 as squash commit `1c9df1de`; targeted 6/6, local gate 960/959/0/1 + build PASS + Playwright 340/340. UX5 final visual acceptance becomes next. | Filip Točík + ChatGPT |

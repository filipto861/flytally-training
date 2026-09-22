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
| P4.7 | Procedures acceptance (e2e) | ⏳ fix `cff66a7d`, rerun pending |
| P4.8 | Final gate / PR / merge | 🔲 not started |

**Known debt (out of P4 scope):** `ProcedureLinearRunner` toggle changes
accessible name (`Complete` → `Uncheck`) together with `aria-pressed`. Pre-existing
frozen behavior. Candidate for a dedicated cleanup issue.

---

## 3. Current state

```
main:                        8b4e53c8 (P3)
feat/redesign-p4-procedures: cff66a7d (P4.7 fix)
production:                  FT_NEW_SHELL = OFF
```

**Playwright projects:** `desktop-chromium`, `mobile-chromium`, `ipad-landscape`, `ipad-portrait`  
**Baseline:** 252 passed (63 × 4)  
**P4.7 target:** 284 passed (71 × 4)

---

## 4. Remaining phases

### 4.1 P5 — QRH / checklist operational refinement

| Field | Value |
|---|---|
| Content | Operational refinement of checklist and QRH, including fast-path layer |
| Depends on | P4 merged |
| Estimate | TBD |
| Blocker for release | Yes |

### 4.2 P6 — Training hub + Scenario + Debrief

| Field | Value |
|---|---|
| Content | Training hub, scenario workflow, debrief |
| Depends on | P5 + existing training/content foundation |
| Estimate | TBD |
| Blocker for release | Yes |

### 4.3 Cleanup (C0–C3)

| ID | Name | Depends on | Blocker |
|---|---|---|---|
| C0 | Operational offline data package | P0–P6 | Yes (before C4a) |
| C1 | Old route compatibility closure | C0 | Yes |
| C2 | Remove proven-unused legacy nav/UI | C1 | Yes |
| C3 | Update architecture docs | C2 | Yes |

### 4.4 C4 — Release flip (split into C4a / C4b)

> **Critical:** C4 is **not one step**. Flag flip and flag removal are separated
> by a rollback window.

#### C4a — Production flip

| Field | Value |
|---|---|
| Action | Set `FT_NEW_SHELL=true` in production |
| Rollback | Env change back to `false` |
| Pre-conditions | See §5.1 |
| Estimated duration | Hours (assuming checklist complete) |

#### C4b — Flag removal

| Field | Value |
|---|---|
| Action | Remove `FT_NEW_SHELL` boundary, delete legacy code |
| Rollback | No flag-based rollback after this point |
| Pre-conditions | See §5.2 |
| Minimum wait after C4a | **2 weeks** |

---

## 5. Release checklist

### 5.1 C4a — pre-conditions (production flip)

**Code & tests**
- [ ] P0–P6 merged
- [ ] C0–C3 merged
- [ ] `npm run verify` green on `main`
- [ ] Current Playwright suite green on all 4 projects
- [ ] No `skip` in redesign-specific tests
- [ ] `FT_NEW_SHELL` has no other consumers depending on legacy branch

**Manual acceptance**
- [ ] Smoke test on real iPad (touch, PWA install, offline)
- [ ] Smoke test on narrow phone (375px)
- [ ] Reduced motion and forced colors verified
- [ ] Keyboard-only navigation verified (skip target, focus order)
- [ ] Screen reader pass (VoiceOver or NVDA)

**Performance**
- [ ] LCP / TTI measured on target device
- [ ] Bundle size delta vs. legacy documented
- [ ] No new long tasks > 200ms on interaction

**Observability**
- [ ] Error tracking/production runtime-error visibility confirmed
- [ ] Health/readiness coverage for shell rollout documented
- [ ] 4xx/5xx regression monitoring available
- [ ] Session/user-level diagnostics sufficient for rollback decisions

**Operational**
- [ ] Rollback procedure documented and rehearsed (`FT_NEW_SHELL=false`)
- [ ] Communication plan: who is notified, what they are told
- [ ] Bug report channel communicated
- [ ] Rollback window defined (≥ 2 weeks)

### 5.2 C4b — pre-conditions (flag removal)

- [ ] C4a ran for ≥ 2 weeks with no rollback event
- [ ] No P0–P6 regression issues open
- [ ] Legacy route traffic measured (should be ~0)
- [ ] Data migration completed (see §7)
- [ ] Architecture docs already reflect new shell as canonical
- [ ] Changelog entry written

---

## 6. Rollback strategy

| Stage | Rollback mechanism | RTO |
|---|---|---|
| Before C4a | `FT_NEW_SHELL=OFF` (already default) | N/A |
| C4a | Env change `FT_NEW_SHELL=false` | Operationally dependent on environment rollout |
| Between C4a and C4b | Same as C4a | Operationally dependent on environment rollout |
| After C4b | No flag-based rollback; use normal code rollback/redeploy | Deployment-dependent |

**Implication:** the minimum 2-week window between C4a and C4b preserves the
simple feature-flag rollback path. Do not shorten it without an explicit decision.

---

## 7. Migration concerns (before C4b)

| Concern | Status |
|---|---|
| `localStorage` key migration (legacy → new shell) | 🔲 not started |
| In-progress checklist session in legacy shell | 🔲 not started |
| Active Flight `performanceDependencyHash` from legacy context | 🔲 not started |
| User-facing "what changed" onboarding | 🔲 not started |
| Support docs update | 🔲 not started |

---

## 8. Known risks and open questions

### 8.1 Risks

| Risk | Impact | Mitigation |
|---|---|---|
| P5 / P6 scope is not yet estimated | Release timing uncertain | Estimate before starting P5 |
| GitHub Actions runner/quota availability | Hosted CI may be unavailable even when code is valid | Keep authoritative local gate; resolve hosted CI before C4a |
| Redesign-specific rollout observability is not yet formalized | Slower rollback decision | Define before C4a (§5.1) |
| `ProcedureLinearRunner` toggle a11y debt | Can cause confusing e2e selectors and accessibility inconsistency | Dedicated cleanup issue |
| Learjet `/fly` fail-closed 404 content state | User-visible on flip if production content remains incomplete | Track separately as content-governance readiness |

### 8.2 Open questions

| Question | Status |
|---|---|
| Beta / canary / per-user rollout strategy | **Not defined** |
| Post-C4b rollback mechanism beyond normal code rollback | **Not defined** |
| Release communication plan | **Not defined** |
| Formal C4 acceptance document | **Does not exist** |
| S/M/L estimates for P5–C4 | **Not defined** |
| How to handle feedback from beta users | **Not defined** |

---

## 9. Authoritative sources

| Purpose | File |
|---|---|
| This roadmap (W/P/C redesign) | `REDESIGN.md` (this file) |
| Product-level release gate | `V1_RELEASE.md` |
| Product roadmap (v1.0 → v3.2) | `ROADMAP.md` |
| Executable contracts (per slice) | `tests/redesign-*.test.ts` |
| Playwright acceptance | `e2e/shell/aircraft-shell.spec.ts` |
| Open release issue | GitHub #51 — `v1.0 release certification` |

---

## 10. Changelog

| Date | Change | Author |
|---|---|---|
| 2026-09-22 | Initial consolidation from working handoff notes | Filip Točík |

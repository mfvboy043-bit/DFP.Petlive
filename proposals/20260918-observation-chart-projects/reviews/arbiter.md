---
iteration: 2
decision: candidate_ready
# wait_for_reviews | revision_required | candidate_ready | halted

blocking: []
non_blocking:
  - UI-1
  - UI-2
  - UI-3
  - UI-4
  - UI-5
  - QA-2
  - QA-3
  - QA-4
rerun: []
builder_scope: []
halt_reason: ""
---

# Arbiter — 20260918-observation-chart-projects (iteration 2)

## Inputs

- Proposal + `state.yaml` Gate A: **P1 Q1 R1 S1 T2**
- QA (iteration 2 rerun): **pass** — **QA-1 resolved**; no blockers; QA-2 / QA-3 / QA-4 non-blocking
- UI (iteration 1 — not rerun): **conditional** — UI-1 / UI-2 medium; UI-3–UI-5 low; all remain non-blocking per iteration 1 mapping
- Prior arbiter (iteration 1): **revision_required** — QA-1 blocking only
- Pharmacist / Legal: skipped per routing

## Mapping

| ID | Review severity | Arbiter | Reason |
|----|-----------------|---------|--------|
| QA-1 | was blocking | **resolved** | Iteration 2: `deleteProject` + `pruneOrphanedMetric`; shared metric retained; visits untouched; regression test added — matches confirm + acceptance #6 |
| UI-1 | medium | non_blocking | Side panel metric-first copy; chart head + ⋯ teach 專案 — tryout polish (unchanged from iter 1) |
| UI-2 | medium | non_blocking | Sidebar「新增我的指標」vs 新建專案→B — does not break title-row create/switch |
| QA-2 | low | non_blocking | Empty-state CSS-only hide; suggest `hidden` / `aria-hidden` |
| QA-3 | info | non_blocking | Node suite not run in QA env; Victor run before/after Gate B |
| QA-4 | info | non_blocking | Q1 demo seeds share `headache` — acceptable |
| UI-3 | low | non_blocking | Native `window.confirm` vs sheet CRUD |
| UI-4 | low | non_blocking | ⋯ ~40px touch target; manual device tap |
| UI-5 | low | non_blocking | Zero-project h2「新建專案」duplicates CTA |
| BB-1 | pass | — | Brain in `projects.js`; delete cleanup in controller orchestration; thin tryout-wire |

No new blockers. No wrong-pet / formal `pets[]` write. No XSS / I1 failures. Tier 1 light security: pass (QA iter 1 + 2).

## Blocking

None.

## Non-blocking (carry forward)

- **UI-1 / UI-2** — Side panel still metric-first; dual add-metric path — revisit on productize or Victor follow-up
- **QA-2** — Empty-state a11y when chart has data
- **QA-3** — Run `node --test qa/tests/web-observations-*.test.js` locally (7 projects cases + siblings)
- **QA-4** — Shared demo `metricId` OK for Q1
- **UI-3 / UI-4 / UI-5** — Delete confirm pattern, touch targets, zero-project h2 wording

## Decision

**candidate_ready** — Iteration 2 clears the sole blocker (**QA-1**). Project layer, R1/S1 chrome, Q1 seed, persist, P1 demotion, and acceptance #1–#10 meet Gate A at domain + tryout level. UI iteration 1 findings stay non-blocking for this tryout-only candidate.

## Rerun

None required before Gate B.

## Builder scope

None — no further revision unless Victor Gate B returns「修改：…」.

## Gate B ask

請試用 tryout（`apps/web/tryouts/observation-chart/?v=20260918-projects`）後回覆「採用」、「修改：…」或「否決」。

---
iteration: 1
decision: revision_required
# wait_for_reviews | revision_required | candidate_ready | halted

blocking:
  - QA-1
non_blocking:
  - UI-1
  - UI-2
  - QA-2
  - QA-3
  - QA-4
  - UI-3
  - UI-4
  - UI-5
rerun:
  - qa
builder_scope:
  - QA-1
halt_reason: ""
---

# Arbiter — 20260918-observation-chart-projects (iteration 1)

## Inputs

- Proposal + `state.yaml` Gate A: **P1 Q1 R1 S1 T2**
- QA: **conditional** (no Tier 1 blockers; QA-1 medium — delete purge incomplete vs confirm + acceptance #6)
- UI: **conditional** (UI-1 / UI-2 medium — side panel metric-first vs project model; UI-3–UI-5 low)
- Pharmacist / Legal: skipped per routing

## Mapping

| ID | Review severity | Arbiter | Reason |
|----|-----------------|---------|--------|
| QA-1 | medium | **blocking** | Confirm + proposal #6 promise scores/notes removed; `deleteProject` leaves `diaryNotes` and self-metric series/metrics in bag — integrity / misleading delete, not tryout-exempt |
| UI-1 | medium | non_blocking | Side panel copy still metric-first; chart head + ⋯ menu teach 專案; P1 primary path works — tryout polish (cf. self-entry UI-1 non_blocking) |
| UI-2 | medium | non_blocking | Sidebar「新增我的指標」vs 新建專案→B duplicate path; does not break switch/create from title row |
| QA-2 | low | non_blocking | `#emptyState` hidden via CSS only; a11y tree noise |
| QA-3 | info | non_blocking | Node suite not run in QA env; Victor/Builder run `node --test qa/tests/web-observations-*.test.js` before Gate B |
| QA-4 | info | non_blocking | Demo seeds share `headache` metric id — acceptable Q1 |
| UI-3 | low | non_blocking | Native `window.confirm` vs sheet CRUD — mobile polish |
| UI-4 | low | non_blocking | ⋯ touch target ~40px; manual device tap pass |
| UI-5 | low | non_blocking | Zero-project h2「新建專案」duplicates CTA label |
| BB-1 | pass | — | Brain in `projects.js`; thin controller + tryout-wire |

No wrong-pet / formal `pets[]` write. No XSS / I1 failures. Iteration 1 < max 3 → revise, not halt.

## QA-1 — delete integrity (Arbiter call)

QA filed **medium** and placed QA-1 under “revision recommended,” not QA blockers. Arbiter **elevates to blocking** because:

1. **Acceptance #6** (partial in QA table): delete must remove that project’s series/notes; visits stay.
2. **Product copy** (`window.confirm`) tells the user scores/notes go away — lingering notes and orphaned custom metrics/series in `petlive-obs-tryout-store` is **misleading delete**, not a scoped-out tension like self-entry UI-1 (kg vs 0–10 under locked M1).
3. **Not** classic accidental data-loss, but **I-layer integrity** on user-initiated purge: user believes chart data is gone while bag still holds it.

**Builder fix (scope QA-1 only):** on delete, filter `diaryNotes` by the project’s bound `metricId` (and/or project id if notes gain one later); remove orphaned custom metric + series from shared view/metrics when no remaining project references them; keep visit rows untouched. Extend `web-observations-projects.test.js` if needed.

## Blocking

- **QA-1** — Complete delete lifecycle: notes + self-metric series/metrics purged per project delete; confirm copy remains truthful; visits unchanged.

## Non-blocking (do not expand this revision)

- **UI-1 / UI-2** — Side panel metric-first copy and dual “add metric” entry; revisit on productize or Victor follow-up.
- **QA-2** — Empty-state `hidden` / `aria-hidden` when chart has points.
- **QA-3** — Run full observations test suite locally before Gate B.
- **QA-4** — Shared demo `metricId` OK for Q1.
- **UI-3 / UI-4 / UI-5** — Confirm pattern, touch targets, zero-project h2 wording.

## Decision

**revision_required** — Project layer, R1/S1 chrome, Q1 seed, persist, and P1 demotion meet Gate A; **delete purge must match confirm and acceptance #6** before `candidate_ready`.

## Rerun

- **qa** — Re-verify delete (notes list + bag after delete + last-project empty); run `node --test qa/tests/web-observations-*.test.js` when Node available.

Optional quick UI smoke on delete confirm after fix; not required in `rerun` unless Victor asks side-panel scope.

## Builder scope

**QA-1 only.** Do not fold UI-1 / UI-2 / QA-2 into this revision unless Victor expands scope.

## Gate

Gate B remains **pending**. Do not ask Victor 採用 until a later Arbiter returns `candidate_ready`.

Parent: snapshot `reviews/` → `iterations/01/` when appropriate; set `status: revising`, `builder_scope: [QA-1]`; **iteration stays 1** until Builder finishes, then parent bumps for the next review round.

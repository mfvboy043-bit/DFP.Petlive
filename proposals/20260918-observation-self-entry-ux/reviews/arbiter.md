---
decision: candidate_ready
iteration: 1
---

# Arbiter — 20260918-observation-self-entry-ux (iteration 1)

## Inputs
- Proposal + `state.yaml` Gate A: **J1 K1 L1 M1 N2 O1**
- QA: **pass** (no blockers; QA-1…QA-4 non-blocking; BB-1 pass)
- UI: **conditional** (UI-1 marked high; UI-2 medium; UI-3 / UI-4 low)
- Pharmacist / Legal: skipped per routing

## Mapping

| ID | Review severity | Arbiter | Reason |
|----|-----------------|---------|--------|
| UI-1 | high (UI) | **non_blocking** | See decision below — not Gate-B blocking for this tryout under M1 + L1 |
| UI-2 | medium | non_blocking | Mobile findability polish; L1 keeps demo first; DIY controls exist |
| UI-3 | low | non_blocking | Empty-state legend chrome |
| UI-4 | low | non_blocking | Same as QA-2 — shared start marker on custom |
| QA-1 | low | non_blocking | Same weight vs 0–10 tension as UI-1 |
| QA-2 | low | non_blocking | Shared demo「開始追蹤」on custom |
| QA-3 | info | non_blocking | Dead legend CSS |
| QA-4 | info | non_blocking | Passport iframe `?v=` lag; out of tryout-only scope |
| BB-1 | pass | — | No BB high |

No data-loss / wrong-write findings. No BB high. No QA blockers.

## UI-1 — weight kg vs 0–10 form (Arbiter call)

UI marked **high** because selecting demo **體重** leaves the diary control locked to 0–10 /「分數（0–10）」, so realistic kg cannot submit.

**Not Gate-B blocking for this candidate**, because:

1. **M1** locked the fill-in as a **score + time bucket** side form; proposal Phase 2 / in-scope #5 explicitly scopes **score (0–10)** → `addDiaryPoint`.
2. **L1** keeps human demo metrics (including 體重) for first paint; DIY self-entry is the acceptance path, not “make weight kg editable in this form.”
3. QA verified the scoped path: custom metric + value/index → chart updates; acceptance #5 pass; same mismatch filed as **QA-1 low**.
4. Surface is **tryout-only** (no B/Pages productize); replacing 寵物體重機 is out of scope.

Treat UI-1 / QA-1 as known **demo-template vs score-form** tension to fix on productize or a follow-up (branch scale by metric / hide 體重 from diary select / label demo weight read-only). Do not require Builder revision before Gate B tryout feedback.

## Blocking
None.

## Non-blocking (carry forward)
- UI-1 / QA-1 — 體重 (kg axis) selectable while diary form is hard-capped 0–10
- UI-2 — DIY add + fill form far below fold on ~390px;「側欄」copy vs stacked layout
- UI-3 — full legend visible under empty custom (chart hidden)
- UI-4 / QA-2 — demo「開始追蹤」can appear on custom series after first point
- QA-3 — unused `.legend-block` / `.legend-square` CSS in tryout
- QA-4 — passport iframe still on older `?v=` (facade bump later; not this Gate A)

## Decision
**candidate_ready** — Phase 1–2 meets locked Gate A (declutter J1/K1/N2, DIY empty + M1 fill-in, domains + thin tryout, tests green). UI-1 does not block Gate B for this tryout.

## Gate B ask
請試用 tryout（`apps/web/tryouts/observation-chart/`）後回覆「採用」（接受此試用版為後續產品化基準）、「修改：…」（要 Builder 修指定項）或「否決」。

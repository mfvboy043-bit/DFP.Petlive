---
iteration: 1
decision: candidate_ready
# wait_for_reviews | revision_required | candidate_ready | halted

blocking: []
non_blocking:
  - QA-1
  - QA-2
  - QA-3
  - UI-1
  - UI-2
  - UI-3
  - UI-4
  - LEGAL-1
  - LEGAL-2
  - LEGAL-3
rerun: []
builder_scope: []
halt_reason: ""
---

# Arbiter — 20260919-auto-cloud-backup (iteration 1)

**Decision:** `candidate_ready`

## Reviews present

| Reviewer | File | Verdict |
|---|---|---|
| QA | `reviews/qa.md` | conditional |
| UI | `reviews/ui.md` | conditional |
| Legal | `reviews/legal.md` | conditional |
| Pharmacist | — | skipped (no dose / meds this slice) |

All assigned reviews present — proceed. Iteration **1** of `max_iterations` 3. Gate A: **G1** (one explicit Drive grant, then auto-push) + **H1** (not Phase 2 DB).

## Issue map

| ID | Source | Severity | Classification | Notes |
|---|---|---|---|---|
| QA-1 | QA | medium | non_blocking | Dirty boot + Drive: `downloadJson()` throw skips new auto-push; local `pets[]` unchanged (A2/L1). AS-02 incomplete on that error path only; user can still tap Sync. Not data-loss / not wrong-pet write. |
| QA-2 | QA | low | non_blocking | AS-07 suite covers debounce / retry / no popup / dirty hold-pull / demo; no vm assert that rejected `pushSilent` leaves pets / `localRevision` unchanged, and no `reconcileCloudOnBoot` vm test. Coverage gap. |
| QA-3 | QA | low | non_blocking | `onRestore` also calls `ensureDriveAccess`. Explicit Restore gesture + confirm, not silent GIS. |
| UI-1 | UI | medium | non_blocking | C leftover `lastCloudUpdatedAt` / `lastBackupAt` can yield `accountSyncOk` while transport is a stub. Default/fresh C is honest; latent chrome lie, not a live Drive write. |
| UI-2 | UI | medium | non_blocking | `#account-popover-plan-value` keeps `data-i18n="accountPlanLocal"`; `applyI18n()` can clobber backing-up / need-Drive / synced. Honesty paint, not data path. |
| UI-3 | UI | low | non_blocking | EN / ko plan strings ellipsis at ~176px; no `title`. No layout break. |
| UI-4 | UI | low | non_blocking | ko `accountSyncNeedDrive` grammar polish（켜지 → 켜지지）. |
| LEGAL-1 | Legal | medium | non_blocking | Privacy §2.4 / terms §4.2 do not yet say post-grant auto-upload for that session. Same data, same recipient, same Drive consent — **not** Legal-high (no undisclosed collection, no missing consent, no disclaimer contradiction). Notice one-liner recommended before adopt. |
| LEGAL-2 | Legal | low | non_blocking | 「開啟自動備份」can sound durable; grant is sessionStorage / G1. Chrome returns to need-Drive after session dies. Optional qualifier. |
| LEGAL-3 | Legal | low | non_blocking | B facade hardcodes `isDemo: () => false`. Live B has no `?demo=1` upload hatch; scheduler still no-ops when `isDemo`. Residual if B later grows demo. |
| (none) | QA / Tier 2 | — | — | No **BB-n**. Scheduler brain in `domains/cloud/scheduler.js`. |
| (none) | QA / Legal security lens | — | — | C2 / C3 / C4 / I1 / I2 / A2 / L1 / L2 hold on High. H1: no Phase 2 pet DB. |

No high / P1 / reject. No Legal-high. No data-loss or wrong-pet write (even among mediums). No BB high.

## Blocking

- (none)

## Non-blocking

- **QA-1** — Dirty boot auto-push skipped when Drive `downloadJson()` throws; local safe; tap Sync still works.
- **QA-2** — Add fail-safe / reconcile vm coverage when convenient.
- **QA-3** — Restore grant path is existing explicit gesture; document vs “only `onSync`” brief.
- **UI-1** — Do not return `accountSyncOk` on C when `hasDriveSession` is false and transport cannot upload.
- **UI-2** — Drop or swap `data-i18n` on the plan value the same way the sync button already does.
- **UI-3** — `title` or wrap long EN / ko status.
- **UI-4** — ko grammar polish.
- **LEGAL-1** — One sentence in privacy §2.4 + matching terms §4.2 (all locales; bump 最後更新). Reviewer-only copy is in `reviews/legal.md`. Not a product-code revision.
- **LEGAL-2** — Optional chrome qualifier（本次使用）.
- **LEGAL-3** — Wire real `isDemo` if formal B later grows a demo path.

## Decision rationale

QA / UI / Legal are all **conditional** with **medium / low only**. Mapping: high / P1 / Legal-high / data-loss / wrong-pet write → blocking; else non_blocking. Conditional verdicts with only medium/low are allowed for `candidate_ready`.

G1 + H1 acceptance on this candidate: silent / flush / boot never `ensureDriveAccess`; dirty boot never auto-pull (I2); demo scheduler no-op (I1); fail does not `applyCloudPayload` (A2/L1); token stays `sessionStorage` (C3/L2); C is stub / `petlive-c-*` only; chrome keys exist and need-Drive does not paint 已同步 on the Gate A path. QA-1 is an incomplete silent-push branch after a download throw, not local wipe. LEGAL-1 is notice alignment on the same Drive backup already consented — Legal itself marks it **not high**.

No blocking IDs → **`candidate_ready`**. Iteration 1 < max 3, but no revision loop.

## Rerun

`[]` — no blocking IDs. (Do not add QA: there is no blocking fix that can break flow.)

## Builder scope

`[]` — blocking IDs only; none.

## Halt

N/A.

## Next (Gate B; do not merge)

This is **not** adopt. Parent may present the candidate to Victor. Do **not** merge `proposal/auto-cloud-backup`, do **not** cover unrelated C drafts onto B / Pages, and do **not** start iteration 2 unless Victor says **修改：…**.

**Gate B 前（orchestrator, not this Arbiter):** security diff scan on touched Drive / token / sync paths; High = blocking (same weight as P1).

**採用** would accept G1 + H1 auto-backup on formal B (scheduler + dirty auto-push / no dirty auto-pull + flush + one explicit grant). Carry non-blocking list. Strongly surface **LEGAL-1** so Victor can take the privacy/terms one-liner with adopt or as a follow-up — Arbiter does not force a revision for it.

**請 Victor 回覆：**

1. **採用** — accept this candidate (G1 + H1).
2. **修改：…** — keep Gate B pending; name extra scope (e.g. force LEGAL-1 / QA-1 into a revision).
3. **否決** — reject this proposal candidate.

Arbiter does not edit `apps/web` and does not decide Gate B.

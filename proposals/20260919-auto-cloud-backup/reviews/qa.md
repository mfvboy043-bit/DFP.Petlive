# QA review

- **Reviewer:** QA (independent)
- **Candidate:** `/Users/victorwu/Desktop/petlive/.worktrees/auto-cloud-backup` (`proposal/auto-cloud-backup`, uncommitted AS-01–AS-07)
- **Proposal:** `proposals/20260919-auto-cloud-backup/proposal.md`
- **Gate A:** G1 (one explicit Drive grant, then auto-push) + H1 (not Phase 2 DB)
- **Date:** 2026-09-19
- **Tests run (from ROOT):** `node --test qa/tests/web-cloud.test.js qa/tests/web-cloud-scheduler.test.js`
- **Result:** **19 passed, 0 failed** (3 suites: AS-07 scheduler 9, dirty hold-pull selector 1, CL-04 selectors/controller 9). Host `node` missing; used system Node v22.22.1.
- **Did not read:** `reviews/ui.md`, `reviews/legal.md`. Did not edit `apps/web`, `contracts`, or `packages`.

## Verdict: conditional

Scheduler brain is in `domains/cloud/scheduler.js` (Tier 2). Silent paths do not open GIS. Dirty boot does not auto-pull (I2). Demo hook no-ops (I1). Drive fail does not `applyCloudPayload` (A2/L1). Token stays in `sessionStorage` (C3/L2). C loads the same scheduler as a no-op stub with `petlive-c-*` only. One **medium** gap: dirty boot auto-push is skipped if `downloadJson()` throws, so AS-02 is not met on that path.

## Checklist

| # | What to verify | Result |
|---|---|---|
| 1 | Node tests | **pass** — 19/19 |
| 2 | Scheduler in `domains/cloud/scheduler.js`; no retry/debounce dump in facades | **pass** — no **BB-n**. B/C `scheduleCloudBackup()` is one line; old `cloudBackupTimer` removed |
| 3 | Silent paths never `ensureDriveAccess` / GIS popup; only `onSync` may | **pass** for silent. `onSync` is the grant path. `onRestore` also calls `ensureDriveAccess` (explicit Restore, not silent) — see QA-3 |
| 4 | Dirty boot: auto-PUSH if Drive; never auto-PULL (I2) | **pass I2**. Dirty branch returns before `applyCloudPayload`. Push only after a successful `downloadJson()` — see QA-1 |
| 5 | Demo does not schedule/sync (I1) | **pass** in scheduler (`isDemo` → no `pushSilent`). B/C wire `isDemo: () => false` (formal B has no `?demo=1` hatch in this tree) |
| 6 | Drive fail does not `applyCloudPayload` / corrupt pets (A2/L1) | **pass** — `pushCloudBackup` catch returns false only; no apply |
| 7 | Token `sessionStorage`; no refresh in `localStorage` (C3/L2) | **pass** — `petlive-google-token` / profile read-write `sessionStorage` only; sign-out clears token, not pets |
| 8 | C `petlive-c-*` only; no live OAuth; stub scheduler | **pass** — C `index.html` does not load `google-drive.js` / Supabase; `hasDriveSession: () => false`, `pushSilent: async () => false` |
| 9 | `pagehide` / `hidden` flush pending JSON when Drive exists | **pass** — B/C facades call `flushPending()`; scheduler no-ops without Drive / pending |
| 10 | `cloudBusy` retry queue not dropped forever | **pass** — busy arms retry without incrementing `attempts`; fail keeps `pending` and retries up to `maxRetries` (3); new `schedule()` / `flushPending` / `onSync` still attempt |
| 11 | `index.html` loads `scheduler.js` before `app.js` with `?v=` | **pass** — B and C `domains/cloud/scheduler.js?v=20260919-autosync` before facade `app.js?v=20260919-autosync` |
| 12 | `security.md` on touched sync/Drive paths | **pass** on High invariants. H1: no Phase 2 pet DB / RLS tables. See mapping below |

## Findings

### QA-1 — Dirty boot auto-push skipped when Drive download throws

- **Severity:** medium
- **Invariants:** A2 / L1 intact (local not written). Acceptance **AS-02** incomplete on this path.
- **Steps:**
  1. Formal B, Drive session present, `hasLocalPendingChanges()` true.
  2. Reload so `reconcileCloudOnBoot` runs (`skipAutoPull` false).
  3. `googleDriveAuth.downloadJson()` throws (network, `folder_list_failed`, 401).
- **Expected:** Dirty + Drive → silent auto-**push**; never auto-pull.
- **Actual:** `try` dies in `downloadJson()` before the new dirty `flushPending()` / `pushCloudBackup`. `catch` sets reconcile `error`. Local `pets[]` unchanged (no `applyCloudPayload`). User must tap Sync / 開啟自動備份. Empty-cloud (`null` payload) still pushes when `hasRealLocalData()`.

### QA-2 — AS-07 does not assert fail-safe local mutation or facade reconcile

- **Severity:** low
- **Steps:** Read `qa/tests/web-cloud-scheduler.test.js` and `qa/tests/web-cloud.test.js`.
- **Expected:** Tests cover debounce, busy retry, no Drive / no popup, dirty hold-pull, demo no sync, and **failed push does not change local revision / pets**.
- **Actual:** Scheduler + selector tests cover the first five. Failed-push local-safety is code-reviewed on B `pushCloudBackup` (catch → `return false`) and controller demo/apply guards, but there is no test that a rejected `pushSilent` leaves pets / `localRevision` unchanged, and no vm test of `reconcileCloudOnBoot` itself.

### QA-3 — `onRestore` also calls `ensureDriveAccess`

- **Severity:** low
- **Steps:** Account popover → 從雲端還原 (confirm) on B.
- **Expected (brief):** Silent paths never popup; **only `onSync`** may call `ensureDriveAccess`.
- **Actual:** `onRestore` also awaits `ensureDriveAccess()` then `pullCloudBackup`. This is an explicit user gesture (existing Restore), not a silent timer. Not I2 (confirm dialog still required). Not a silent GIS popup.

## Building blocks

No **BB-n**. New debounce / pending / retry / flush live in `apps/web/domains/cloud/scheduler.js`. Facades only construct hooks and call `schedule` / `flushPending` / `notifyDriveReady`. Shared chrome label wiring stays in `shell/account-chrome.js`.

## Security.md mapping (touched Drive / sync)

| ID | Result |
|----|--------|
| **C2** | Unchanged `drive.file` owner-file backup. No new scopes / G2 `provider_token`. |
| **C3** | Access token JSON in `sessionStorage` only. No Client Secret / `service_role`. Fail toasts do not echo tokens. |
| **I1** | `createScheduler` demo → `schedule` returns, `pushSilent` never called (tested). Controller `applyCloudPayload` / `bumpLocalDataRevision` no-op when `isDemoMode`. B/C pass `isDemo: () => false`; B has no demo hatch in this candidate. |
| **I2** | `hasLocalPendingChanges()` → push/flush then **return** before `shouldAutoPullCloud` / `applyCloudPayload`. Selector `shouldAutoPullCloud` also false when pending (tested). |
| **A2 / L1** | Upload/download throw → no `applyCloudPayload`. Local `pets[]` remains write truth. H1: no Supabase pet rows. |
| **L2** | Sign-out: `googleDriveAuth.signOut()` + `sessionStorage` token/profile clear. Does not delete pets. |
| **H1** | No Phase 2 DB / RLS invention on this candidate. |

High-risk patterns checked: no Drive token in `localStorage`; no silent GIS; no dirty auto-pull; no demo write-to-cloud in scheduler; no secrets in client auth module.

# Legal review

- **Reviewer:** Legal (independent; did not read `reviews/qa.md` or `reviews/ui.md`; did not edit `apps/web` or legal pages)
- **Proposal:** `20260919-auto-cloud-backup` — G1 (once-then-auto Drive push) + H1 (not Phase 2 Supabase DB)
- **Candidate:** `/Users/victorwu/Desktop/petlive/.worktrees/auto-cloud-backup` (`proposal/auto-cloud-backup`)
- **Date:** 2026-09-19

## Verdict

**conditional**

Auto-push after the existing Google Drive grant is the same Phase 1 backup (owner Drive, `drive.file`, sessionStorage token) already covered by privacy §2.4 / terms §4.2. It is **not** a new collection category, not login-equals-backup, and not Phase 2 DB. In-app copy (`accountSyncNeedDrive` / `accountSyncEnableAuto`) plus GIS Drive consent is enough **consent** for that path.

**Condition before adopt:** add one disclosure sentence to privacy (and a matching clause in terms) that later local edits may upload automatically **after** Drive is enabled, for that session only. Current v1.5 text still reads like “enable Drive backup” without stating the new frequency. That is a notice-alignment gap, not an undisclosed new data path.

## Answers to the legal questions

| # | Question | Answer |
|---|---|---|
| 1 | Is auto-push after the existing Drive grant still covered by current privacy/consent? | **Yes.** Login ≠ Drive remains true. Silent / flush / boot paths never call `ensureDriveAccess`. Upload starts only after the user taps the popover (`onSync`) and Google Drive is granted. Destination, file, scope, and controller stay the user’s Drive. |
| 2 | Does UI copy over-promise encryption, or that login alone backs up? (C4) | **No encryption over-promise (C4 pass).** New strings do not claim encryption, E2E, or “secure cloud.” Copy does **not** say login alone backs up; `accountSyncNeedDrive` says the opposite. Mild durability wording risk — see LEGAL-2. |
| 3 | Is a one-line privacy update required? | **Yes (LEGAL-1, medium).** Same purpose/recipient; add one sentence so §2.4 / §7 match “after you enable Drive, later edits upload automatically (this session).” |
| 4 | Missing consent on the new automatic upload path? | **No high.** The automatic path is not a new controller. High would apply if silent upload ran before Drive grant; it does not. |
| 5 | Demo must not upload. | **Acceptable on this candidate.** Scheduler no-ops when `isDemo` is true (tested). Formal B has no live `?demo=1` upload surface and hardcodes `isDemo: () => false`. C has no Drive session; `pushSilent` is a no-op. Residual: LEGAL-3. |

## Findings

### LEGAL-1 — Privacy/terms do not yet state post-grant automatic upload

- **Severity:** medium
- **Not high:** same data (passport JSON), same recipient (owner Google Drive), same legal basis (separate Drive consent + privacy “enable Drive backup”). Not undisclosed collection to Petlive/Supabase.
- **Why it still matters:** Privacy v1.5 §2.4 correctly says Google login **≠** Drive backup, and that Drive starts only after in-app Drive permission. It does **not** say that, once that permission is given, later local writes may be uploaded without another tap. Terms §4.2 is the same. Users who last read “另行授權” under the old per-tap「同步到雲端」model would not learn the new frequency from the policy alone.
- **§7 still holds:** temporary divergence, user-chosen restore, and “we do not guarantee the other copy already matched” remain true and more important now that chrome may say「正在備份」/「已同步」.
- **Required notice (do not treat chrome-only as a substitute for the written policy):** one sentence in privacy §2.4 (A) and a matching clause in terms §4.2; mirror `privacy.en.md` / `.ja.md` / `.ko.md` and terms locales; bump legal “最後更新” when applied.

### LEGAL-2 — “自動備份” can sound permanent; grant is session-scoped (L2)

- **Severity:** low
- **Copy:** `accountSyncEnableAuto`「開啟自動備份」/ “Enable auto-backup”; `accountSyncNeedDrive`「尚未開啟自動備份」.
- **Fact:** Drive token stays in `sessionStorage` (`petlive-google-token`). Sign-out calls `googleDriveAuth.signOut()` and does not delete local pets (L2). New tab / token expiry needs another explicit grant. G1 does not store a refresh token.
- **C4:** no encryption claim.
- **Risk:** a user may think they flipped a durable “always back up” switch. Chrome will again show need-Drive after the session dies — self-correcting, not a disclaimer contradiction. Optional qualifier only (see recommended copy).

### LEGAL-3 — B facade hardcodes `isDemo: () => false`

- **Severity:** low
- **Fact:** Domain scheduler returns immediately when `isDemo()` is true (`qa/tests/web-cloud-scheduler.test.js`). B `createScheduler` and cloud controller omit a live demo hook. C cannot upload. Terms §6 (`?demo=1` must not write account/cloud) is not violated by a live B demo path today because B has no `?demo=1` upload handler.
- **Residual:** if formal B later grows a demo/read-only mode, wire `isDemo` (and keep demo out of `pushCloudBackup` / `onSync`). Do not read this candidate as a demo-sync exemption.

## Security invariants (legal lens)

| ID | Result | Note |
|---|---|---|
| **C2** | hold | Scope still `drive.file`. Backup remains the owner’s file (`petlive-passport.json` / configured name). No scope expansion (G2 not in this candidate). |
| **C3** | hold | Token still sessionStorage. Fail toasts use existing `cloudBackupFail`; no raw token in chrome. |
| **C4** | hold | No new encryption / “military-grade” / E2E claim. Privacy §6 HTTPS wording is unchanged and still accurate. 「雲端」is the existing generic label; Google Drive OAuth is the actual grant. |
| **L2** | hold | Sign-out clears Supabase session + Drive token; local pets remain. Auto-push stops when there is no Drive session. |
| **I1** | hold on live path | See LEGAL-3. Not a legal high. |

## Consent / path check (must not upload before Drive grant)

```text
Supabase Google login     → identity only; no Drive token; no silent upload
accountSyncNeedDrive      → signed-in, owed backup, no Drive session
onSync (user tap)         → only caller of ensureDriveAccess (GIS popup)
notifyDriveReady / push   → after grant
schedule / flush / boot   → pushSilent only if hasDriveSession; never ensureDriveAccess
```

Read in the candidate:

- `apps/web/domains/cloud/scheduler.js` — `schedule` / `flushPending` / `attemptPush` return without `pushSilent` when `!driveReady()`; scheduler source has no `ensureDriveAccess`.
- `apps/web/app.js` `onSync` — `ensureDriveAccess` then `notifyDriveReady` / `pushCloudBackup`.
- `apps/web/app.js` `pushCloudBackup({ silent: true })` — returns false if `!session.signedIn` (Drive GIS session, not Supabase-only).
- `reconcileCloudOnBoot` — early-return unless Drive `getSession().signedIn`; dirty → push, not pull.
- C stub — `hasDriveSession: () => false`, `pushSilent: async () => false`, toast-only preview sync.

No new third party. No Petlive-hosted pet rows. Withdrawal remains: App sign-out (stops new cloud ops), delete the Drive file, clear site data (privacy §8.4).

## Recommended copy (reviewer only; do not apply here)

**Privacy §2.4 (A)** — add after the login ≠ Drive sentence (zh-Hant source; translate en/ja/ko):

> 您於 App 內授權 Google Drive 之後，**該次使用期間**內之後續本機編輯，可能自動上傳並覆寫您雲端硬碟中既有的護照備份檔；**未授權前不會上傳**。關閉分頁、授權逾期或登出後，須再授權一次。此為您本人 Drive 備份，**不是** Phase 2 Supabase 寵物資料庫。

**Terms §4.2** — after the separate-authorization sentence:

> 授權後，該次使用期間內之後續本機變更可能自動備份至您的 Google 雲端硬碟；登入本身不會上傳。我們仍不保證備份成功或即時（見本節第 3 款）。

**Optional chrome (LEGAL-2, not required to clear LEGAL-1):**

| Key | Current | Optional |
|---|---|---|
| `accountSyncEnableAuto` | 開啟自動備份 | 開啟自動備份（本次使用） |
| `accountSyncNeedDrive` | 尚未開啟自動備份 | 尚未授權 Google 雲端備份 |

Do **not** say backups are encrypted, end-to-end, or stored on Petlive/Supabase servers. Do **not** say login alone backs up.

## Out of scope / no finding

- Medical disclaimer and dose copy: unchanged.
- Conflict restore still requires the existing confirm path; dirty still does not auto-pull (I2 product law; not a new silent overwrite of all devices).
- G2 (Supabase OAuth + `drive.file` / `provider_token`) remains a later Legal + constitution review if chosen.

## Gate note

LEGAL-1 is **medium** (notice alignment), not Legal-high (undisclosed sync / missing consent / disclaimer contradiction). Clearing it is the privacy one-liner (plus locale mirrors), not a product-code patch from this reviewer.

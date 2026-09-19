# UI review

- **Reviewer:** UI (independent)
- **Candidate:** `/Users/victorwu/Desktop/petlive/.worktrees/auto-cloud-backup`
- **Gate A:** G1 (one explicit grant, then auto-backup; button becomes retry)
- **Live check:** `http://127.0.0.1:5174/apps/web/c/` (C, 200) and `http://127.0.0.1:5174/apps/web/?app=1` (B signed-out, 200). Viewport ~677×641 plus popover box measure. Did not sign in Google on B.
- **Date:** 2026-09-19

## Verdict

**conditional**

## Summary

G1 chrome is a label/status pass on the existing account popover — not a menu redesign. `#account-popover-edit` is the same control; shell now swaps `syncButtonLabel` / `data-i18n` between `accountSyncEnableAuto`（開啟自動備份） and `accountSync`（同步到雲端 = retry）. New status keys exist in zh-Hant / en / ja / ko on both B and C. Selector order is honest for the Gate A cases: `backingUp` → `needDrive` → dirty → ok, so **needDrive never paints 已同步**.

Live C default (fake Drive, no GIS) painted **尚無雲端備份**, not 已同步. C sync/restore still toast `accountSyncPreview` (「討論版：正式 A/B 登入後可同步…」). Conditional on two honesty holes: C can still reach `accountSyncOk` when leftover `lastCloudUpdatedAt` / `lastBackupAt` exists, and `#account-popover-plan-value` keeps `data-i18n="accountPlanLocal"` so `applyI18n()` overwrites the live status with 「本機（討論版）」.

## Issues

### UI-1 — C can claim 已同步 while Drive is a stub
- **Severity:** medium
- **Where:** `domains/cloud/selectors.js` `accountSyncStatusKey`; C facade `c/app.js` `accountSyncStatusText` always passes `hasDriveSession: false`
- **Observation:** Live C boot on 5174 showed **尚無雲端備份** (honest). Replay of the same selector: if `lastCloudUpdatedAt` or `lastBackupAt` is set and nothing is pending, key is `accountSyncOk` → **已同步到雲端** even though C `pushSilent` is `async () => false` and `googleDriveAuth` is undefined. `needDrive: true` correctly wins over that leftover (not 已同步).
- **Why it matters:** Discussion chrome must not look like a live Drive success. Default/fresh C is fine; a leftover C sync-meta (or a future stub that stamps `lastBackupAt`) would lie. When `hasDriveSession === false` and the transport cannot upload, do not return `accountSyncOk`.

### UI-2 — Plan line i18n key not updated; `applyI18n` clobbers honest status
- **Severity:** medium
- **Where:** `#account-popover-plan-value` (B + C HTML still `data-i18n="accountPlanLocal"`); `shell/account-chrome.js` `applyAccountMenuPaint` sets `textContent` only; button in the same paint *does* update `data-i18n`
- **Observation:** After C paint, plan text was 「尚無雲端備份」 but `data-i18n` stayed `accountPlanLocal`. Calling `applyI18n()` (popover is in `collectActiveI18nRoots`) replaced it with **本機（討論版）**. Language switch / idle boot recover only because `paintCloudChrome` runs afterward. Same clobber on formal B would hide backing-up / need-Drive / synced behind draft copy.
- **Why it matters:** This node *is* the G1 honesty surface. The candidate already knows the pattern (button key + the date-proxy “drop `data-i18n`” comment) and did not apply it to the plan value.

### UI-3 — Long EN / ko plan strings ellipsis with no `title`
- **Severity:** low
- **Where:** `.account-popover-plan-value` (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`) beside 隱私與條款
- **Observation:** Popover itself did not overflow the viewport (300px, `overflowX: false`). At ~176px plan width, zh 「尚未開啟自動備份」 / 「正在備份到雲端…」 clip by ~2px; EN 「Auto-backup not enabled yet」 (317px) and ko 「자동 백업이 아직 켜지 않음」 ellipsis. No `title` with the full status.
- **Why it matters:** No layout break. Phone + EN may hide the need-Drive sentence; a `title` (or wrapping the plan value) would keep the status readable.

### UI-4 — ko `accountSyncNeedDrive` grammar
- **Severity:** low
- **Where:** B + C `i18n.js` ko `accountSyncNeedDrive`
- **Observation:** 「자동 백업이 아직 켜지 않음」 — natural form is 「켜지지 않음」.
- **Why it matters:** Key is present (not missing); polish only.

## Checks

| Check | Result | Notes |
|-------|--------|-------|
| Same `#account-popover-edit` control | **pass** | Markup/CSS unchanged vs mainline; only label + `data-i18n` swap |
| Menu not redesigned | **pass** | Same head / plan / restore / settings / footer; B restore stays `hidden` until signed-in paint |
| Button 開啟自動備份 → 同步到雲端 (retry) | **pass** | `needDrive` → `accountSyncEnableAuto`; after Drive / not owed → `accountSync` |
| Status backing up / unsynced / need Drive / synced | **pass** (B logic) | `accountSyncBackingUp` / `accountSyncDirty` / `accountSyncNeedDrive` / `accountSyncOk`; needDrive never → Ok |
| 已同步 when needDrive | **pass** | Selector + C live dirty path use NeedDrive |
| C does not claim live Drive success | **fail** (latent) | Default C honest; UI-1 if lastCloud / lastBackupAt |
| i18n keys zh-Hant + en (ja/ko present) | **pass** | All four locales on B and C for BackingUp / NeedDrive / EnableAuto |
| Plan line overflow / missing i18n | **conditional** | No popover overflow; UI-2 clobber; UI-3 EN ellipsis |
| C preview toast, no GIS | **pass** | `googleDriveAuth` undefined; C `onSyncPreview` / restore fallback toast `accountSyncPreview` |
| `#cloud-reconcile-status` | **pass** | Hidden + empty on C; hidden on signed-out B |
| B signed-out chrome | **pass** | Account chips/menus hidden; hatch `?app=1` does not invent a signed-in Drive state |

## Gate A G1 (UI lens)

| Expected | UI read |
|----------|---------|
| One explicit grant, then auto-backup | B `onSync` still the only `ensureDriveAccess` path; button stays the same control |
| Button becomes retry | After grant / not `needDrive`, label is 「同步到雲端」 (`accountSync`), not a new menu item |
| Honest status | Backing-up / dirty / need-Drive / synced keys exist and are ordered correctly; C leftover-Ok (UI-1) and i18n clobber (UI-2) keep this **conditional** |

## Notes

- Did **not** read `reviews/qa.md` or `reviews/legal.md`.
- Did **not** edit `apps/web`, `contracts`, or `packages`.
- No patches in this review.
- Account-chip click was blocked by the environment; popover was inspected via DOM (and one screenshot after a forced open). C sync click was not exercised; wiring is `onSyncPreview` toast only.
- Formal B signed-in + real GIS grant was **not** live-checked (no Google session on 5174).

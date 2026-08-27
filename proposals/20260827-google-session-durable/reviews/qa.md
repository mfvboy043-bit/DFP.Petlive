# QA review
Verdict: conditional

Reviewed candidate worktree `.worktrees/google-session-durable` (`apps/web/*` + `qa/tests/web-google-auth.test.js`) vs mainline `/Users/victorwu/Desktop/petlive/apps/web/`. Did not read other reviewer reports. Did not edit product code.

GSD spot-check (static + unit helpers): boot holds A during silent restore; enter B only on live `signedIn` or demo/`?app=1`/`screen=home`; remembered ≠ signedIn; sign-out clears token/profile/remember (+ session leftovers) without touching pets graph keys; in-flight lock on intro login / account switch; sessionStorage→localStorage migrate once. Unit file present for remember/expiry/migrate/signOut/busy paint (node binary unavailable in this reviewer environment — not executed here).

## Findings

### Cross-tab sign-out leaves other tab on unsigned B with stale signed-in chrome
- ID: QA-001
- Severity: medium
- Steps:
  1. Sign in with Google on formal A/B; land on home (B) in Tab 1.
  2. Open the same origin in Tab 2; confirm it boots into B using the shared localStorage token (new durability).
  3. In Tab 2, open account menu → Log out (clears localStorage token + profile + remember; Tab 2 returns to A).
  4. Without refreshing Tab 1, look at the still-open home/B surface and account chip.
  5. In Tab 1, try a navigation that goes through `go()` (e.g. Timeline) and/or Sync.
- Expected: After Tab 2 sign-out, Tab 1 must not remain an interactive unsigned B; chrome should reflect `signedIn === false` and route back to A (or equivalent immediate gate).
- Actual: Token/remember are cleared in shared `localStorage`, but Tab 1 has no `storage` listener / cross-tab session notify. Tab 1 keeps showing B + signed-in account chrome until a later `go()` forces intro. Sync/Drive paths then see no live token. This is a regression vs sessionStorage (per-tab) sign-out isolation and weakens “never unsigned B” under multi-tab use.

### Remembered CTA can render with empty email
- ID: QA-002
- Severity: low
- Steps:
  1. Produce remembered intent without a stored profile (e.g. successful token write where profile fetch failed, or migrate token-only sessionStorage blob so `REMEMBER_KEY` is set and `PROFILE_KEY` is absent).
  2. Expire or clear the live token so `signedIn === false` and `remembered === true`.
  3. Boot formal A/B and wait for silent restore to fail (or skip GIS).
- Expected: Status/CTA copy remains clear without broken placeholders.
- Actual: Boot sets `cloudRememberedNeedGoogle` with `email: session.profile?.email || ""`, which can paint “歡迎回來，。” / “Welcome back, .” while the Continue-with-Google button still works. Gate integrity is fine; copy edge only.

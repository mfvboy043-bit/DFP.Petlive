---
id: 20260827-google-session-durable
title: Google session durability — remember who you are; silent re-auth; Google gate stays
status: adopted
author: planner
candidate_branch: "proposal/google-session-durable"
candidate_path: "proposals/20260827-google-session-durable"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Google session durability — remember who you are; silent re-auth; Google gate stays

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Builder notes (iteration 0)

- Candidate worktree: `.worktrees/google-session-durable` on `proposal/google-session-durable`
- Implemented GSD-01…GSD-06 in `auth/google-drive.js` + thin `app.js` boot / `shell/intro-cloud.js` busy paint
- Contrast: `contrast.md`
- XSS trade-off of token-in-localStorage documented in contrast; no refresh-token backend

## Goal

Keep the adopted **Google gate** (A login → B; no unsigned B) and fix the main remaining fragility: closing the tab / token expiry feels like “I was kicked out even though my pets are still here.” Persist last-known Google identity, try silent token restore on boot, and only fall back to an interactive Google CTA on A when silent fails. Never open unsigned B.

## Notes for Victor（白話 · Feynman）

現在的問題不是「要不要 Google 大門」（大門已鎖定），而是：

1. **關分頁 ≈ 登出。** Access token 放在 `sessionStorage`，約一小時也會過期；關分頁後即使本機寵物還在，也必須再點一次 Google。
2. **這次要做的：** 記住「你上次是誰」（email／頭像等）放本機；下次開機若 Google 還認得你，就**安靜**拿新 token 進 B；若安靜失敗，仍停在 A，清楚請你再按 Google（不是偷偷進護照）。
3. **登出仍是真登出：** 清掉記住的身分 + token，回 A。
4. **不做：** 沒 Google 也能進 B、多帳號分桶、後端 refresh token、改雲端合併演算法。

## Surface statement

| Surface | Path | This proposal |
|---|---|---|
| **A** | `apps/web/` intro | **In scope (A/B-direct)** — boot silent restore; remembered CTA chrome; login in-flight lock |
| **B** | `apps/web/` passport | **In scope (A/B-direct)** — enter B only after live token (`signedIn`); sign-out clears remember + returns to A |
| **C** | `apps/web/c/` | **Out of scope for GIS** — C has no live Google scripts; no twin auth brain required. Touch C only if a shared shell helper would otherwise break C’s preview stub (prefer no-op / leave C alone) |
| Auth module | `apps/web/auth/google-drive.js` | **Primary brain** — storage keys, silent restore, sign-out clear |

Auth is formal A/B wiring: **edit A/B directly** (exception to C-first passport-shell rule). Do not invent a C → B cover for this.

## Verified facts (do not regress)

- `TOKEN_KEY` / `PROFILE_KEY` today live in **`sessionStorage`** (`petlive-google-token`, `petlive-google-profile`).
- `getSession().signedIn` ≡ live access token present and not near-expired (`expires_at - 30s`).
- `signIn()` uses GIS `prompt: "select_account"`; `ensureDriveAccess()` uses `prompt: ""`.
- Boot (`initIntroAndCloud`): enter B only if `signedIn` **or** `?demo=1` / `?app=1` / `screen=home` — **not** `INTRO_SEEN` / local pets alone.
- Adopted `20260827-local-first-entry`: Google gate restored; local-first / unsigned B **rejected** — do not reopen.
- Non-blocking **QA-001** from that adopt: double-click GIS on `#intro-login-btn` / account switch.

## In scope

### GSD-01 — Remembered profile (localStorage)

- On successful sign-in / profile fetch, persist last-known profile `{ email, name, picture, sub }` (and a small **remembered signed-in intent** flag) in **`localStorage`**, separate from the live access token.
- Chrome may show “who” (avatar / email) on A when intent is remembered but live token is missing — still **not** `signedIn` for gate / Drive.
- Do **not** treat remembered profile alone as permission to enter B.

### GSD-02 — Access token storage strategy

- **Move** the access-token blob (`access_token` + `expires_at`) from pure `sessionStorage` to **`localStorage`** (same key name or a clearly migrated key; read old sessionStorage once and clear it).
- Keep expiry check (`expires_at - 30s` → treat as absent). Closing a tab no longer wipes a still-valid token; new tabs in the same browser can reuse it until expiry.
- **Why not refresh tokens / new OAuth client:** GIS token client for this SPA does not yield a refresh token without backend / different grant. Out of scope (see below). Durability = persist short-lived token across tabs **plus** silent `prompt: ""` when expired.
- Document in Builder notes: XSS risk of token-in-localStorage is accepted as trade-off vs sessionStorage “forget on close”; scope stays owner-device passport, no new secrets store.

### GSD-03 — Silent restore API

- Add something like `trySilentRestore()` / `restoreSession()` on `PetLiveWeb.auth.googleDrive`:
  - If live token valid → no-op success.
  - Else if remembered intent → GIS `requestAccessToken({ prompt: "" })` (same one-popup / no-chain rule as today).
  - On success: write token (+ refresh profile if needed), `notify()`, return signed-in session.
  - On failure: leave unsigned; **do not** auto-open `select_account`.
- Interactive `signIn()` keeps `select_account` (or equivalent account chooser) for first login / explicit switch / silent failure CTA.
- `ensureDriveAccess()` remains explicit Sync path with `prompt: ""` (behavior-preserving).

### GSD-04 — Boot routing (Google gate intact)

- On formal boot (after GIS/config ready):
  1. If live token → enter B (today).
  2. Else if remembered intent → await silent restore; **success → enter B** + existing silent cloud reconcile path; **failure → stay on A** with clear CTA (reuse / retune copy so user knows one Google tap restores).
  3. Else → A (today).
- Escape hatches unchanged: `?demo=1` / `?app=1` / `screen=home`.
- **Never** enter B from remembered profile alone, `INTRO_SEEN`, or local pets.

### GSD-05 — GIS in-flight lock (close QA-001)

- While any `requestAccessToken` is in flight (intro login, silent restore, account switch, ensureDriveAccess): disable `#intro-login-btn` (and account-popover switch if it can double-fire); ignore duplicate clicks; re-enable on settle (success / cancel / timeout / error).
- Prefer lock state owned by auth module + thin shell/facade apply (not ad-hoc flags scattered only in fat handlers).

### GSD-06 — Sign-out clears remember + tokens

- `signOut()`: revoke live token if possible; clear **token + profile + remembered intent** from localStorage (and any migrated sessionStorage leftovers); notify; existing `doSignOut` → `go("intro")` / toast stays.
- Local pets graph **not** wiped (same as adopted Google gate).

## Out of scope

- Local-first entry /「進入護照」/ unsigned B / reconnect-from-B without Google gate — **locked rejected**.
- Multi-account localStorage partitioning by Google `sub`.
- Refresh tokens, backend token endpoint, new OAuth client type / One Tap redesign.
- Cloud reconcile algorithm, Drive upload/download redesign, `domains/cloud` cover.
- C → B cover of unrelated domains; growing new auth algorithms only inside `app.js`.
- Changing medical copy / demo tour / owner-settings product scope.

## Likely files

| Layer | Path | Role |
|---|---|---|
| Auth module (primary) | `apps/web/auth/google-drive.js` | Token/profile/intent storage; `trySilentRestore`; in-flight flag; sign-out clear; export API |
| Core (optional thin) | `apps/web/core/` storage key helper **only if** shared keys need a single constant — prefer keep keys inside auth module unless duplication appears |
| Shell | `apps/web/shell/intro-cloud.js` | Apply disabled/busy on login control from session / in-flight; paint remembered chrome if shell already owns visibility |
| Surface facade | `apps/web/app.js` | Boot: call silent restore before gate decision; wire lock; keep `signedIn` ≡ live token for enter B / reconcile |
| Markup / i18n | `apps/web/index.html`, `apps/web/i18n.js` | Cache `?v=` bump on `google-drive.js` script tag; CTA / status strings for “remembered but need Google again” if needed |
| Styles | `apps/web/styles.css` | Only if busy/disabled login affordance needs a visible state |
| QA | `qa/tests/web-google-auth.test.js` (new) or extend nearest auth/storage test | Pure storage / session helpers under vm if extracted; behavior: remembered ≠ signedIn; sign-out clears; expiry |
| C | `apps/web/c/*` | **Prefer untouched**; C has no live GIS |

Script tag (formal A/B): existing  
`<script defer src="./auth/google-drive.js?v=…">` — bump `?v=` after change. Load order before `app.js` unchanged.

**Building-blocks note:** Auth is not a `pets[]` domain; extend `auth/google-drive.js` (and shell paint) rather than dumping restore/boot policy into a fatter `app.js`. Facade stays thin: call public `PetLiveWeb.auth.googleDrive.*` + existing `initIntroAndCloud` gate.

## Risks

- **Silent `prompt: ""` may fail** (Google session cookie missing, third-party cookie restrictions, user revoked app, first visit). Must stay on A with a clear CTA — never soft-enter B.
- **Token in localStorage** survives tab close → slightly higher XSS exposure than sessionStorage; accept for this slice; do not log tokens.
- **Boot race:** async silent restore must not flash B then kick to A; prefer hold on A (or a minimal waiting state) until restore settles, then route once.
- **Double GIS / QA-001:** silent restore + user mash on login could overlap without GSD-05.
- **Chrome honesty:** showing remembered avatar while `signedIn === false` must not imply Drive/cloud is live; sync UI stays gated on live token.
- **Medical / pets:** no dose or disclaimer changes; local pets must not wipe on sign-out or failed silent restore.

## Acceptance criteria

- [ ] After Google sign-in, closing the tab and reopening the same origin within token lifetime still has live token → boots to B without another account chooser.
- [ ] After token expiry (or cleared token) **with** remembered intent: boot attempts silent `prompt: ""`; success → B + silent reconcile path; failure → A with clear Google CTA (no unsigned B).
- [ ] Remembered profile alone never unlocks B; `INTRO_SEEN` / local pets alone never unlock B.
- [ ] Interactive first login / switch still uses account chooser (`select_account` or equivalent).
- [ ] Sign-out clears token + profile + remembered intent; returns to A; local pets remain.
- [ ] `#intro-login-btn` (and switch control) disabled / ignores clicks while GIS in flight; settles cleanly on cancel/timeout/error.
- [ ] Demo / `?app=1` / `screen=home` hatches unchanged; Google gate product choice unchanged.
- [ ] zh/en/ja/ko chrome for any new CTA/status keys recomputes; no diagnosis tone.
- [ ] Candidate off mainline (`proposal/<slug>` or worktree); no silent C→B unrelated cover.

## Reviewer routing hint

| Reviewer | Route |
|---|---|
| **QA** | **Required** — boot paths, silent fail→A, sign-out clear, in-flight double-click, gate integrity |
| **UI** | **Required if** A shows remembered identity / busy login state / new CTA copy; else skip |
| **Pharmacist** | **Skip** — no med / dose / source-tag changes |

## Gate A ask

請確認此提案：回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。

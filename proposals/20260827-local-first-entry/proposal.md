---
id: 20260827-local-first-entry
title: Google gate restored — A login enters B; no unsigned B
status: adopted
author: planner
candidate_branch: "cursor/google-gate-adopt-f35c"
candidate_path: "proposals/20260827-local-first-entry"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Google gate restored — A login enters B; no unsigned B

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

Restore Victor’s intended door: **A only offers Google sign-in; successful login enters B and the user can start using the passport.** Remove the local-first “進入護照” CTA. Unsigned users must **not** wander on B. Permanently hide the discarded `#owner-settings-btn` gear (owner settings stay in the signed-in account popover / nav as already wired).

## Amendment (Victor 2026-08-27 Gate B)

Victor rejected the local-first door after seeing the candidate:

> 修改：恢復 Google 大門 — A 只留「用 Google 登入」進 B；拿掉「進入護照」；未登入不要在 B 晃（可一併隱藏齒輪）。

Iteration 1 local-first scope (LF-01…LF-06) is **superseded**. Keep useful polish from iteration 1 where it does not conflict: `loginWithGoogle` wording on the A Google control; one-popup GIS; silent reconcile after intro login; demo / empty passport laws.

## Notes for Victor（白話 · Feynman）

你要的門是：

1. **A = Google 大門。** 沒有「進入護照」。右上（或同等位置）「用 Google 登入」→ 登入成功 → 進 B 開始用。
2. **未登入不能在 B 晃。** 開機沒有 Google session → 停在 A。登出 → 回到 A。本機寵物資料不刪，只是進不去護照畫面。
3. **齒輪不要再出現。** `#owner-settings-btn` 一律隱藏（你已捨棄）。登入後飼主設定走帳號 popover／選單既有入口。

示範 `?demo=1` 與除錯 `?app=1` 仍可進 B（既有 hatch）。

## Surface statement

| Surface | Path | This revision |
|---|---|---|
| **A** | `apps/web/` intro | **In scope** — Google-only door; remove enter-passport CTA |
| **B** | `apps/web/` passport | **In scope** — signed-in only (except demo/app hatch); hide gear; no unsigned connect chip |
| **C** | `apps/web/c/` | **Revert** unsigned-connect stub from iteration 1 if present; keep C as discussion home with `DESIGN_ACCOUNT_PREVIEW` (no A gate on C by design) |
| Transport | `auth/google-drive.js` | **No change** |

## In scope (revision builder IDs)

### GG-01 — Remove「進入護照」

- Remove `#intro-enter-app-btn` (and `.intro-cta` wrapper if unused) from formal A HTML/CSS/handlers.
- Do not leave a second primary that enters B without OAuth.

### GG-02 — A Google is the only formal door

- Keep `#intro-login-btn` with `loginWithGoogle` label.
- Click → `handleGoogleSignIn({ enterApp: true })` → enter B + silent reconcile (existing one-popup rule).
- Retune `introLede` / `manualStep1*` back so Google **is** the way in (undo local-first “可先在本機使用” framing). Keep medical reference-only line.
- Demo link stays tertiary on A.

### GG-03 — Boot / sign-out lock (no unsigned B)

- Boot to B **only** when: Google `signedIn` **or** `DEMO_MODE` **or** `?app=1` / `screen=home`.
- Do **not** skip A solely because `INTRO_SEEN` or `hasRealLocalData()` (that was local-first).
- `doSignOut()`: revoke Google, toast, **`go("intro")`** (or equivalent lock). Do not wipe local pets. Do not leave unsigned chrome on B.
- While unsigned on A: hide B; no account connect chip on B.

### GG-04 — Hide discarded gear

- `#owner-settings-btn` always `hidden` (signed-in and unsigned). Do not resurrect it for unsigned fallback.
- Signed-in owner settings: existing account popover / nav paths only.

### GG-05 — Revert unsigned B / C connect chrome from iteration 1

- Remove `account-chip-connect` path on formal B (home + glass heads). Unsigned → account menus hidden; gear hidden.
- On C: remove iteration-1 unsigned-connect stub markup/CSS/handlers if they fight `DESIGN_ACCOUNT_PREVIEW`; C stays signed-in preview discussion surface with no GIS.

### Unchanged

- `?demo=1` read-only seed, no cloud.
- One GIS popup; silent reconcile after successful intro login.
- Signed-in account chip + popover (sync / restore / conflict) from adopted account-menu / cloud-sync-popover.
- Token durability / `sub` namespaces still out of scope.
- `auth/google-drive.js` unchanged unless a one-line wire is forced.

## Out of scope

- Local-first「進入護照」/ stay-on-B after logout / unsigned in-passport Google connect (explicitly reverted).
- Token durability, account-keyed storage, covering `domains/cloud` onto B.
- New OAuth providers / backend.

## Likely files

- `apps/web/index.html`, `app.js`, `i18n.js`, `styles.css`
- `apps/web/c/index.html`, `c/app.js`, `c/styles.css` (revert stub only)
- Expect **no** `auth/google-drive.js`

## Risks

- Users with stale `INTRO_SEEN` from iteration-1 local-first preview must not get free B access — boot must ignore that key for gating (may still write it on successful Google enter if useful later; must not unlock B alone).
- Sign-out returns to A: matches Victor’s “不要在 B 晃”; local data remains but UI is locked.
- Gear hidden: ensure signed-in path to owner-settings still works via popover.

## Acceptance criteria

- [ ] A has **no**「進入護照」button.
- [ ] A Google (`loginWithGoogle`) is the formal door; success → B + silent reconcile; one GIS popup.
- [ ] Unsigned boot shows A, not B (except `?demo=1` / `?app=1` / `screen=home`).
- [ ] Sign-out → A; local pets not wiped; no unsigned B chrome.
- [ ] `#owner-settings-btn` never visible.
- [ ] No unsigned connect chip on B; C unsigned-connect stub reverted / not fighting preview.
- [ ] Demo + empty signed-in-after-login passport laws unchanged; zh/en/ja/ko chrome ok.

## Gate A / B notes

- Original Gate A approved local-first; **Victor modified at Gate B** to Google gate (this doc).
- After this revision + review → new Gate B ask.

## Review routing

- Pharmacist: **skip**
- QA: **required**
- UI: **required** (A hierarchy with single Google door; no gear)

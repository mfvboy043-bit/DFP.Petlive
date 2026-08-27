# Contrast: mainline vs candidate — Google session durable

Proposal: `20260827-google-session-durable`  
Candidate: branch `proposal/google-session-durable` · worktree `.worktrees/google-session-durable`

## Behavior (3–5)

| # | Mainline (today) | Candidate |
|---|---|---|
| 1 | Access token + profile live in **sessionStorage** — closing the tab clears sign-in even if pets remain. | Token + profile + **remember intent** live in **localStorage**; legacy sessionStorage keys migrate once then clear. Closing a tab keeps a still-valid token. |
| 2 | Boot enters B only if live `signedIn` (or demo/`?app=1` hatch). Expired/missing token → stay on A with generic Google login. | Boot: live token → B; else if remembered → **await `trySilentRestore()`** (`prompt: ""`); success → B + silent reconcile; failure → stay A with remembered CTA (not unsigned B). |
| 3 | `signedIn` ≡ live token; no “who you were” chrome when token is gone. | Remembered profile may show on A (status + “Continue with Google”) while **`signedIn` stays false** until a live token exists. |
| 4 | Double-click on intro login / switch can fire overlapping GIS `requestAccessToken` (QA-001). | Auth module **in-flight lock**; intro login + account switch disabled while busy. |
| 5 | `signOut` clears sessionStorage token/profile; returns to A; pets kept. | `signOut` clears **token + profile + remember** (local + leftover session); `doSignOut` → intro; pets still not wiped. |

## Files touched (candidate)

- `apps/web/auth/google-drive.js` — storage migrate, remember, `trySilentRestore`, busy lock, sign-out clear
- `apps/web/app.js` — async boot gate, busy guards, remembered CTA paint
- `apps/web/shell/intro-cloud.js` — `applyAuthBusyState`
- `apps/web/i18n.js` — zh/en/ja/ko restore / remembered / continue keys
- `apps/web/styles.css` — disabled intro login affordance
- `apps/web/index.html` — `?v=` bumps
- `qa/tests/web-google-auth.test.js` — remembered ≠ signedIn, expiry, migrate, sign-out, busy paint

**Untouched:** `apps/web/c/*` (no live GIS twin).

## Builder note

Token-in-localStorage XSS exposure is accepted for this slice (owner-device passport; no refresh-token backend). Google gate product choice unchanged — no「進入護照」/ unsigned B.

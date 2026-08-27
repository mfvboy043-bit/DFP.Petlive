# QA review
Verdict: pass

Candidate: `cursor/wire-bundles-6f84` @ `834ad53` (build `d7a8d35`). Scope C-only shell wire bundles A–D. Formal B (`apps/web/app.js`) untouched.

## Findings

None.

## Checked (no defects)

- **Double-bind:** Facade removed inline listeners for photo-crop / app-nav / intro-cloud; each cluster binds once via shell (`bindPetPhotoCropUi` once after `createPhotoCrop`; `initAppNavMenu` / `initIntroAndCloud` once at boot). No leftover duplicate `addEventListener` on the same targets.
- **Nav ↔ account cross-close:** Opening nav still calls `closeAccountMenu` when `willOpen`; opening account chip still calls `closeAppNavMenu` before toggle. Escape / outside-click each close only their own chrome (mutually exclusive open state preserved).
- **Photo-crop save:** Facade `onSave` keeps prior sequence — missing pet → close; export fail → `toastPetPhotoFail`; `setPetPhoto` fail → `showPersistenceFailure` (overlay stays open); success → emergency photo + picker + close + saved toast.
- **Origin-hint copy:** `resolveOriginHint` + facade `t("cloudBackupNeedConfig" | "oauthLanBlocked" | "oauthOriginHint")` matches prior C branches (needConfig / LAN / always-show origin hint).
- **C boot-to-home:** `bootSurfaceToHome(app, { markIntroSeen })` hides intro, activates home, calls `markIntroSeen` when home exists — same as prior try/catch block.
- **Script order:** `c/index.html` loads `app-nav.js`, `photo-crop.js`, `account-chrome.js`, `intro-cloud.js` (`?v=20260827-wire-bundles`) before `c/app.js`.
- **Syntax / tests:** `node --check` on touched shell + `c/app.js` OK; `qa/tests/web-shell-wire-bundles.test.js` + `web-shell-photo-crop.test.js` — 11/11 pass. Shell has no Drive transport / `pushCloudBackup` / form submit handlers.

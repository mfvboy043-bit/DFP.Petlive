---
id: 20260827-wire-bundles
title: "C — bundle facade wires into shell (photo-crop, nav, account/cloud, intro)"
status: adopted
author: planner
candidate_branch: "cursor/wire-bundles-6f84"
candidate_path: "proposals/20260827-wire-bundles"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: C wire bundles → shell

Companion: `state.yaml` (v2 source of truth for gates / iteration).

**Gate A signal:** Victor 2026-08-27 —「1. 可以整理電線？」then「確認」. Parent intent: bundle facade **wires** (boot/login, photo-crop listeners, nav menu, account/cloud paint orchestration) into `shell/` with labels — not extracting more domain brains; behavior-preserving. C only until Gate B.

**Gate B signal:** Victor 2026-08-27 —「採用，覆蓋」. Covered onto formal B (`apps/web/app.js` + `apps/web/index.html`); B keeps Google Drive reconcile busy/conflict + Google-gate intro boot.

**Builds on (do not redo):** `20260827-leftover-cleanup-17` (account chrome presentation + markup already in `shell/account-chrome.js`), `20260827-leftover-abcd` / photo-crop session math in `shell/photo-crop.js`, existing `shell/navigation.js` (screen `go`/`back` only).

## Goal

Thin the C facade (`apps/web/c/app.js`) by moving **pure DOM-wiring / open-close / paint-orchestration helpers** for four wire clusters into classic IIFE `PetLiveWeb.shell.*` modules. Facade keeps injectable callbacks (toast, `setPetPhoto`, canvas export, Google session adapters, reconcile busy flags, `go`/`t`). Behavior-preserving. No new domain brains.

## Audit (read-only, C)

| Cluster | Facade today | Shell today |
|---|---|---|
| Photo-crop bind | `bindPetPhotoCropUi` ~1799–1877: pointer/zoom/resize/cancel/save/backdrop listeners; already calls `photoCropShell.beginDrag/moveDrag/endDrag/setZoom` | `shell/photo-crop.js` — session + transform math only; **no** listener bind helper |
| App nav menu | `initAppNavMenu` / `setAppNavMenuOpen` / `closeAppNavMenu` / `syncAppNavBtnIcons` ~3175–3232 | `shell/navigation.js` — screen stack `go`/`back` only; **no** glass nav panel wires |
| Account / cloud paint | `paintAccountMenu` / `paintCloudChrome` / `setAccountAvatar` / `positionAccountPopover` / `closeAccountMenu` ~5704–5872; presentation via `buildAccountChromePresentation` | `shell/account-chrome.js` — markup + presentation view; **paint orchestration still facade** |
| Intro / cloud boot | `initIntroAndCloud` ~6024–6151: chip/popover listeners, Escape/resize, `onSessionChange`, C boot-to-home show/hide | No shell bind helper; Google Drive transport stays facade |

## In scope (C only)

### A — Photo-crop UI bind (`shell/photo-crop.js` extend)

- Extract remaining **bind/session wire** helpers that are pure DOM-wiring decisions (pointer capture, drag class toggle, zoom `input`, backdrop click → close, resize → re-render when open) into shell, e.g. `bindPhotoCropUi(els, state, { onRender, onCancel, onSave })` or equivalent.
- Facade injects: `showToast` / `t`, `setPetPhoto`, `exportPetPhotoCrop` / canvas export, `renderEmergencyPetPhoto` / `renderPetPicker`, pet lookup.
- Keep save-path domain side effects in facade callbacks — shell must not call pets graph or persistence.

### B — App nav menu init (`shell/navigation.js` extend **or** small `shell/app-nav.js`)

- Move `initAppNavMenu` open/close/outside-click/Escape wires + panel position (`setAppNavMenuOpen` / `closeAppNavMenu` / `syncAppNavBtnIcons`) into shell.
- Inject: `onManualNav` (C today → `../?demo=1`), `closeAccountMenu` (cross-chrome), optional `t` if needed.
- Prefer extend `navigation.js` only if API stays clear; otherwise new `shell/app-nav.js` + script tag. Do not merge with screen `createNavigation` history stack unless a tiny shared close helper is cleaner.

### C — Account / cloud chrome paint orchestration (`shell/account-chrome.js` extend)

- Thin further `paintAccountMenu` / `paintCloudChrome` / intro-status / origin-hint **wire helpers** into shell (apply presentation view to element map; intro login/account/avatar visibility; origin-hint text decision given `{ configured, origin, signedIn }` + copy strings).
- Facade keeps: Google session adapters (`getAccountSessionForChrome` / live OAuth), `paintReconcileUi` busy flags, `accountSyncStatusText`, `DESIGN_ACCOUNT_PREVIEW`, `t()` string supply.
- `setAccountAvatar` / `positionAccountPopover` / `closeAccountMenu` may move if they stay pure DOM chrome with no auth brain.

### D — Intro / cloud boot listener bundle (extend `account-chrome.js` **or** tiny `shell/intro-cloud.js`)

- Extract listener registration + show/hide orchestration from `initIntroAndCloud` into a shell helper that accepts injected callbacks: login / logout / go / paint / open owner settings / toast keys / close nav.
- C boot-to-home (hide intro, show home, `markIntroSeen`) can be a shell show/hide helper with injectable `markIntroSeen`.
- **Do NOT** move Google Drive transport, `pushCloudBackup`, `handleGoogleSignIn`, or `googleDriveAuth` into shell — facade wires `onSessionChange(paintCloudChrome)` and sign-in/out adapters.

### E — Facade thin + script tags (umbrella)

- Wire A–D on **surface C only**; bump `?v=` on new/changed shell scripts in `c/index.html` (load before `c/app.js`).
- Classic IIFE + `PetLiveWeb.shell.*` public surface; zero-build.
- Prefer small qa unit tests for pure shell helpers where cheap; `node --check` on touched JS.

## Out of scope

- Formal B cover / `apps/web/app.js` / Pages until Gate B
- Domain brains already extracted (dates, pets-graph, meds, timeline morph, clinics, etc.)
- Moving form `save*` / submit handlers wholesale (facade by design) — unless a tiny pure “which toast key” helper remains beside a wire already in scope
- CSS redesign, medical copy, modules write-truth migration, bundler
- Drive-by refactors outside A–D wire bundles (e.g. vax-help, proof lightbox, `[data-go]` listeners stay facade)

## Likely files

**Layer: shell**

- EDIT `apps/web/shell/photo-crop.js` (A)
- EDIT `apps/web/shell/navigation.js` **and/or** CREATE `apps/web/shell/app-nav.js` (B)
- EDIT `apps/web/shell/account-chrome.js` (C; optionally D)
- CREATE optional `apps/web/shell/intro-cloud.js` (D) if account-chrome would mix too many concerns

**Layer: surface facade (C only)**

- EDIT `apps/web/c/app.js` — replace inline wire bodies with shell calls + injected callbacks
- EDIT `apps/web/c/index.html` — script tags + `?v=` for new/changed shell files

**Proposal / tests**

- `proposals/20260827-wire-bundles/*`
- Optional: `qa/tests/web-shell-*.test.js` for pure bind/paint helpers

## Risks

- Listener double-bind if facade still registers after shell bind — Builder must delete facade duplicates
- Cross-chrome close order (nav ↔ account) must stay identical when opening one closes the other
- Photo-crop save path must still hit same toast / persistence / re-render sequence via injectable callbacks (no silent drop of `setPetPhoto` failure → `showPersistenceFailure`)
- Origin-hint / OAuth LAN copy must remain bit-for-bit (`cloudBackupNeedConfig` / `oauthLanBlocked` / `oauthOriginHint`)
- No medical disclaimer / dose UX in this slice — pharmacist review may skip

## Acceptance criteria

- [x] A–D wire clusters live under `PetLiveWeb.shell.*`; C facade only composes + injects callbacks
- [x] Behavior-preserving: photo-crop drag/zoom/save/cancel; nav open/close/Escape/manual; account chip popover; intro boot-to-home; cloud chrome paint visibility
- [x] No Google Drive transport / `pushCloudBackup` / form submit handlers moved into shell
- [x] Formal B covered after Gate B「採用，覆蓋」(`apps/web/app.js` + `index.html`)
- [x] `c/index.html` / `index.html` load changed shell scripts before facade with bumped `?v=`
- [x] `node --check` on touched shell + facades; relevant qa passes if added

## Notes for Victor（白話／五歲聽得懂）

電線亂在大房間（`c/app.js`）裡：誰聽按鈕、誰開關選單、誰畫帳號頭像。這盒只把四捆電線搬進標好的殼子（`shell/`），插頭還是原來那些——不會改藥、不會改存檔。Gate B 已「採用，覆蓋」到正式 B。

| 你說的「整理電線」 | 這盒切片 |
|---|---|
| 大頭貼裁切的聽／拖 | **A** |
| 玻璃選單開／關 | **B** |
| 帳號／雲端外殼怎麼畫 | **C** |
| 進門／登入聽線（不含真正傳雲端） | **D** |

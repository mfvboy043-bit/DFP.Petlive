# Mainline vs candidate — wire-bundles

| | Mainline (pre-adopt) | Adopted `cursor/wire-bundles-6f84` |
|---|---|---|
| Photo-crop listeners | Inline in facade `bindPetPhotoCropUi` | `shell/photo-crop.js` → `bindPhotoCropUi`; facade injects save/toast/render |
| App nav open/close | Inline `initAppNavMenu` / `setAppNavMenuOpen` | `shell/app-nav.js` |
| Account/cloud paint | Inline paint + avatar + origin-hint | `shell/account-chrome.js` apply/resolve helpers; B keeps busy/conflict overlay |
| Intro listeners / boot | Inline `initIntroAndCloud` | `shell/intro-cloud.js` bind (+ B `onSync`/`onRestore`); B keeps Google-gate boot (not C `bootSurfaceToHome`) |
| Formal B | pre-cover | **covered** — `apps/web/app.js` + `index.html` (`?v=20260827-wire-bundles`) |

Gate B: Victor 2026-08-27「採用，覆蓋」.

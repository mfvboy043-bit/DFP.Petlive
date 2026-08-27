# Mainline vs candidate — wire-bundles

| | Mainline (formal B / pre-slice C) | Candidate `cursor/wire-bundles-6f84` |
|---|---|---|
| Photo-crop listeners | Inline in `c/app.js` `bindPetPhotoCropUi` | `shell/photo-crop.js` → `bindPhotoCropUi`; facade injects save/toast/render |
| App nav open/close | Inline `initAppNavMenu` / `setAppNavMenuOpen` | New `shell/app-nav.js` |
| Account/cloud paint | Inline paint + avatar + origin-hint | `shell/account-chrome.js` apply/resolve helpers |
| Intro listeners / boot-home | Inline `initIntroAndCloud` | New `shell/intro-cloud.js` bind + `bootSurfaceToHome` |
| Formal B | unchanged | **not covered** this iteration |

`c/app.js` lines: **6197 → ~5930** (behavior-preserving thin).

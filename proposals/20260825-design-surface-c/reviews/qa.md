# QA review
Verdict: pass

Candidate: `apps/web/c/` (iteration 0) vs mainline B `apps/web/`.  
Static/code review + local HTTP 200 on C entry and `../` shared scripts/assets. Did not patch product code. Did not read other reviewers’ reports.

## Findings

None.

## Checks (focus)

### Boot without login
- C `index.html` has no intro screen; home is `is-active` on load.
- Auth scripts (`config.public.js`, `auth/google-drive.js`) are omitted.
- `initIntroAndCloud` always forces home active / skips cloud restore; `?intro=1` cannot open A on C.

### Storage isolation
- Product keys are all `petlive-c-*`: pets-graph, intro-seen, pet-alerts, suppressed-alerts, pet-photos, lab-reports, owner-profile, lang.
- B retains `petlive-*`. No shared product localStorage keys between C and B.
- Slots use `PetLiveWeb.storage.createJsonSlot` with C keys only.

### Shared `../` paths
- Scripts/assets resolve under `apps/web/` (`runtime/`, `core/`, `shell/`, `domains/`, `breeds-database.js`, mascot). Local server returned 200 for C page, styles, storage, mascot.
- ES module imports in `runtime/petlive.js` resolve relative to that file (not the C HTML URL).

### Auth omitted / stubs
- `googleDriveAuth` is null-safe when `PetLiveWeb.auth` is absent; `handleGoogleSignIn` / backup helpers early-return without throw.
- `#cloud-account-card` is `display: none !important` so the dead Google chrome is not tappable on C.

### Navigation / pet switch
- Diff vs B app logic is limited to storage prefixes + boot/sign-out/cloud restore; `go` / `back`, pets controller, and `selectPet` → `applySelectedPet` paths are unchanged.
- No `go("intro")` calls remain on C (sign-out stays on home).

### Banner hit-testing
- `.surface-c-banner` is fixed, `z-index: 80`, with `pointer-events: none` — does not intercept topbar / CTA taps.

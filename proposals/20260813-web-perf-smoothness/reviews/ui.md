# UI review
Verdict: pass

Light compatibility only (PERF-02 + PERF-04, iteration 1). Candidate: `proposals/20260813-web-perf-smoothness/preview/`. Diffed vs mainline `apps/web` — no CSS redesign in scope; preview `index.html` only rewires scripts/styles for the candidate path.

## Checks

- **Language (PERF-02):** `setLanguage` → `applyI18n()` then `onLanguageChange`. Candidate keeps manage/hint, pending-med, archive/remove, clinic chrome updates; forces `renderPetPicker()` (so add/aria labels are not left stale when `petPickerNeedsRebuild()` is false); `renderCoordinator.refreshLanguage()` flushes home + active registered group and leaves others dirty for `go()`/`onEnter` flush. Home header (`renderPetHeader` species/breed/age), alert badge, and parasite strip refresh with home flush. No blank-picker path found.
- **Photo crop (PERF-04):** `scheduleWrite` updates in-memory cache immediately; `setPetPhoto` still sets `pet.photo` before return; crop save still calls `renderEmergencyPetPhoto` + `renderPetPicker` before close — avatar updates immediately. No layout/CSS change on that path.
- **Layout:** No `styles.css` edits in this build; no JS-driven layout regression spotted for picker/header/avatar.

## Findings

_None._

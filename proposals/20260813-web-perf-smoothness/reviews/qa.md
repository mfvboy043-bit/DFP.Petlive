# QA review
Verdict: pass

Candidate: `proposals/20260813-web-perf-smoothness/preview/` (iteration 1, PERF-02 + PERF-04).  
Checks: static/code review vs mainline; HTTP zero-build asset resolution (all 200); Python coalesce smoke. **Node and JSC unavailable** — `node --test proposals/20260813-web-perf-smoothness/preview/qa/tests/web-building-blocks.test.js` not executed; suite reviewed as source-only.

## Findings

### Residual photo durability window before pagehide
- ID: QA-001
- Severity: low
- Steps:
  1. Crop-save a pet photo (candidate uses `scheduleWrite` with `coalesceMs: 80`).
  2. Within the coalesce window, hard-kill the tab/process so neither the timer flush nor `pagehide` / `visibilitychange` runs.
  3. Reload and open the same pet.
- Expected: Last intended map persisted, or user already saw a persistence failure and can retry.
- Actual: In-memory/`pet.photo` and slot cache update immediately; durable `localStorage` write may still be pending. Hard kill in that narrow window can drop the last map without a toast. Normal hide/close paths call `flushPetPhotosOrToast` (and the slot also flushes on hide); timer/`onFlushResult` still toasts on failed flush. Accepted coalesce tradeoff — not a silent in-session drop.

## Scope notes (no extra issue IDs)

### PERF-02 language
- `setLanguage` still owns one static `applyI18n()`; `onLanguageChange` does not call `applyI18n` or `applySelectedPet`.
- `refreshLanguage()` marks all groups dirty, flushes `home`, then flushes the active non-home group only — inactive `timeline` / `alerts` / `vaccines` / `archive` are not rebuilt.
- `go()` → navigation `onEnter` flushes before the destination screen is shown, so dirty screens should paint the new language before they are visible (species/breed/age/gender/source/vaccine/med chrome that those renders own).
- Home path still refreshes manage/hint, forced `renderPetPicker()`, pending meds, archive/remove copy, clinic chrome; user-authored names/notes stay data-driven (`pet.name`, plain strings / `locField`).
- Same-pet vaccine draft: `refreshVaccineForm` only runs when the vaccines group flushes; draft restore path unchanged.

### PERF-04 photos
- Key remains `petlive-pet-photos`; JSON map shape unchanged.
- Crop save updates avatar via `pet.photo` + `renderPetPicker` / emergency photo immediately after successful `scheduleWrite`.
- Coalesce + `flush` / `visibilitychange(hidden)` / `pagehide` wired; failed flush keeps pending and surfaces `showPersistenceFailure`.
- Layered-adopt storage failure gates for alerts/profile/suppress paths still use immediate `write` and look unchanged.

### Zero-build / regressions
- Preview `index.html` relative `../../../../../apps/web/…` assets and candidate `./core|shell|app` scripts all returned HTTP 200 from repo-root `http.server` on `:5173`.
- Pet switch still goes through `applySelectedPet` → `refreshSelection`; navigation history/`go`/`back` seams untouched by this diff.

## Automated
- Node: unavailable  
- JSC: unavailable  
- Candidate tests present for coalesce burst, flush failure keeping pending, `refreshLanguage` inactive-skip / active flush, and source guards (vaccine draft / no `applySelectedPet` in language callback). Re-run when Node is available.

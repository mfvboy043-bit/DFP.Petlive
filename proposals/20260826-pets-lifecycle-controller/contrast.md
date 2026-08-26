# Contrast: mainline vs pets lifecycle candidate

## Candidate

- Branch: `proposal/pets-lifecycle-controller` @ `19d61d3`
- Worktree: `.worktrees/pets-lifecycle`
- Surface: **C only** (+ shared `domains/pets` lifecycle/media). Formal B untouched.

## Mainline behaviors

1. Create / edit / archive / remove pet logic lives inline in `apps/web/c/app.js`.
2. Pet photo map helpers (load/save/hydrate/set) live inline in `c/app.js`, using `petPhotosSlot`.
3. Selection already uses `PetLiveWeb.domains.pets.createController`; lifecycle/media do not.
4. Formal B (`apps/web/app.js`) still owns its own monolith pet lifecycle helpers.
5. No `qa/tests/web-pets-lifecycle.test.js` boundary coverage.

## Candidate behaviors

1. `PetLiveWeb.domains.pets.createLifecycle` owns create/update/archive/remove mutations on `pets[]` / `archivedPets[]` (no DOM).
2. `PetLiveWeb.domains.pets.createMedia` owns photo map ops via injected slot + pure crop math; canvas/crop UI stays in C.
3. `c/app.js` keeps same-named facades (forms, toasts, nav, `applySelectedPet`, crop overlay).
4. Selection controller unchanged; no `modules/pet` dual-write; no archive restore invented.
5. Boundary tests cover create/update/archive/remove/photo/crop math isolation.

## Files touched

### Added

- `apps/web/domains/pets/lifecycle.js`
- `apps/web/domains/pets/media.js`
- `qa/tests/web-pets-lifecycle.test.js`

### Changed

- `apps/web/c/app.js`
- `apps/web/c/index.html`

### Not touched

- Formal B `apps/web/app.js` / `apps/web/index.html`
- `domains/visits`, `domains/timeline`
- `modules/*`, `contracts/*`, C styles/i18n

## Reviewer verdicts

- Pharmacist: skipped (per proposal)
- QA: pass (no material defects)
- UI: pass (light compatibility)
- Arbiter: `candidate_ready`

## Merge checklist (after 採用 only)

- [x] Victor said 採用
- [x] Reviews attached
- [x] Merge into `main` (C + shared `domains/pets` lifecycle/media + QA); formal B untouched; no Pages push (C-only)
- [x] Set proposal `status: adopted`
- [ ] C → B cover (separate Victor confirm)
- [ ] Push `origin/main` (only if Victor wants remote/main sync; not required for Pages until B cover)

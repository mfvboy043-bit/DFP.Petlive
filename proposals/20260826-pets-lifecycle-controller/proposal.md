---
id: 20260826-pets-lifecycle-controller
title: Pets lifecycle + media controller building blocks
status: adopted
author: planner
candidate_branch: "proposal/pets-lifecycle-controller"
candidate_path: "proposals/20260826-pets-lifecycle-controller"
candidate_worktree: ".worktrees/pets-lifecycle"
created: 2026-08-26
updated: 2026-08-26
builder_notes: >-
  Gate A build on worktree .worktrees/pets-lifecycle (branch proposal/pets-lifecycle-controller).
  archivePet/removePet accept optional currentPetId to compute nextCurrentPetId (undefined = keep).
  Domain rejects archive without passedAwayDate (reason missing_passed_away_date); facade still toasts first.
  Selection controller untouched. Formal B untouched. No modules/pet dual-write.
---

# Proposal: Pets lifecycle + media controller building blocks

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

Continue the adopted `20260813-web-layered-building-blocks` later phase (**Pet lifecycle and media**: add / archive / remove / photo) by extracting **pet identity mutations** and **pet-photo media helpers** under `apps/web/domains/pets/`, wired first against surface **C** (`apps/web/c/`). This slice is a behavior-preserving, zero-build extraction: create / update / archive / remove mutate only the prototype `pets[]` / `archivedPets[]` graph; photo map helpers read/write via the existing storage-slot injection; optional pure crop-math leaves canvas/DOM in C facades.

Selection (`select` / `selectForced` / `getCurrentPet`) already lives in `domains/pets/controller.js` and stays as the selection seam — this build **extends** the pets domain, it does not rewrite selection.

`pets[]` / `archivedPets[]` remain the only prototype mutation graph. No dual-write into `modules/pet` in-memory Map stores. Formal **B** and GitHub Pages stay untouched until Victor separately confirms a C → B cover.

## Surface statement (standing rules)

| Surface | Path | This proposal |
|---|---|---|
| **C** | `apps/web/c/` | **Edit / wire here** — `c/app.js`, `c/index.html` script tags |
| Shared blocks | `apps/web/domains/pets/` | **OK to extend** (C already loads `../domains/pets/controller.js`) |
| **B** | `apps/web/` root passport | **Out of scope** — no silent cover |
| **A** | intro / login | Out of scope |

After Gate B adopt onto the candidate path for C: ask Victor whether to **cover C → B** (and then auto-publish Pages). Cover is a separate confirm, not part of this Gate A slice.

## Conflict / sequencing vs concurrent Timeline + Visits

| Proposal | Domain | Primary extract |
|---|---|---|
| `20260826-timeline-visits-controller` (Gate A approved; building) | `domains/visits`, `domains/timeline` | visit weight / proof / imaging + timeline selectors |
| **This proposal** | `domains/pets` (lifecycle + media) | create / update / archive / remove + pet photos |

**Non-conflict on domain ownership:** different `PetLiveWeb.domains.*` namespaces; pets lifecycle does not touch visit arrays, timeline selectors, or med orchestration. Timeline/visits does not own pet create/archive/photo.

**Conflict surface:** both candidates edit **`apps/web/c/app.js`** (and possibly `c/index.html` script order / `?v=`). Recommend **one of**:

1. **Sequential Gate A builds** — finish (or pause) timeline-visits candidate wiring in `c/app.js` before pets-lifecycle merges the same file; or
2. **Clear non-overlapping function ownership** if built in parallel — pets owns only the function blocks listed under PL-01–PL-03 (identity / archive / remove / photo map / pure crop math); timeline-visits owns visit/timeline helpers only. Neither rewrites the other’s facades. Script-tag order: pets scripts before visits/timeline if both land; bump `?v=` once per integrated candidate.

Planner default: **sequential** after timeline-visits reaches a stable `c/app.js` checkpoint (or Victor explicitly allows parallel with ownership table above).

## Why extend pets (not a new top-level domain)

Prefer **one pets domain, split files if needed**:

1. **`controller.js` (existing)** — selection only: `createController({ state, beforeSelect, afterSelect })` → `select` / `selectForced` / `getCurrentPet`. Do not rewrite unless a tiny, clean API extension is required for post-archive `selectForced` handoff from facades.
2. **`lifecycle.js` (new)** — pure mutations on `pets[]` / `archivedPets[]` from identity DTOs (no DOM, no `t()`, no navigation).
3. **`media.js` (new)** — pet-photo map helpers via injected `photosSlot`; optional pure crop metrics / clamp / export-rect math (no canvas, no Image, no overlay DOM).

**Justification:** ARCH already named “Pets: selection first; add/archive/remove/photo orchestration in later slices.” Keeping one `PetLiveWeb.domains.pets` namespace matches product language (寵物本人) and avoids cross-domain private reach. Splitting `lifecycle.js` / `media.js` keeps the selection controller file small and testable without forcing a second domain folder. A single mega-`controller.js` would blur selection vs mutation vs storage-adjacent media.

**Restore:** C has **no** archive→active restore UI today (only cloud backup restore). Do **not** invent restore in this slice; archive is one-way into `archivedPets[]` for current product behavior.

## Current codebase facts (audit)

- Existing: `apps/web/domains/pets/controller.js` — only `select` / `selectForced` / `getCurrentPet`.
- `PetLiveWeb.state` holds `pets` / `archivedPets` by reference; C persists via `petsGraphSlot` (`petlive-c-pets-graph`) + `petPhotosSlot` (`petlive-c-pet-photos`).
- `modules/pet` public API (`createPet`, `getPetById`, `listPetsByOwner`, `recordWeight`, …) uses private Maps — **not** UI write truth.
- C already composes `petsController` and (concurrent) visits/timeline controllers; this slice extends pets wiring only.

Still inlined in `c/app.js` (representative):

| Kind | Examples |
|---|---|
| Identity DTO / mutators | `readPetIdentityFromForm`, `createPetFromForm`, `applyPetFromForm` |
| Archive / remove | `confirmArchivePet` (splice → `archivedPets.unshift` + memorial fields), `confirmRemovePet` (name-confirm + splice); selection repair via `appState.setCurrentPetId` |
| Photo map | `loadPetPhotosMap`, `savePetPhotosMap`, `flushPetPhotosMap`, `getPetPhoto`, `setPetPhoto` (also sets `pet.photo`), `hydratePetPhotos`, `flushPetPhotosOrToast` |
| Crop (mixed) | pure-ish: `getPhotoCropMetrics`, `clampPhotoCropOffset`; DOM/canvas: `openPetPhotoCrop`, `exportPetPhotoCrop`, `bindPetPhotoCropUi`, `resizeImageDataUrl` |
| Views (stay in C) | `renderPetPicker`, `renderArchiveList`, `renderPetHeader`, `petAvatarMarkup`, `openCreatePetForm`, `openEditCurrentPet`, `fillPetFormFromPet`, breed chip/typeahead UI |
| Breed (mostly view) | large chip/typeahead block; only `resolveBreedKeyFromForm` / breed fields inside identity DTO matter for create/update |

## Dependency direction (unchanged)

```text
bootstrap → shell/navigation + render coordinator
  → domain controllers
  → shared state/selectors + persistence adapters
  → runtime module adapters
  → modules/* public APIs → packages/shared

controllers -X-> DOM
views       -X-> localStorage
domains     -X-> another domain's private state
modules/*   -X-> apps/web
```

Media helpers may call an **injected** `photosSlot` (created in `c/app.js` via `PetLiveWeb.storage.createJsonSlot`) — they must not construct keys or touch `localStorage` directly.

## Gate A builder scope

Only these IDs are proposed for this build:

### PL-01 — Pets lifecycle mutations (no DOM)

- Add `apps/web/domains/pets/lifecycle.js` (classic IIFE; attach to `PetLiveWeb.domains.pets`).
- Public API sketch:

```text
PetLiveWeb.domains.pets.createLifecycle({
  pets,           // array ref
  archivedPets,   // array ref
  tones?,         // optional PET_TONES inject; else caller passes tone
  newId?,         // optional id factory; default `p${Date.now()}` parity
})

  // Identity shape (plain data — facade builds from form + t())
  // { name, species, speciesLabel, breedKey, breed, gender, isNeutered,
  //   birthDate, weight, weightDate, chipNumber? }

  .createPet(identity, { tone? }?) → pet
      // empty alerts/meds/visits/vaccines + parasitePrevention nulls; alertCount 0
  .updatePet(pet, identity) → pet
      // Object.assign identity fields only; do not wipe visits/meds/…
  .archivePet(petId, { passedAwayDate, memorialNote }) →
      { ok, reason?, archived?, nextCurrentPetId? }
      // splice from pets → unshift archivedPets; set memorial fields
  .removePet(petId) →
      { ok, reason?, removed?, nextCurrentPetId? }
      // splice from pets only (parity: do not invent photo-map cleanup unless already present)
```

- Move mutation logic out of `confirmArchivePet` / `confirmRemovePet` / `createPetFromForm` / `applyPetFromForm` bodies; keep those names as thin facades.
- **Do not** call `modules/pet` create/list APIs for writes.
- **Do not** persist `petsGraphSlot` inside the domain — facades / existing schedule hooks remain responsible after mutation (preserve current persist timing).

### PL-02 — Pets media helpers (slot-injected; optional pure crop math)

- Add `apps/web/domains/pets/media.js` (classic IIFE; `PetLiveWeb.domains.pets`).
- Public API sketch:

```text
PetLiveWeb.domains.pets.createMedia({
  photosSlot,     // { read, scheduleWrite, flush, hasPendingWrite }
  pets?,          // optional: for setPetPhoto syncing pet.photo on active list
})

  .loadMap() → object
  .getPetPhoto(petId) → string|null
  .setPetPhoto(petId, dataUrl|null) → boolean
      // scheduleWrite map; if pets inject present, sync matching pet.photo
  .hydratePetPhotos(petsArray) → void
  .flush() → boolean
  .hasPendingWrite() → boolean

  // Pure crop math only (optional in this slice if easily separable)
  .computeCropMetrics({ view, naturalW, naturalH, zoom, offsetX, offsetY }) → metrics
  .clampCropOffset(state, metrics) → { offsetX, offsetY }
  .exportCropSourceRect(metrics) → { sx, sy, sw, sh } | null
```

- Keep `openPetPhotoCrop`, pointer/zoom listeners, `exportPetPhotoCrop` canvas draw, `resizeImageDataUrl`, toasts, and emergency/picker re-render in `c/app.js`.
- **Do not** move SVG avatar markup or `petAvatarMarkup` HTML into the domain.

### PL-03 — C wiring + compatibility facades

- Update `apps/web/c/index.html` to load `lifecycle.js` / `media.js` after existing pets `controller.js`, before `c/app.js` (and coordinated with visits/timeline script order if that candidate is already present); bump cache `?v=` for touched C scripts only.
- Update `apps/web/c/app.js`:
  - Compose `createLifecycle` + `createMedia` at bootstrap (alongside existing `petsController`).
  - Replace inlined mutators / photo map helpers with same-named facades:
    - Form facades still call `readPetIdentityFromForm` (DOM + `t()` stay in C) then `lifecycle.createPet` / `updatePet`.
    - Archive/remove facades: validate date / name match / toasts / `setManageMode` / `go` / `clearNavigationHistory` / `applySelectedPet` / `renderArchiveList`; call lifecycle for splice; then `appState.setCurrentPetId(next)` or `petsController.selectForced` as needed for selection repair.
    - Photo facades: delegate map ops to media; keep flush-on-hide toast behavior.
  - Breed chip / typeahead / `fillPetFormFromPet` / `paintPetFormMode` / picker & archive list renderers stay in C.
- Leave formal B (`apps/web/app.js`, `apps/web/index.html`) unchanged.
- Leave selection `createController` behavior unchanged unless a minimal extension is required for post-archive selection (document in candidate notes if touched).

### PL-04 — Boundary tests

- Add `qa/tests/web-pets-lifecycle.test.js` (prefer **new file**; keep `web-building-blocks.test.js` selection coverage as-is).
- Style: `node:test` + `vm` load of classic scripts (`core/storage.js`, pets controller + lifecycle + media).
- Cover at least:
  - `createPet` shape: id, empty collections, tone, identity fields
  - `updatePet` mutates identity only; visits/meds arrays preserved by reference
  - `archivePet` moves pet, sets `passedAwayDate` / `memorialNote`, returns `nextCurrentPetId` when archived was current / only pet
  - `removePet` splices active list; selection next-id rule parity
  - rejected archive without `passedAwayDate` (if validated in domain) or facade-only validation documented
  - `setPetPhoto` / `getPetPhoto` / `hydratePetPhotos` via fake slot; `pet.photo` sync
  - flush / pending-write passthrough
  - pure crop metrics / clamp / export rect (if extracted)
  - domains do not touch `document` / `localStorage` directly
  - no import of `modules/pet` private Map

## Public API placement summary

| Namespace / file | Responsibility |
|---|---|
| `PetLiveWeb.domains.pets` + `controller.js` | Selection (existing) |
| `PetLiveWeb.domains.pets` + `lifecycle.js` | Create / update / archive / remove on `pets[]` / `archivedPets[]` |
| `PetLiveWeb.domains.pets` + `media.js` | Photo map via slot + optional pure crop math |
| `c/app.js` facades | Forms, `t()`, toasts, navigation, `applySelectedPet`, picker/archive/header render, crop UI/canvas |

## Likely files

### Add

- `apps/web/domains/pets/lifecycle.js`
- `apps/web/domains/pets/media.js`
- `qa/tests/web-pets-lifecycle.test.js`

### Change

- `apps/web/c/app.js` — extract lifecycle/media to facades; compose domains; keep render/listeners/breed UI
- `apps/web/c/index.html` — script tags + cache `?v=` for new/changed C loads
- `apps/web/domains/pets/controller.js` — **read-only preferred**; touch only if a clean selection handoff API is required (no behavior rewrite)

### Read-only in this build

- `apps/web/app.js` / `apps/web/index.html` (formal B)
- `apps/web/c/styles.css`, `apps/web/c/i18n.js` (unless a facade forces a zero-behavior cache bump — prefer avoid)
- `apps/web/core/*`, `apps/web/shell/*`
- `apps/web/domains/visits/*`, `apps/web/domains/timeline/*` (concurrent proposal — do not edit)
- `modules/*`, `packages/*`, `contracts/*`
- Medical copy / disclaimer strings; breed database / chip UI

If implementation reveals a read-only file must change, stop and return to Gate A with a scope modification; do not expand silently.

## Out of scope / non-goals

- Formal **B** edits or C → B cover / Pages publish (Victor confirm later).
- **Timeline / visits / meds / compound / alerts / vaccines / parasite / emergency** extractionsomain work (other proposals).
- Inventing **archive restore** UI or reverse-unarchive.
- Moving full **breed typeahead / chip expand** UI into the domain (only identity fields / keys as produced by the existing form facade).
- Moving `renderPetPicker`, `renderArchiveList`, `renderPetHeader`, avatar SVG/HTML, crop overlay DOM, or `resizeImageDataUrl` into domains.
- Dual-write to `modules/pet` Map stores; schema / contract changes; IndexedDB; bundler; CSS redesign; medical-copy changes.
- Rewriting selection controller semantics or listener-system rewrite.
- Changing photo storage key / coalesce timing / pets-graph persist contract (unless a bugfix is separately confirmed).
- Silent photo-map orphan cleanup on remove if not already in C behavior (parity first; cleanup = follow-up).

## Risks

- **Data loss on archive/remove:** wrong splice index or mutating the wrong array reference can drop visits/meds forever; archive must move the same object reference into `archivedPets` with memorial fields only.
- **Selected-pet after archive/remove:** must preserve “if removed/archived was current (or current missing) → `pets[0]?.id || null` + `appState.setCurrentPetId`” then `applySelectedPet`; facades must not skip selection repair.
- **Photo quota / persistence failure:** `setPetPhoto` / flush failures must still surface `showPersistenceFailure` from facades; domain returns boolean only.
- **Photo orphan / leak:** remove today may leave `petPhotosSlot` entries; do not “fix” by deleting unless Victor expands scope — document parity.
- **Crop math drift:** wrong scale/offset clamp changes saved avatars; unit-test metrics if extracted; keep canvas export in facade for visual parity.
- **Facade recursion / bootstrap order:** `controller.js` → `lifecycle.js` → `media.js` → `c/app.js`; wrappers must not call themselves.
- **c/app.js merge conflict** with timeline-visits candidate — see sequencing note.
- **C/B drift:** C-only wiring means B remains on monolith helpers until cover; Pages will not change.
- **Accidental modules dual-write:** forbid syncing `PetLive.pet.createPet` / Map stores.
- **i18n:** `speciesLabel` from form uses `t()` in facade — domain stores the string as today; language change must still recompute chrome via existing header/picker paths, not freeze wrong labels inside domain helpers.

## Acceptance criteria

### Architecture

- [ ] `domains/pets/lifecycle.js` and `media.js` exist with public APIs only; no DOM / direct `localStorage` / private cross-domain access.
- [ ] Mutations only via `pets[]` / `archivedPets[]` references; no `modules/pet` store writes.
- [ ] Selection controller remains behavior-compatible; lifecycle/media compose alongside it.
- [ ] Compatibility function names used by listeners remain available in `c/app.js` as thin facades.

### Behavior (C)

- [ ] Create pet from form: same default collections, tone cycling, identity fields, then select/apply as today.
- [ ] Edit current pet: identity fields update; visits/meds/vaccines/alerts unchanged.
- [ ] Archive flow: passed-date required toast; memorial note; pet moves to archive list; selection repair; navigate to archive screen.
- [ ] Remove flow: three-step confirm + name match; pet removed from active list; selection repair; home.
- [ ] Pet photo get/set/hydrate/flush and crop save → picker + emergency frame refresh parity.
- [ ] Pet switch / manage mode / picker rebuild rules unchanged.
- [ ] zh-Hant / en / ja / ko dynamic chrome still refreshes; user-authored names/notes unchanged.
- [ ] Timeline/visits/meds behavior not regressed by incidental `c/app.js` edits (smoke: open timeline after pet create/switch).

### Surface / tooling

- [ ] Only C + shared `domains/pets` lifecycle/media + QA tests changed; formal B untouched.
- [ ] Zero-build: `c/index.html` script order works under repo-root `python3 -m http.server`.
- [ ] `node --test qa/tests/*.test.js` passes including new pets-lifecycle boundary tests.
- [ ] No silent C → B cover or Pages publish in this slice.

## QA / review routing

- **QA required** — create/update/archive/remove selection repair, photo map set/hydrate/flush failure paths, facade regressions; include automated boundary tests; smoke vs timeline if both candidates share `c/app.js`.
- **Pharmacist skipped** — this slice does not change dose/unit/frequency/duration, Rx, source tags, or medical disclaimer copy; pet form weight/identity fields keep current semantics by extraction parity only. (If Builder accidentally alters weight/neutered field meaning, Arbiter should escalate to Pharmacist.)
- **UI light compatibility** — no intentional visual redesign; spot-check pet picker, archive list, add/edit form, photo crop overlay on C only (not a visual taste pass).

## Rollback

- Candidate stays off mainline (`proposal/pets-lifecycle-controller` or `proposals/20260826-pets-lifecycle-controller/preview`).
- Roll back by removing new domain scripts/tags and restoring `c/app.js` helper blocks from the candidate diff.
- No data migration; no Pages publish in this slice.

## Follow-ups (not this Gate A)

1. Archive → active restore (if Victor wants it).
2. Photo-map orphan cleanup on remove; quota UX.
3. Victor-confirmed C → B cover + Pages publish for shared pets domain + B facades.
4. Optional later: runtime adapter from `pets[]` snapshots → `PetLive.pet` **read** paths only (still no dual-write unless a dedicated proposal).
5. Breed UI extraction only if a later proposal measures value.

## Gate

This proposal stops at Gate A. No Builder, candidate product edit, or C/B cover may start until Victor confirms.

## Notes for Victor

確認後回覆「確認」開始平行製作；要改範圍請寫「修改：…」；不進行請「否決」。

**Standing north star (Victor):** 任何功能都應拆成獨立積木。本 slice 只做 **寵物本人（新增／封存／大頭照）**；Timeline + Visits 由並行提案負責 — 建議對 `c/app.js` **依序**合入或明確劃分函式所有權，避免雙人改同一檔互踩。

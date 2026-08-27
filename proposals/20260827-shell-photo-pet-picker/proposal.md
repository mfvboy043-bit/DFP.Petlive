---
id: 20260827-shell-photo-pet-picker
title: Shell — pet picker + photo crop render building blocks
status: proposed
author: planner
candidate_branch: "proposal/shell-photo-pet-picker"
candidate_path: "proposals/20260827-shell-photo-pet-picker"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Shell — pet picker + photo crop render

Companion: `state.yaml`.

## Goal

Extract **pet switcher HTML** and **photo-crop overlay style math** from surface `app.js` into testable building blocks. Crop geometry already lives in `domains/pets/media.js`; this slice finishes the shell side so facades only wire DOM, state, and listeners.

Behavior-preserving: same picker markup (selection, archive/remove affordances, add-pet row), same crop pan/zoom feel, same emergency photo frame after save.

## Audit (current)

| Piece | Where now | Action |
|---|---|---|
| Crop metrics / clamp / export rect | `domains/pets/media.js` | ✅ keep |
| `renderPhotoCropTransform` | `c/app.js` ~3090 | → thin wrapper + shell helper |
| `photoCropState`, `photoCropEls`, `bindPetPhotoCropUi` | facade | **stay** (state + listeners) |
| `openPetPhotoCrop`, `closePetPhotoCrop`, `exportPetPhotoCrop` | facade | **stay** (orchestration + canvas) |
| `petAvatarSvgForSpecies`, `PET_*_SVG` constants | facade ~2890–2936 | → pets render |
| `petAvatarMarkup` | facade ~3004 | → pets render |
| `renderPetPicker` | facade ~3236 | → thin wrapper |
| `syncPetPickerSelection`, `petPickerNeedsRebuild` | facade | **stay** (DOM diff / transition) |
| `renderEmergencyPetPhoto` | facade ~3013 | **stay** (small DOM apply; optional follow-up) |
| `renderPetHeader`, `renderArchiveList` | facade | **out of scope** (separate slice) |

## In scope

### SH-05-01 — `domains/pets/render.js`

Add `PetLiveWeb.domains.pets.createRenderer(deps)`:

- `buildPetAvatarMarkup(pet, { className, getPetPhoto })` — photo background or species SVG fallback
- `buildPetPickerHtml({ pets, currentPetId, getPetPhoto, label })` — full `#pet-picker` inner HTML including add-pet row
- Species SVG constants (`dog` / `cat` / paw) colocated in render module (no DOM)

Inject: `label(key, params?)`, `getPetPhoto(petId)`, `escapeHtml` only if needed for pet names (names are user text — escape in builder).

No `document`, `innerHTML` assignment, `localStorage`, or literal `t(` in domain file.

### SH-05-02 — `shell/photo-crop.js`

Add `PetLiveWeb.shell.createPhotoCrop(deps)`:

- `buildCropImageStyles(metrics)` → `{ width, height, transform }` strings for `#photo-crop-img`

Pure functions only; no element refs. Facade `renderPhotoCropTransform()` becomes: compute metrics → clamp → apply styles to `photoCropEls.img`.

### SH-05-03 — Wire C first

- `c/app.js`: init `petsRenderer` + `photoCropShell`; replace inline HTML/style math with delegates
- Script tags + `?v=` in `c/index.html`

### SH-05-04 — Tests

- `qa/tests/web-pets-render.test.js`
- `qa/tests/web-shell-photo-crop.test.js`

### SH-05-05 — Cover B after Victor adopt

- Mirror onto `apps/web/app.js` + B `index.html`.

## Out of scope

- Photo crop **open/close/save** flow, pointer listeners, canvas export
- `renderEmergencyPetPhoto`, `renderPetHeader`, `renderArchiveList`
- Archive / remove pet flows, manage-mode toggle logic
- New crop UX, aspect ratio, or storage format changes
- PERF / CSS bundler

## Likely files

| Layer | Path |
|---|---|
| Domain | `apps/web/domains/pets/render.js` (new) |
| Shell | `apps/web/shell/photo-crop.js` (new) |
| Facade | `apps/web/c/app.js`, later `apps/web/app.js` |
| Load | `apps/web/c/index.html`, later B `index.html` |
| QA | `qa/tests/web-pets-render.test.js`, `qa/tests/web-shell-photo-crop.test.js` |

## Risks

- **Pet name XSS** — picker prints `pet.name` unescaped today; builder should preserve current behavior (no accidental double-escape) unless Victor wants escape locked in tests.
- **Picker rebuild vs selection sync** — `petPickerNeedsRebuild` / `syncPetPickerSelection` must stay in facade; only innerHTML generation moves out.
- **Crop resize** — window `resize` handler must still call the same transform path; style output must match pixel-for-pixel.
- **Script order** — `render.js` after `media.js`; `photo-crop.js` after `PetLiveWeb.shell` namespace from navigation/coordinator.

## Acceptance criteria

- [x] Pet picker + avatar markup HTML under `domains/pets/render.js`
- [x] Crop image style builder under `shell/photo-crop.js`; metrics still from `petsMedia`
- [x] Pet switcher and photo crop overlay behave identically on C
- [x] `node --check apps/web/c/app.js` + new render tests pass
- [x] Follows `.cursor/rules/web-building-blocks.mdc`

## Notes for Victor（白話）

這批做兩塊「全 app 共用」的殼層 UI：

1. **寵物列（pet picker）** — 頭像、選中狀態、封存/刪除按鈕、新增寵物那列的 HTML，搬進 `domains/pets/render.js`。
2. **照片裁切** — 拖曳/zoom 後算 `#photo-crop-img` 寬高與 `transform` 的純函式，搬進 `shell/photo-crop.js`；裁切數學仍用既有的 `media.js`。

開關裁切 modal、存檔、急診大頭照、封存列表、首頁寵物標題 — **這次不動**，還留在 `app.js`。

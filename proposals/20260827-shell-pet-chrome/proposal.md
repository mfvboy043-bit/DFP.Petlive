---
id: 20260827-shell-pet-chrome
title: Shell — pet header, archive list, emergency photo render
status: proposed
author: planner
candidate_branch: "cursor/shell-pet-chrome-8ec1"
candidate_path: "proposals/20260827-shell-pet-chrome"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Shell — pet header / archive / emergency photo (SH-06)

Companion: `state.yaml`. Continues adopted `20260827-shell-photo-pet-picker` (SH-05).

## Goal

Extract the three leftover **pet chrome** HTML/copy builders that SH-05 explicitly left in `app.js`: home pet header copy, archive-list markup, and emergency-card photo-frame presentation. Facades keep DOM assignment, the `is-updating` header animation, archive-button aria, and crop open/save listeners.

Behavior-preserving. No new archive photos, no crop UX change, no medical-copy change.

## Audit (current, on `main` / FO-05)

| Piece | Where now | Action |
|---|---|---|
| Pet picker + avatar markup | `domains/pets/render.js` | ✅ keep |
| Crop image styles | `shell/photo-crop.js` | ✅ keep |
| `PET_FRAME_EMPTY_SVG` | `c/app.js` ~2263 / B ~2417 | → pets render constant |
| `renderEmergencyPetPhoto` | `c/app.js` ~2337 / B ~2491 | → presentation builder + thin facade |
| `renderArchiveList` item/empty HTML | `c/app.js` ~2586 / B ~2740 | → pets render |
| `archiveBtn` aria/title | same function | **stay** (DOM) |
| `renderPetHeader` copy | `c/app.js` ~2765 / B ~2919 | → copy builder + thin facade |
| `is-updating` class + rAF | `renderPetHeader` | **stay** (DOM animation) |
| Crop open / close / export / listeners | facade | **stay** (SH-05 non-goal) |

## In scope

### SH-06-01 — Extend `domains/pets/render.js`

Add to existing `PetLiveWeb.domains.pets.createRenderer(deps)` (do not invent a second pets renderer):

- `buildPetHeaderCopy(pet, { speciesLabelOf, breedLabelOf, ageLabelOf })` →
  `{ nameText, subText, timelineSub, visitFormSub, vaccineSub }`
  - `pet` missing: empty-pets title/sub; other subs `""`
  - `pet` present: `pet.name` + `label("petSub", …)` + timeline / visit / vaccine sub keys (same as today)
- `buildArchiveEmptyHtml()` — `<li class="archive-empty">…</li>`
- `buildArchiveItemHtml(pet, { speciesLabelOf, breedLabelOf })` — same markup as today, including **empty** `<div class="archive-item-photo">` (do not add photos)
- `buildArchiveListHtml(archivedPets, …)` — empty vs joined items
- `buildEmergencyPhotoFrame(pet)` →
  `{ hasPhoto, backgroundImage, frameInnerHtml, labelKey }`
  - photo present: `hasPhoto`, `url('…')`, empty inner, `petPhotoChange`
  - else: no photo class, no background, empty-frame SVG, `petPhotoUpload`
- Colocate `PET_FRAME_EMPTY_SVG` in the render module (camera-frame empty, not species avatar)

Inject (extend current deps): `label`, `getPetPhoto` (already required); `speciesLabelOf`, `breedLabelOf`, `ageLabelOf` for header/archive.

No `document`, `innerHTML` assignment, `localStorage`, or literal `t(` in the domain file (existing `web-pets-render.test.js` guard). Use `frameInnerHtml` as a field name if needed so the source does not contain `innerHTML`.

### SH-06-02 — Wire C first

- `c/app.js`: extend `petsRenderer` factory deps; `renderPetHeader` / `renderArchiveList` / `renderEmergencyPetPhoto` become apply-only facades
- Bump `c/index.html` `domains/pets/render.js?v=`

### SH-06-03 — Tests

Extend `qa/tests/web-pets-render.test.js` (prefer extend over a new file):

- header copy: empty vs named pet (species/breed/age/weight interpolation keys)
- archive: empty list vs one item (`archive-empty`, `archive-item`, empty photo div, memorial line)
- emergency frame: photo vs no-photo (label keys, empty SVG vs cleared inner)

### SH-06-04 — Cover B after Victor adopt

Mirror onto `apps/web/app.js` + B `index.html` cache `?v=`. Not in Gate A build.

## Out of scope

- Photo crop **open / close / save**, pointer listeners, canvas export
- `syncPetPickerSelection` / `petPickerNeedsRebuild`
- Filling `archive-item-photo` with real photos (today it is an empty box — preserve)
- Archive / remove pet **flows** (`openArchivePetFlow`, confirm, remove steps)
- `renderAlertBadge` / nav tone
- CSS, layout, i18n key changes, medical copy
- Bundler / PERF reconcile

## Likely files

| Layer | Path |
|---|---|
| Domain | `apps/web/domains/pets/render.js` (extend) |
| Facade | `apps/web/c/app.js`; later `apps/web/app.js` |
| Load | `apps/web/c/index.html` `?v=` bump; later B `index.html` |
| QA | `qa/tests/web-pets-render.test.js` |

## Risks

- **Empty archive photo box** — easy to “improve” by plugging avatars; that would be a visual change. Keep the empty `archive-item-photo` div.
- **Header animation** — moving classList/rAF into the domain would break the layer rule; keep animation in the facade even if copy comes from the builder.
- **Emergency frame DOM ids** — facade still owns `#e-pet-photo` / `#e-pet-photo-preview`; builder returns data only.
- **User-authored name/note** — archive memorial + pet names stay unescaped as today (match SH-05 picker; no new escape unless tests already require it).
- **i18n** — header/archive/photo labels must still go through injected `label` so language switch recomputes chrome; user names stay as entered.
- **Script cache** — bump `?v=` on `pets/render.js` only; no new script tag.

## Acceptance criteria

- [ ] Header / archive / emergency-photo markup or copy live under `domains/pets/render.js`
- [ ] C facades only assign DOM + keep `is-updating` animation and archive-btn aria
- [ ] Empty archive list, memorial line, and empty photo box match current HTML
- [ ] Emergency frame still toggles `has-photo` + camera SVG vs photo background
- [ ] Existing SH-05 picker tests still pass; new SH-06 cases pass; `node --check apps/web/c/app.js`
- [ ] Follows `.cursor/rules/web-building-blocks.mdc`
- [ ] No silent C → B cover in this slice

## Notes for Victor（白話）

SH-05 把寵物列和裁切數學拆走了。這盒把同一層剩下的三塊殼拆完：

1. **首頁寵物標題** — 名字、品種／年齡／體重那行、時間軸／看診／疫苗副標的文案組裝。跳動動畫還留在畫面上。
2. **彩虹封存列表** — 空狀態與每一列 HTML。封存／刪除流程不動；列表左邊的照片格今天是空的，這次也不填。
3. **急診卡大頭照框** — 有照片／沒照片（相機空框 SVG）的呈現資料。裁切 modal 開關與存檔仍留在 `app.js`。

C 先接線；採用後再覆蓋 B。

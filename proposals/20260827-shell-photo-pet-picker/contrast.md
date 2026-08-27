# Contrast: main vs `proposal/shell-photo-pet-picker`

## Summary

| | Main (`d233278`) | Candidate (`564b2e9`) |
|---|---|---|
| Pet picker HTML | ~50 lines inline in `c/app.js` | `domains/pets/render.js` |
| Species avatar SVGs | constants in facade | colocated in pets render |
| Photo crop img styles | inline in `renderPhotoCropTransform` | `shell/photo-crop.js` |
| Crop math / clamp | `domains/pets/media.js` | unchanged |
| B surface | unchanged | not covered yet (C only) |

## Facade delta (C)

- Removed `PET_AVATAR_SVG_*`, `petAvatarSvgForSpecies`, `petAvatarMarkup`
- Added `petsRenderer`, `photoCropShell` init block
- `renderPetPicker()` → one-line `buildPetPickerHtml` delegate
- `renderPhotoCropTransform()` → clamp + `buildCropImageStyles`

## Unchanged (by design)

- `renderEmergencyPetPhoto`, `renderPetHeader`, `renderArchiveList`
- Photo crop open/close/save, pointer listeners, canvas export
- `syncPetPickerSelection`, `petPickerNeedsRebuild`

## Verify

```bash
node --check apps/web/c/app.js
node --test qa/tests/web-pets-render.test.js qa/tests/web-shell-photo-crop.test.js
```

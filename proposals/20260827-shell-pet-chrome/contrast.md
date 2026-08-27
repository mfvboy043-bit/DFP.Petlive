# Contrast: main vs `cursor/shell-pet-chrome-8ec1`

## Summary

| | Main (`71a0472`) | Candidate (`5437954`) |
|---|---|---|
| Home pet header copy | inline `t()` in `renderPetHeader` | `domains/pets/render.js` `buildPetHeaderCopy` |
| Archive list HTML | inline in `renderArchiveList` | `buildArchiveListHtml` / empty + item builders |
| Emergency photo frame | `PET_FRAME_EMPTY_SVG` + class/style in facade | `buildEmergencyPhotoFrame` + apply-only facade |
| Header `is-updating` animation | facade | unchanged (facade) |
| Archive button aria/title | facade | unchanged (facade) |
| B surface | covered — same facades + `index.html` `?v=20260827-sh-06` |

## Facade delta (C + B)

- Removed `PET_FRAME_EMPTY_SVG`
- `petsRenderer` now also injects `speciesLabelOf`, `breedLabelOf`, `ageLabelOf`
- `renderPetHeader` keeps class/rAF animation; assigns copy from builder
- `renderArchiveList` keeps archive-btn aria; list HTML from builder
- `renderEmergencyPetPhoto` applies `{ hasPhoto, backgroundImage, frameInnerHtml, labelKey }`

## Unchanged (by design)

- Photo crop open/close/save, pointer listeners, canvas export
- `syncPetPickerSelection`, `petPickerNeedsRebuild`
- Archive / remove pet flows
- Empty `archive-item-photo` box (no avatars filled in)
- Chrome label deps stay lazy-required so a SH-05-only `createRenderer({ label, getPetPhoto })` still boots

## Verify

```bash
node --check apps/web/c/app.js apps/web/app.js
node --test qa/tests/web-pets-render.test.js
```

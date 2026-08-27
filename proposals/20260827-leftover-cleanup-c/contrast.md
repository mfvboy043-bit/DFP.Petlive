# Contrast: adopted leftover cleanup (C + B cover)

## Before

- Clinic presets, vaccine chip groups, and demo `SEED_PETS` lived inside surface facades.
- Photo crop JPEG export drew canvas inline in the facade.
- Timeline rebuild was all-or-nothing (list signature skip-noop only).
- Visit tag / source-tag maps sat in the facade.

## After (C + formal B)

- `domains/clinics/catalog.js` owns clinic presets + directory / label helpers.
- `domains/vaccines/presets.js` owns chip groups (`getPresetGroups`).
- `domains/pets/seed.js` owns demo seed + `cloneSeedPets`.
- `domains/visits/labels.js` owns visit-tag i18n map + source tags.
- `domains/pets/media.js` exports `exportCroppedJpegDataUrl`.
- Timeline list items carry `data-visit-index`; `planKeyedListReconcile` enables partial row replace with chronological weight-vs neighbors.
- Both `apps/web/c/*` and formal `apps/web/app.js` + `index.html` wired.

## Files touched

- Shared domains as in candidate
- `apps/web/c/app.js`, `apps/web/c/index.html`
- `apps/web/app.js`, `apps/web/index.html` (B cover)
- QA tests + `proposals/20260827-leftover-cleanup-c/*`

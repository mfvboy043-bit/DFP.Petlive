# Contrast: mainline B vs candidate C leftover cleanup

## Mainline (formal B / pre-candidate)

- Clinic presets, vaccine chip groups, and demo `SEED_PETS` live inside surface `app.js`.
- Photo crop JPEG export draws canvas inline in the facade.
- Timeline rebuild is all-or-nothing (list signature skip-noop only).
- Visit tag / source-tag maps sit in the facade.

## Candidate (surface C)

- `domains/clinics/catalog.js` owns clinic presets + directory / label helpers.
- `domains/vaccines/presets.js` owns chip groups (`getPresetGroups`).
- `domains/pets/seed.js` owns demo seed + `cloneSeedPets`.
- `domains/visits/labels.js` owns visit-tag i18n map + source tags.
- `domains/pets/media.js` exports `exportCroppedJpegDataUrl` (injectable canvas).
- Timeline list items carry `data-visit-index`; `planKeyedListReconcile` enables partial row replace on C.
- Formal B / `apps/web/app.js` untouched.

## Files touched

- `apps/web/domains/clinics/catalog.js` (new)
- `apps/web/domains/vaccines/presets.js` (new)
- `apps/web/domains/pets/seed.js` (new)
- `apps/web/domains/visits/labels.js` (new)
- `apps/web/domains/pets/media.js`
- `apps/web/domains/timeline/render.js`
- `apps/web/c/app.js`
- `apps/web/c/index.html`
- `qa/tests/web-clinics-catalog.test.js` (new)
- `qa/tests/web-vaccines-presets.test.js` (new)
- `qa/tests/web-pets-seed.test.js` (new)
- `qa/tests/web-timeline-render.test.js`
- `qa/tests/web-shell-photo-crop.test.js`
- `proposals/20260827-leftover-cleanup-c/*`

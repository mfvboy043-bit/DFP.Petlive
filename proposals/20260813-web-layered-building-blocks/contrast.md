# Contrast: mainline vs layered building-block candidate

## Mainline

- `apps/web/app.js` directly owns storage parsing/writes, selected-pet state, navigation, and broad screen rendering.
- Switching pets refreshes home and also schedules render work for hidden screens.
- Owner-profile demo data is persisted during startup and can overwrite an existing profile path.
- Storage helpers repeatedly read and parse the same JSON keys.
- Compatibility behavior, UI markup, medical semantics, and zero-build preview are all contained in the monolith.

## Candidate

- Adds independent storage, shared-state, navigation, render-coordinator, and pet-selection building blocks while keeping `pets[]` as the only write truth.
- Switching pets refreshes home and the active screen; hidden screen groups are marked dirty and flushed on entry.
- Demo owner data is a non-persisted fallback; failed writes do not claim success or discard drafts.
- Parsed storage values are cached and invalidated on explicit writes.
- Existing `app.js` function names remain as compatibility facades; current timeline UI, i18n assets, emergency/drug bridge, medical semantics, and repo-root preview are preserved.

## Candidate files

### Added

- `preview/apps/web/core/storage.js`
- `preview/apps/web/core/state.js`
- `preview/apps/web/shell/navigation.js`
- `preview/apps/web/shell/render-coordinator.js`
- `preview/apps/web/domains/pets/controller.js`
- `preview/qa/tests/web-building-blocks.test.js`

### Changed from mainline baseline

- `preview/apps/web/app.js`
- `preview/apps/web/index.html`

### Candidate documentation

- `preview/README.md`

## Review result

- Iteration 1 blockers: wrong baseline, false-success storage writes, vaccine draft loss.
- Iteration 2 resolved all blocking IDs: `QA-001`, `QA-002`, `QA-004`, `UI-001`.
- QA, UI, and Pharmacist reviews pass.
- Remaining non-blocking follow-ups: `QA-003`, `UI-002`, `UI-003`.
- Node tests and full browser/phone interaction were unavailable; JavaScriptCore parsing, static guards, HTTP assets, and IDE diagnostics passed.

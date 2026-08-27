# QA review
Verdict: pass

## Findings

### QA-001 resolved — formal B createRenderer boot no longer throws
- ID: QA-001
- Severity: high (resolved)
- Steps:
  1. Confirm branch still leaves `apps/web/app.js` calling `createRenderer({ label, getPetPhoto })` only (no species/breed/age injectors; no B chrome cover).
  2. Load shared `apps/web/domains/pets/render.js` and run `PetLiveWeb.domains.pets.createRenderer({ label, getPetPhoto })`.
  3. Call SH-05 `buildPetPickerHtml` on that instance; separately call `buildPetHeaderCopy` without chrome deps.
- Expected: Boot succeeds; picker builders work; chrome builders fail only when invoked without injectors (lazy require).
- Actual: Boot does not throw. Picker HTML builds. `buildPetHeaderCopy` throws `TypeError: … requires speciesLabelOf(pet)` only on call. Covered by `qa/tests/web-pets-render.test.js` (“formal B compat”) and a Node snippet (`bootThrows: false`). Prior reject cause is fixed.

## Checks (no open defect IDs)

| Check | Result |
|---|---|
| Empty pets header | Pass — `buildPetHeaderCopy(null)` → empty title/sub; timeline/visit/vaccine `""`; C facade null-guards those els on empty path |
| Empty archive | Pass — `buildArchiveListHtml([])` → `archive-empty` via `label("archiveEmpty")` |
| Archive photo box | Pass — item keeps empty `<div class="archive-item-photo">` (no avatar/photo fill) |
| Memorial / leftOn line | Pass — date + optional ` · note` match prior markup |
| Emergency photo vs no photo | Pass — `has-photo` + `url('…')` + empty inner vs cleared background + camera SVG + upload/change label keys |
| Header `is-updating` | Pass — classList + rAF remain in C `renderPetHeader` before copy apply |
| C chrome injectors | Pass — `petsRenderer` init passes `speciesLabelOf`, `breedLabelOf`, `ageLabelOf` (function decls, hoisted) |
| Formal B unchanged chrome | Pass — B still owns inline header/archive/emergency; shared module remains SH-05-boot-compatible |
| `node --check apps/web/c/app.js` | Pass |
| `node --test qa/tests/web-pets-render.test.js` | Pass (7/7) |

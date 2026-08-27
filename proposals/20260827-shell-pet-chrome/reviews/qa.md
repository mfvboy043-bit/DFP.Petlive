# QA review
Verdict: reject

## Findings

### Shared pets render requires new deps; formal B createRenderer throws
- ID: QA-001
- Severity: high
- Steps:
  1. Confirm this branch does not change `apps/web/app.js` or `apps/web/index.html` (B still calls `createRenderer({ label, getPetPhoto })` only).
  2. Load formal B so it executes shared `apps/web/domains/pets/render.js` (cache miss / hard reload on `render.js?v=20260827-sh-render`, or any path that reads the updated file).
  3. Observe top-level init at `petsRenderer = PetLiveWeb.domains.pets.createRenderer(...)`.
- Expected: C-only SH-06 leaves B boot and pet chrome unchanged until an explicit C→B cover (proposal SH-06-04).
- Actual: New `createRenderer` throws `TypeError: createRenderer requires speciesLabelOf(pet)` when the new deps are omitted. `petsRenderer` never initializes on B → picker / header / archive / emergency photo facades that gate on `petsRenderer` no-op or fail. Reproduced with Node: createRenderer({ label, getPetPhoto }) throws the same TypeError.

## Checks (C candidate — no additional defect IDs)

| Check | Result |
|---|---|
| Validation / error toasts | Pass — no form/validation paths in scope; photo crop fail toast facade unchanged |
| Pending state loss | Pass — no pending med / archive / crop state moved |
| Back navigation | Pass — archive / crop / screen flows stay in `app.js` |
| Empty pets header | Pass — `buildPetHeaderCopy(null)` → empty title/sub; timeline/visit/vaccine subs `""`; facade still null-guards those els |
| Empty archive | Pass — `buildArchiveListHtml([])` → `archive-empty` via `label("archiveEmpty")` |
| Archive photo box | Pass — item HTML keeps empty `<div class="archive-item-photo">` (no avatar/photo fill) |
| Emergency photo vs no photo | Pass — `has-photo` + `url('…')` + empty inner vs cleared background + camera SVG + upload/change label keys |
| Header `is-updating` animation | Pass — classList + rAF remain in `renderPetHeader` facade before copy apply |
| Multi-pet writes | Pass — builders are pure; facades still apply for the `pet` / `archivedPets` the coordinator passes; no new pet-id writes |
| C init order | Pass — `speciesLabelOf` / `breedLabelOf` / `ageLabelOf` are hoisted functions; `petsRenderer` assigned before boot `applySelectedPet()` |
| `node --check apps/web/c/app.js` | Pass |
| `node --test qa/tests/web-pets-render.test.js` | Pass (6/6) |

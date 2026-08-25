# QA review
Verdict: conditional

## Findings

### Suggestion tap can lose known-key commit on touch (blur clears list)
- ID: QA-001
- Severity: medium
- Steps:
  1. On a phone (or touch emulator), open add/edit pet, species 犬 or 貓.
  2. Type a keyword so `#breed-results` shows at least one suggestion (e.g. `柴`).
  3. Tap a suggestion row (do not use a chip).
  4. Save the pet (or inspect `#breed-select` / saved `breedKey`).
- Expected: Tap commits that breed’s stable `value` as `breedKey`, chips show it selected (pinned if non-common while collapsed), search face shows the locale label.
- Actual: Blur on `#breed-search` schedules `hideBreedResults()` at 180ms and clears the list DOM. Only `mousedown` + `preventDefault` guards focus (desktop-oriented); there is no `touchstart`/`pointerdown` cancel of the blur timer. On touch, blur often runs before the synthetic click, so the list can disappear without applying `data-breed-suggest`. Form stays on `__custom__` with the typed query — save stores custom text instead of the known key (no silent coerce the other way, but known-key select fails).

### Empty `setSelectedBreed("")` leaves prior search text
- ID: QA-002
- Severity: low
- Steps:
  1. Edit a pet with a known breed (search shows its label).
  2. Without `form.reset()`, run a path that calls `setSelectedBreed("")` / `syncBreedFields({ keepSelection: false })` and then does not assign a new breed face (e.g. hydrate a pet with empty `breedKey` and empty `breed`, or interrupt fill before the custom/known assignment).
  3. Observe `#breed-search` vs `#breed-select`, then submit.
- Expected: Empty selection clears the search face so UI matches `breedSelect`.
- Actual: `updateBreedSearchFace` only writes the input when `value` is a known key; for `""` / `__custom__` it leaves existing text. Search can still show a previous label while `breedSelect` is empty. Submit uses `resolveBreedFromForm` (empty select ≠ `__custom__` path) → empty breed → `toastNeedBreed`, which contradicts the visible text.

## Checked (no defect filed)

- Free-typed text without clicking a suggestion → `__custom__` only (no silent coerce to a matched key); `resolveBreedKeyFromForm` / `resolveBreedFromForm` honor `breedSelect` vs `breedCustom`.
- Chip → search face sync via `setSelectedBreed` → `updateBreedSearchFace`;「其他」focuses search and clears when leaving a known key.
- Typeahead pick → `setSelectedBreed(value)` rebuilds collapsed chips (non-common pin) and hides results.
- Empty query → `searchBreeds`/`renderBreedResults` hide list (no full dump); species `other` hides results and keeps free text.
- Escape hides results and blurs; species change clears search + results then `syncBreedFields`.
- Edit hydrate: known key shows label + chip; custom/`other` restores `pet.breed` into `name="breedCustom"`.
- Language change calls `syncBreedFields()` so known-key face labels recompute.

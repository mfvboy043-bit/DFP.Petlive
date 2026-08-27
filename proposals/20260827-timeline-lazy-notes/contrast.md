# Contrast: Timeline lazy-notes (adopted)

## Candidate (now on main)

- Branch: `proposal/timeline-lazy-notes` → main `abbe909..ab09e48`
- Surface: **C only** + `domains/timeline/view.js`

## Before

- Eager full drug-note HTML in every timeline/emergency med panel (hidden).
- `findDrugByMedName` inline in `c/app.js`.

## After

- Domain view helpers: `resolveDrugNoteModel`, `notesIdForMed`, lazy hydrate on first toggle.
- Initial paint: shell only; body fills once on open.
- Formal B unchanged until cover.

## Files adopted

- `apps/web/domains/timeline/view.js`
- `apps/web/c/app.js`, `apps/web/c/index.html`
- `qa/tests/web-timeline-view.test.js`

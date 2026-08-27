# Contrast: Breed controller (adopted)

## Candidate (now on main)

- Branch: `proposal/timeline-lazy-notes` → main `abbe909..ab09e48`
- Surface: **C only** + `domains/breed/`

## Before

- Search/filter/group/collapse logic inline in `c/app.js` breed block.

## After

- `domains/breed/selectors.js` + `controller.js` (expand boolean).
- `breeds-database.js` stays catalog; C facades keep DOM/listeners/t().
- Formal B unchanged until cover.

## Files adopted

- `apps/web/domains/breed/selectors.js`, `controller.js`
- `apps/web/c/app.js`, `apps/web/c/index.html`
- `qa/tests/web-breed-controller.test.js`

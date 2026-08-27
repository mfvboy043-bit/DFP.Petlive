# Contrast: Labs candidate vs mainline

## Candidate

- Branch: `proposal/labs-controller` (`f6f8922`)
- Surface: **C** + shared `domains/labs`
- Formal B already loads labs domain (prior cover); this Gate B finishes C

## Before (main C)

1. Labs type/sort/match/CRUD inlined in `c/app.js`
2. No labs script tags on C (or incomplete wire)

## After (candidate)

1. `domains/labs` selectors + controller
2. C facades + `?v=20260827-lb-ctrl`
3. Empty-photo add rejected; chrome unchanged

## Files to adopt

- `apps/web/domains/labs/*` (if not already on main)
- `apps/web/c/app.js`, `apps/web/c/index.html`
- `qa/tests/web-labs.test.js`
- `proposals/20260827-labs-controller/*`

## Exclude

- Owner / storage / imaging WIP
- Re-cover B unless Victor asks

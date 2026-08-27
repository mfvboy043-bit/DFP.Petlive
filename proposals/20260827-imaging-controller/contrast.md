# Contrast: mainline vs Imaging candidate

## Candidate

- Branch: `proposal/labs-imaging-controller` (C slice)
- Path: `proposals/20260827-imaging-controller`
- Surface: **C only** + shared `domains/imaging`
- Status: `candidate_ready` (iteration 1)

## Mainline vs candidate

1. **Before:** Imaging helpers lived in `domains/visits/controller.js`; C Save assigned `visit.imaging` inline.
2. **After:** Dedicated `domains/imaging` with `setVisitImaging` / `imagingTypeKeys`; C facades + timeline inject imaging; **visits keeps imaging exports until B cover** (formal B compat).
3. **Timeline:** `createSelectors` prefers `imaging.visitHasImaging`, falls back to `visits.visitHasImaging` for B.
4. **Shell:** compress/pending/thumbs/lightbox/render stay in `c/app.js`.

## Files

### Add
- `apps/web/domains/imaging/controller.js`
- `qa/tests/web-imaging.test.js`

### Change
- `apps/web/domains/timeline/selectors.js` — imaging inject + B fallback
- `apps/web/c/app.js` — imaging facades, `setVisitImaging` Save, pet-switch pending clear
- `apps/web/c/index.html` — imaging script tag + cache bump
- `qa/tests/web-timeline-visits.test.js` — imaging moved + B-compat test

### Unchanged (until B cover)
- `domains/visits/controller.js` — imaging APIs retained for formal B

### Exclude
- Formal B `app.js` / Pages until Victor confirms cover

## Merge checklist (after 採用)

- [x] Victor said 採用 + 覆蓋 B (2026-08-27)
- [x] Land on main (C + domains/imaging + timeline inject)
- [x] C → B cover (B facades + `setVisitImaging`; visits duplicate deferred)

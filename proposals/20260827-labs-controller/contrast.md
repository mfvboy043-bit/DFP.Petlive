# Contrast: mainline vs Labs candidate

## Candidate

- Branch: `proposal/labs-imaging-controller` (C slice)
- Path: `proposals/20260827-labs-controller`
- Surface: **C only** + shared `domains/labs`
- Status: `candidate_ready` (iteration 1)

## Mainline vs candidate

1. **Before:** Lab type/sort/match/CRUD inline in `c/app.js` (~2578–2664 + form handlers).
2. **After:** `domains/labs` selectors + controller; C facades delegate; shell keeps render/forms/compress/`t()`.
3. **Storage:** C `petlive-c-lab-reports` unchanged; formal B `petlive-lab-reports` untouched until cover.
4. **Cloud:** already injects `labReportsSlot` — no cloud edits.

## Files

### Add
- `apps/web/domains/labs/selectors.js`
- `apps/web/domains/labs/controller.js`
- `qa/tests/web-labs.test.js`

### Change
- `apps/web/c/app.js` — labs facades + build/add/remove via controller
- `apps/web/c/index.html` — labs script tags + cache bump

### Exclude
- Formal B / Pages until Victor confirms cover
- UX redesign, CBC values, cloud brain moves

## Merge checklist (after 採用)

- [x] Victor said 採用 + 覆蓋 B (2026-08-27)
- [x] Land on main (C + domains/labs)
- [x] C → B cover (formal B facades + `petlive-lab-reports` + DEMO_MODE bump)

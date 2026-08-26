# Contrast: mainline vs Parasite candidate

## Candidate

- Branch: `proposal/parasite-controller`
- Path: `proposals/20260826-parasite-controller`
- Surface: **C only** + shared `domains/parasite`
- Status: `candidate_ready` (iteration 1)

## Mainline behaviors

1. Parasite catalog, status, next-due, dual sync, save logic inline in `c/app.js`.
2. Cat heartworm optional applied in strip render only.
3. Calendar chooser + Google/Apple open in C; payload uses `t()`.
4. Formal B unchanged by this Gate A scope.

## Candidate behaviors

1. Same rules in `PetLiveWeb.domains.parasite` controller + selectors.
2. `getParasiteSlotStatus` (incl. optional) shared for strip.
3. C facades keep chips / fill / strip / chooser / open calendar; domain returns pure calendar data.
4. Write truth remains `pet.parasitePrevention`; no module Map dual-write.
5. Persist gap after save (no `applySelectedPet`) preserved on purpose (QA-002).

## Files to adopt (this proposal only)

### Add
- `apps/web/domains/parasite/controller.js`
- `apps/web/domains/parasite/selectors.js`
- `qa/tests/web-parasite.test.js`

### Change
- `apps/web/c/app.js` — parasite compose + facades
- `apps/web/c/index.html` — parasite script tags + cache `?v=`

### Exclude from adopt
- Unrelated C WIP (e-card / i18n / styles — UI-001)
- Formal B until Victor confirms C → B cover

## Reviewer verdicts

- Pharmacist: pass (MED-001 contract vs due-today advisory)
- QA: conditional → no blockers (QA-001 commit hygiene; QA-002/003 pre-existing)
- UI: pass (UI-001 unrelated WIP)
- Arbiter: `candidate_ready`

## Merge checklist (after 採用 only)

- [x] Victor said 採用
- [x] Cherry-pick onto main (scoped; index conflicts kept main UI WIP)
- [x] Set proposal `status: adopted`
- [ ] C → B cover — ask Victor separately (not auto)

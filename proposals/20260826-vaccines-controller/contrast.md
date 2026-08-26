# Contrast: mainline vs Vaccines candidate

## Candidate

- Branch: `proposal/vaccines-controller` (commit `3b97a72+`)
- Path: `proposals/20260826-vaccines-controller`
- Surface: **C only** + shared `domains/vaccines`
- Status: `adopted` (Gate B 採用 2026-08-26; source `3b97a72`)

## Mainline behaviors

1. Vaccine catalog meta, protection lamps, grouping/sort, species gate, and `upsertPetVaccines` live inline in `c/app.js`.
2. Form chips, HTML list, nav lights, calendar payload stay in C with `t()`.
3. No `PetLiveWeb.domains.vaccines` scripts on C.

## Candidate behaviors

1. Same vaccine UX; rules in `domains/vaccines/selectors.js` + `controller.js`.
2. C keeps facades, `refreshVaccineForm` draft logic, render*, listeners.
3. `pets[]` / `pet.vaccines[]` write truth; no `modules/vaccine` dual-write.
4. C loads vaccines scripts after meds, before `app.js`.

## Files to adopt (this proposal only)

### Add
- `apps/web/domains/vaccines/selectors.js`
- `apps/web/domains/vaccines/controller.js`
- `qa/tests/web-vaccines.test.js`

### Change
- `apps/web/c/app.js` — vaccine facades + bootstrap + submit pipeline
- `apps/web/c/index.html` — vaccines script tags + `app.js` cache `?v=`

### Exclude from this adopt
- `apps/web/c/styles.css`, `apps/web/c/i18n.js` (unrelated WIP)
- Formal B until Victor confirms cover
- Alerts/meds/parasite deltas bundled in same worktree but outside VC scope

## Reviewer verdicts

- QA: conditional → **QA-001 resolved** (branch commit); QA-002 non-blocking (run node tests locally)
- Pharmacist: conditional — MED-001..003 non-blocking (pre-existing rabies substring / brand label notes)
- UI: pass (UI-001 P3 hygiene only)
- Arbiter: `candidate_ready`

## Merge checklist (after 採用)

- [x] Victor said 採用 (2026-08-26)
- [x] Surgical copy from `3b97a72` VC files onto main (no blind-merge of proposal branch)
- [x] Exclude unrelated C styles/i18n WIP unless Victor wants bundled
- [x] Set proposal `status: adopted`
- [x] C → B cover (Victor 覆蓋 2026-08-27): formal B loads `domains/vaccines` + app.js facades/`buildSaveEntries`; B-only auth kept; Pages cache `?v=20260826-vc-cover`

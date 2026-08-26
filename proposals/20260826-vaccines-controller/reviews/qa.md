# QA review
Verdict: conditional

## Scope checked

- `apps/web/domains/vaccines/selectors.js` — protection thresholds, grouping/sort, species gate, injected `daysUntil` / rabies helpers
- `apps/web/domains/vaccines/controller.js` — `upsertPetVaccines`, `validateSave`, `buildSaveEntries`, `wasVaccineUpdated`
- `apps/web/c/app.js` — vaccine facades (4712–4777), `refreshVaccineForm` draft snapshot/restore (2447–2468), submit facade via `buildSaveEntries` (7141–7188), chip exclusive groups (7046–7068), render list/strip/emergency nav
- `apps/web/c/index.html` — vaccines domain script tags after meds, before `c/app.js`
- `qa/tests/web-vaccines.test.js` — VC-04 boundary coverage (static read; node unavailable in review env)
- `proposals/20260826-vaccines-controller/proposal.md` acceptance / ARCH draft-preservation notes

## Findings

### Candidate domain + tests not on branch commit
- ID: QA-001
- Severity: medium
- Steps: 1. `git checkout proposal/vaccines-controller` on a clean clone. 2. Open `apps/web/c/index.html` (loads `../domains/vaccines/selectors.js` + `controller.js`). 3. Boot C.
- Expected: Domain scripts load; `PetLiveWeb.domains.vaccines.createSelectors` runs during `c/app.js` bootstrap.
- Actual: `apps/web/domains/vaccines/*` and `qa/tests/web-vaccines.test.js` are **untracked**; `c/app.js` / `c/index.html` wiring is **uncommitted**. Fresh checkout 404s domain scripts → boot throws before any vaccine UI runs. Iteration 1 is only reproducible from Victor's current working tree, not from the named candidate branch alone.

### Automated VC-04 suite not executed in review
- ID: QA-002
- Severity: low
- Steps: 1. Run `node --test qa/tests/web-vaccines.test.js qa/tests/web-building-blocks.test.js`.
- Expected: All tests pass (proposal VC-04 + ARCH draft-preservation slice in building-blocks).
- Actual: Review environment had no `node` binary; verdict relies on static parity check vs pre-extract inline helpers and test source inspection. Recommend Builder/CI confirm green before Gate B.

## Behavior parity (no material vaccine regressions found)

Static diff vs pre-extract `c/app.js` inline helpers:

| Area | Result |
|---|---|
| Protection lamps (expired ≤0, approaching 1–90, protected >90) | Domain matches removed inline `getVaccineProtectionStatus` |
| List order / superseded pills | `compareVaccinesForList` / `getVaccineSuccessor` unchanged semantics |
| Home strip + emergency nav urgency / displayRank | Facades delegate only; render paths unchanged |
| Cat rabies block (key, localized label, substring heuristics) | C injects `isRabiesLocalizedName` (includes I18N exact `vRabies` label match); domain fallback matches old substring path |
| Form validation toasts | Submit maps `buildSaveEntries` reasons 1:1 to prior inline checks (`need_name`, `species_blocked`, `need_dates`, `date_order`) |
| Upsert replace-by-key/name, newest-first | Controller byte-aligned with removed `upsertPetVaccines` |
| Updated vs added toast | `wasVaccineUpdated` evaluated before upsert, same as main |
| Same-pet dirty refresh / pet-switch reset | `refreshVaccineForm` + `vaccineFormPetId` logic untouched; building-blocks source test still valid |
| Multi-pet writes | Submit uses `getCurrentPet()`; pet switch triggers coordinator flush → form reset on id change |
| `modules/vaccine` dual-write | Not introduced; domain scripts grep-clean |

Pre-existing gaps **not introduced by VC-01..04** (not counted against pass): vaccine submit does not call `schedulePetsGraphPersist()` (same as main — persist on `applySelectedPet` only); no null-pet guard on submit (would throw on upsert, same as main).

## Notes

- Branch `proposal/vaccines-controller` diverges from current `main` (missing mainline `pets/lifecycle.js` / `pets/media.js` tags); candidate `c/app.js` still uses inline photo helpers, so this is merge skew rather than a vaccine-runtime defect in isolation.
- Bundled non-VC deltas in the same worktree (`c/i18n.js`, `c/styles.css`, alerts/meds facades) were not treated as vaccine regressions.

# QA review
Verdict: reject

## Summary

Reviewed LB-01..LB-04 on the C-only labs extraction: `domains/labs/{selectors,controller}.js`, C facades in `c/app.js`, and `qa/tests/web-labs.test.js`. Domain unit logic (sort, match, build/add/remove round-trip) looks sound and save/remove submit paths correctly call `labsController`. **Cold C boot is blocked:** `c/index.html` never loads the labs domain scripts while `c/app.js` calls `PetLiveWeb.domains.labs.createSelectors` / `createController` during top-level init (~2584). Formal B (`apps/web/app.js`, `apps/web/index.html`) is untouched. Automated tests were not executed in this environment (`node` unavailable); static review of `web-labs.test.js` covers domain-only paths only, not C script boot.

## Findings

### C boot aborts — labs domain scripts missing from index.html
- ID: QA-001
- Severity: high
- Steps:
  1. Open C discussion surface (`apps/web/c/index.html`) with a clean cache.
  2. Inspect `<script defer>` tags before `c/app.js` for `../domains/labs/selectors.js` and `../domains/labs/controller.js`.
  3. Load the page and watch the console during `app.js` evaluation.
- Expected: Labs selectors/controller load before `app.js`; `PetLiveWeb.domains.labs.createSelectors` succeeds; labs list / lab-add screens init.
- Actual: No labs script tags in `c/index.html` (only existing domain scripts through cloud, then `app.js`). `c/app.js` invokes `PetLiveWeb.domains.labs.createSelectors` at init → `TypeError: Cannot read properties of undefined (reading 'createSelectors')` (or equivalent) before any labs UI runs.

### Lab list/read path bypasses labsController (save/remove parity drift)
- ID: QA-002
- Severity: medium
- Steps:
  1. Compare `labsController.getLabReportsForPet` / selector helpers with C `getLabReportsForPet()` (~2640) used by `renderLabList`, `renderEmergencyLabNav`, and `renderVisitLabsLine`.
  2. Save a lab via lab-add (uses `labsController.buildLabReport` + `addLabReport`).
  3. Hypothetically change sort/filter rules in the controller only.
- Expected: All read/write lab-report paths go through the extracted controller/selectors so behavior stays aligned.
- Actual: Submit save (~7042–7054) and remove (~7072) use `labsController`; list/emergency/timeline reads duplicate slot read + sort/filter inline and duplicate `reportMatchesVisit` instead of `labsSelectors.reportMatchesVisit` / `visitHasLinkedLabs`. Works today but diverges on the next controller tweak.

### Domain + test artifacts not on branch HEAD
- ID: QA-003
- Severity: medium
- Steps:
  1. `git ls-files apps/web/domains/labs/` and `qa/tests/web-labs.test.js`.
  2. Compare with working-tree `git status`.
- Expected: Candidate branch HEAD contains labs domain files, EM/LB tests, and C script wiring so a fresh clone reproduces the extraction.
- Actual: `domains/labs/{selectors,controller}.js` and `qa/tests/web-labs.test.js` are **untracked** (`??`); C script-tag wiring for labs is also absent on HEAD. Review depends on local working-tree files.

## Pass notes (no issue IDs)

| Check | Result |
|---|---|
| Lab save submit path | Pass — validates photo + date; `labsController.buildLabReport` + `addLabReport`; toast + `go("labs")` |
| Lab remove path | Pass — `[data-lab-remove]` → `labsController.removeLabReport(pet.id, id)` + persist toast |
| Pet isolation (lab-add) | Pass — `labAddBoundPetId` + `ensureLabAddForPet` reset pending photos/types/visit link on pet switch via `renderCoordinator` `lab-add` |
| Domain no DOM / no localStorage | Pass — static guards in `web-labs.test.js` loader |
| Formal B touched | Pass — `apps/web/app.js` / `apps/web/index.html` diff empty for this slice |
| Boot order vs other domains | Fail — see QA-001; otherwise existing pets→visits→timeline→… order unchanged |

## Automated tests

Not run (`node` not available in review environment). `qa/tests/web-labs.test.js` statically covers LB-01/LB-02 domain selectors/controller only; no C `index.html` script-order or facade integration test.

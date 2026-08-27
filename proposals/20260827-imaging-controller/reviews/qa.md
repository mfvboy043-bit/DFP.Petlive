# QA review
Verdict: reject

## Summary

Reviewed IM-01..IM-04 on the C-only imaging extraction: new `domains/imaging/controller.js`, imaging removed from `domains/visits/controller.js`, `timeline/selectors.js` imaging inject, C facades, and `qa/tests/web-imaging.test.js` + updated `web-timeline-visits.test.js`. Domain helpers (`setVisitImaging`, cap/clear, `getImagingVisitEntries`) match prior visits-controller semantics; C wires `timelineSelectors` with `{ visits, imaging }` after `imagingController` init (~4580–4587); imaging-proof save calls `setVisitImaging` then `applySelectedPet()` → pets-graph persist; med proof and visit imaging use separate pending state and screens. **Blockers:** C `index.html` omits the imaging script tag; shared domain edits regress formal B while B facades are unchanged; pet switch does not clear in-flight imaging-proof pendings. TDZ concern for `imagingController` facades declared above `const imagingController` is **not** hit in current boot (`applySelectedPet()` runs last, after controller init). Formal B app/index not modified. Tests not executed (`node` unavailable).

## Findings

### C boot aborts — imaging controller script missing from index.html
- ID: QA-001
- Severity: high
- Steps:
  1. Open C (`apps/web/c/index.html`) cold.
  2. Search script tags for `../domains/imaging/controller.js`.
  3. Load page; watch console during `app.js` top-level init.
- Expected: Imaging controller loads before `c/app.js`; `PetLiveWeb.domains.imaging.createController()` succeeds; timeline + imaging-proof init.
- Actual: No imaging script tag in `c/index.html`. `c/app.js` calls `PetLiveWeb.domains.imaging.createController()` (~4583) → boot throws before timeline/imaging UI.

### Shared domain changes break formal B (B facades untouched)
- ID: QA-002
- Severity: high
- Steps:
  1. Confirm `git diff apps/web/app.js apps/web/index.html` is empty.
  2. Load formal B with updated shared scripts: `domains/visits/controller.js` (imaging helpers removed) and `domains/timeline/selectors.js` (requires `imaging` inject).
  3. Observe B init: `timelineSelectors = createSelectors({ visits })` (~4769) and `visitsController.getVisitImaging` facades (~1157).
- Expected: C-only slice leaves B behavior unchanged until an explicit C→B cover.
- Actual: B still calls `visitsController.getVisitImaging` / `visitHasImaging` / `getImagingVisitEntries`, which are **no longer exported** from the modified visits controller. B `createSelectors({ visits })` omits required `imaging` → `TypeError: createSelectors requires imaging controller visitHasImaging`. Shared domain files under `apps/web/domains/` affect B script URLs even though B app/index were not edited.

### Pet switch leaves imaging-proof pending state bound to prior pet
- ID: QA-003
- Severity: medium
- Steps:
  1. Pet A → timeline → upload visit imaging → `imaging-proof` (sets `pendingImagingVisitIndex`, `pendingXrayPhotos` / `pendingUsPhotos`).
  2. Back to home; switch to Pet B (`petsController.afterSelect` ~4557 — clears `pendingMeds` / `completingVisitRef` only).
  3. Return to `imaging-proof` (history / nav) or save without re-opening via `openVisitImaging`.
  4. Tap **儲存影像**.
- Expected: Pending imaging session clears or re-binds on pet switch; save always targets the current pet’s intended visit.
- Actual: `pendingImagingVisitIndex` and photo buckets persist across `afterSelect`. Save (~6897–6914) uses `getCurrentPet()` (Pet B) with stale visit index / photos from Pet A → wrong visit may receive imaging or save fails opaquely.

### Candidate artifacts not committed on branch HEAD
- ID: QA-004
- Severity: medium
- Steps:
  1. `git ls-files apps/web/domains/imaging/ qa/tests/web-imaging.test.js`.
  2. Compare `git status` for shared `visits/controller.js`, `timeline/selectors.js`, and C wiring.
- Expected: Branch HEAD contains imaging domain, tests, C script tags, and committed shared-domain deltas for reproducible review.
- Actual: `domains/imaging/controller.js` and `qa/tests/web-imaging.test.js` are **untracked**; visits/timeline domain diffs and C script tags are uncommitted / absent on HEAD.

## Pass notes (no issue IDs)

| Check | Result |
|---|---|
| TDZ `imagingController` before `const` init | Pass — facades (~1056–1116) defer access; `imagingController` + `timelineSelectors` init ~4580–4587; first `applySelectedPet()` ~8044 runs after |
| Timeline imaging inject (C) | Pass — `createSelectors({ visits: visitsController, imaging: imagingController })` satisfies new contract |
| `setVisitImaging` save path | Pass — imaging-proof submit → `setVisitImaging(visit, { xrayPhotos, usPhotos })` → `applySelectedPet()` → `schedulePetsGraphPersist()` |
| Proof vs imaging separation | Pass — med proof uses `pendingProofVisitIndex` + visit proof slots; imaging uses separate pendings + `visit.imaging`; timeline inline clear uses `clearVisitImagingPhoto`, not proof slots |
| Pet isolation (labs pattern) | N/A for imaging list (visit-index keyed on current pet); see QA-003 for in-flight proof form |
| Domain no DOM | Pass — static checks in `web-imaging.test.js` / `web-timeline-visits.test.js` |
| Formal B app/index edited | Pass — no diff on `apps/web/app.js` / `apps/web/index.html` |
| Shared domain B regression | Fail — see QA-002 |

## Automated tests

Not run (`node` not available in review environment). `qa/tests/web-imaging.test.js` (IM-01) and updated `web-timeline-visits.test.js` (imaging inject + timeline flags) cover domain wiring only; no C `index.html` boot-order or pet-switch integration test.

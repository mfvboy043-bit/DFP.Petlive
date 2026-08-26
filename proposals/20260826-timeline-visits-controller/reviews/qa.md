# QA review
Verdict: pass

## Findings

### C no longer depends on medications domain for Timeline boot — resolved
- ID: QA-001
- Severity: resolved (was medium)
- Steps: 1. Inspect `apps/web/c/index.html` script tags. 2. Search `apps/web/c/app.js` for `PetLiveWeb.domains.medications` / `domains/medications`. 3. Confirm `formatMedDose` / `formatMedCourse` / `formatDraftDoseLine` are local functions. 4. Confirm visits + timeline bootstrap and `renderTimeline` → `timelineSelectors.buildTimelineEntries`.
- Expected: TV-only C boots without medications scripts; Rx dose/course lines still come from inlined helpers; Timeline can paint.
- Actual: **Fixed.** `c/index.html` loads only `domains/pets`, `domains/visits`, `domains/timeline` (no `domains/medications/*`). `c/app.js` has zero `PetLiveWeb.domains.medications.*` calls. Med formatters are inline again (~920–962). `visitsController` + `timelineSelectors` still created mid-file; `renderTimeline` uses `buildTimelineEntries`. Cache `?v=20260826-tv-qa001` on `app.js`. `domains/medications/*` may remain on disk for another proposal — C does not load them. No new TV boot regression found on this path.

### Node boundary suite not executed in this environment
- ID: QA-002
- Severity: low
- Steps: 1. Run `node --test qa/tests/web-timeline-visits.test.js` (acceptance TV-04). 2. Note runner availability on the review host.
- Expected: Automated suite runs and passes under `node:test` + `vm` as written.
- Actual: `node` still unavailable here. Domain API re-checked via JXA (`osascript` load of visits + timeline → `JXA_OK`: entries/flags/previousVisit, weight save, proof clear, imaging ensure/clear). Full `node --test` green status remains unverified on this host.

### `findVisitByDateClinic` empty / date-only cases untested
- ID: QA-003
- Severity: low
- Steps: 1. Read `qa/tests/web-timeline-visits.test.js` link/find cases. 2. Call `findVisitByDateClinic(pet, { date })` and `{ date, clinicName: "" }` against mixed same-day visits.
- Expected: Boundary tests lock empty-name vs date-only behavior before any future wiring.
- Actual: Unchanged. Tests still cover `clinicId` and non-empty `clinicName` only. Helper is still not facaded into `getOrCreateVisitForMedSave` (inline in `c/app.js`, per non-goal) — no live regression today.

## Notes (no defect ID)

- **Visits / timeline facades intact:** Thin wrappers still delegate to `visitsController` (proof, imaging, weight math/previous-map, link parse/find) and `timelineSelectors.buildTimelineEntries`. `saveVisitWeightAtIndex` still reads the input, calls `visitsController.saveVisitWeight`, toasts, then `applySelectedPet()`. Proof/imaging clear paths still call controller helpers then refresh.
- **Pet switch → timeline:** `petsController.afterSelect` clears pending med session → `applySelectedPet` → coordinator `"timeline"` → `renderTimeline`. No bypass found.
- **No modules/visit dual-write** in C or visits/timeline domains; domains have no `document` / `localStorage`.
- **Formal B:** Not re-audited as changed for this QA-001-only rerun; C remains the wired surface.
- **Material defects:** None after revision. Blocking QA-001 closed; QA-002 / QA-003 remain non-blocking notes only.

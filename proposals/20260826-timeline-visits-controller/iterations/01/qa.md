# QA review
Verdict: conditional

## Findings

### C candidate mixes out-of-scope medications domain into timeline chrome
- ID: QA-001
- Severity: medium
- Steps: 1. Treat Gate A scope as TV-01…TV-04 only (visits + timeline domains, C facades for those helpers). 2. Remove or omit `apps/web/domains/medications/*` and their `c/index.html` script tags, leaving the current `c/app.js` facades (`formatMedDose` / `formatMedCourse` / `formatDraftDoseLine` → `medicationsSelectors`). 3. Load C and open Timeline for a pet with visit medications (or Emergency meds list).
- Expected: TV-only candidate boots and timeline Rx dose/course lines still render from inlined (or TV-scoped) helpers; adopting TV does not require another proposal’s domain.
- Actual: Mid-file bootstrap calls `PetLiveWeb.domains.medications.createSelectors` / `createController`. Without those scripts, `c/app.js` throws during evaluation before `applySelectedPet()`, so Timeline never paints. Current worktree also loads meds scripts and changes parasite flows in the same C diff, so this is not a clean behavior-preserving TV extraction surface.

### Node boundary suite not executed in this environment
- ID: QA-002
- Severity: low
- Steps: 1. Run `node --test qa/tests/web-timeline-visits.test.js` (acceptance TV-04). 2. Note runner availability on the review host.
- Expected: Automated suite runs and passes under `node:test` + `vm` as written.
- Actual: `node` is unavailable here. Static review of the test file covers the TV-04 checklist (previous-map, weight save/reject, proof clear+nested, imaging ensure/clear/max, link parse/find, timeline flags/previousVisit, no `document`/`localStorage`/`modules/visit`). Domain logic was re-checked with JavaScriptCore (`load` + assertions → `JSC_OK` / `EDGE_OK`). Full `node --test` green status is unverified on this host.

### `findVisitByDateClinic` empty / date-only cases untested
- ID: QA-003
- Severity: low
- Steps: 1. Read `qa/tests/web-timeline-visits.test.js` link/find cases. 2. Call `findVisitByDateClinic(pet, { date })` and `{ date, clinicName: "" }` against mixed same-day visits.
- Expected: Boundary tests lock the public helper’s empty-name vs date-only behavior (aligned with mainline `getOrCreateVisitForMedSave` name matching) before any future wiring.
- Actual: Tests only cover `clinicId` and non-empty `clinicName`. Helper is not yet facaded into `getOrCreateVisitForMedSave` (still inline in `c/app.js`, per non-goal), so no live regression today; gap remains if Builder or meds follow-up starts calling the controller API.

## Notes (no defect ID)

- **Weight / previous map / delta:** Extracted `buildPreviousVisitByIndex`, `visitWeightKg`, `calendarDaysBetween`, `formatWeightDeltaKg`, and `saveVisitWeight` match mainline C bodies (normalized compare). Facade `saveVisitWeightAtIndex` still reads the input, toasts, then `applySelectedPet()` — parity preserved.
- **Proof / imaging:** `collectVisitProofPhotos` / `clearVisitProofSlot` (visit + nested med photos) and imaging ensure/clear/max match mainline. Pending imaging form still uses `IMAGING_PHOTOS_MAX` from the controller; `appendVisitImagingPhoto` is API+tested but not required on the pending-upload path (still assigns imaging arrays on submit — same as before).
- **Visit link:** `visitLinkValue` / `parseVisitLinkValue` / `findVisitByLink` match mainline with injected `clinicLabelOf: visitClinicLabel`.
- **Pet switch → timeline freshness:** Still `petsController.afterSelect` → `applySelectedPet` → render coordinator `"timeline"` registration → `renderTimeline(pet)` via `buildTimelineEntries`. No bypass found.
- **Facade bootstrap:** `visitsController` / `timelineSelectors` created mid-file (with pets). Early helpers are function bodies that resolve controllers at **call time** only; bottom-of-file `applySelectedPet()` runs after init. Same pattern as existing pets controller — OK.
- **No modules/visit dual-write;** domains have no `document` / `localStorage` / `t(` references.
- **Formal B:** Unchanged in the worktree for this extraction (`apps/web/app.js` / `index.html` not modified in current dirty tree). Parasite / meds / i18n / styles noise on C ignored except where it couples Timeline boot (QA-001).

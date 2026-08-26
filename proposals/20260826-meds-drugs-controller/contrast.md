# Contrast: mainline C vs meds/drugs controller candidate

## Mainline (pre-adopt C on timeline-visits WIP)

- Med draft / pending / compound / buildVisitMedicationsFromPending live inline in `apps/web/c/app.js`.
- `findVisitByDateClinic` treats empty `clinicName` as “any visit on that date”.
- Pet switch does not clear `pendingMeds` / `completingVisitRef` / compound color session bag.
- No `domains/medications` scripts in `c/index.html`.

## Candidate (adopted)

- `PetLiveWeb.domains.medications` owns draft validate/normalize, pending/compound assembly, photo_bundle append, findVisitForMedSave (via visits).
- Selectors own dose/course/draft display strings and compound class/icon tokens (no HTML).
- Empty clinic name matches only empty-label same-day visits (QA-001).
- Pet `afterSelect` clears med session state (QA-002).
- C facades keep DOM / toast / HTML renderers; formal B untouched.

## Files

### Added

- `apps/web/domains/medications/controller.js`
- `apps/web/domains/medications/selectors.js`
- `qa/tests/web-medications.test.js`

### Changed

- `apps/web/domains/visits/controller.js` — empty-clinic find semantics
- `apps/web/c/app.js` — compose medications + facades + afterSelect clear
- `apps/web/c/index.html` — script tags + cache `?v=`

### Unchanged (this adopt)

- Formal B (`apps/web/app.js` / root `index.html`)
- `modules/*`, `contracts/*`, Pages publish

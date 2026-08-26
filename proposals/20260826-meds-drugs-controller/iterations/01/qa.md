# QA review
Verdict: conditional

Candidate: `.worktrees/meds-drugs-controller` (`proposal/meds-drugs-controller`), iteration 1, scope MD-01..MD-04.  
Checked: `domains/medications/*`, C facades / script order, visits public API usage, `qa/tests/web-medications.test.js` (11/11 pass), proposal acceptance. Formal B not modified.

## Findings

### Complete-drugs can attach to the wrong same-day visit when clinic label is empty
- ID: QA-001
- Severity: medium
- Steps:
  1. On C, use a pet with **two visits on the same date**: Visit A has a clinic name/id; Visit B has **no `clinicId` and empty/missing `clinic`** (so `visitClinicLabel(B)` is `""`).
  2. Ensure Visit B has a `photo_bundle` med (or create one via photo Rx save).
  3. On timeline, tap **補齊藥名** / complete-drugs for Visit B.
  4. Add ≥1 pending med in manual mode and save.
  5. Inspect which visit received the new `medications[]` entries.
- Expected: Units append to the completing visit (B), matching mainline `pet.visits.find` name/id rules for `completingVisitRef`.
- Actual: Facade calls `medications.findVisitForMedSave` → `visits.findVisitByDateClinic` with `clinicName: ""`. Visits helper treats empty `clinicName` + falsy `clinicId` as “any visit on that date” (`return !clinicId`), so the **first** same-date visit (often A) can win. Mainline required `visitClinicLabel(item) === ""` / empty `clinic`, not “first on date.” If find misses entirely, both old and new still fall through to visit-form create/find (pre-existing), which worsens the mismatch.

### Pet switch leaves pending / completing session state (wrong-pet write risk)
- ID: QA-002
- Severity: medium
- Steps:
  1. Pet A → add-visit → add-med; add drugs to pending list (do not save).
  2. Or: Pet A → complete-drugs on a visit (`completingVisitRef` set).
  3. Switch current pet to Pet B via picker (stay on / return to add-med).
  4. Save pending list (or photo Rx).
- Expected: Pending / completing context is cleared or re-bound so writes stay on the visit/pet that started the flow.
- Actual: `pendingMeds` and `completingVisitRef` are session globals; `petsController.afterSelect` does not clear them. Save uses `getCurrentPet()` → units / photo_bundle land on **Pet B** (or a newly created visit on B). Pre-existing on C; **not introduced** by the extract, but still blocks safe multi-pet use of the meds path this slice owns. `compoundColorByGroup` also survives pet switches (same session bag).

### Boundary tests miss complete-drugs / empty-clinic find parity
- ID: QA-003
- Severity: low
- Steps:
  1. Read MD-04 acceptance vs `qa/tests/web-medications.test.js`.
  2. Run `node --test qa/tests/web-medications.test.js` (11/11 pass: draft validate/normalize, pending mutate, compound bundle/solo/schedule split, photo_bundle sources, appendUnits startDate, findVisit happy-path, search/enrich fakes, no DOM/localStorage/createMedication in domain source, weight delegate).
- Expected: Tests also guard the risky med-save wiring: completingVisitRef → findVisitForMedSave with empty clinic label; and ideally assert find parity with mainline “empty name ≠ any clinic.”
- Actual: Coverage matches most MD-04 bullets but does **not** fail on QA-001’s empty-`clinicName` semantics or any C facade / `getOrCreateVisitForMedSave` composition. Gaps are documentation of residual risk, not a product crash.

## Notes (non-findings)
- Manual pending → `buildVisitMedicationsFromPending` → `appendUnitsToVisit` and photo `appendPhotoBundleToVisit` preserve compound_bundle / solo / schedule-split and `owner` / `owner_proof` shapes vs mainline.
- Draft validation toasts still map `need_drug` / `dose` / `days` from structured `{ ok, reason }`.
- Med-save weight now goes through `visits.saveVisitWeight` (date-guard vs always overwrite). Intentional TV dependency; not treated as a defect for this slice.
- No `modules/medication` / Map dual-write in domain or C save path; B untouched; script order pets → visits → timeline → medications → `c/app.js` is valid.

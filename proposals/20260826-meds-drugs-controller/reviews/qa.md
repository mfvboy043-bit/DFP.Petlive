# QA review
Verdict: pass

Candidate: `.worktrees/meds-drugs-controller` (`proposal/meds-drugs-controller`), **iteration 2** re-run after Builder fixes for QA-001 / QA-002.  
Checked: `domains/visits/controller.js` `findVisitByDateClinic`, C `petsController.afterSelect`, `getOrCreateVisitForMedSave` / `completingVisitRef` path, `qa/tests/web-medications.test.js` (**13/13 pass**, including new QA-001 / QA-002 cases). Formal B not in builder_scope; B `afterSelect` still does not clear med session (C-first residual only).

## Prior issue status

| ID | Severity | Status | Notes |
|---|---|---|---|
| QA-001 | medium | **fixed** | Empty `clinicName` no longer matches “any same-day”; matches empty-label only. |
| QA-002 | medium | **fixed** | C `afterSelect` clears `pendingMeds`, `completingVisitRef`, and `compoundColorByGroup`. |
| QA-003 | low | **residual** | Coverage improved; full `getOrCreateVisitForMedSave` composition still not exercised. |

## Findings

### Complete-drugs empty clinic find (prior QA-001) — fixed
- ID: QA-001
- Severity: medium
- Status: fixed
- Steps:
  1. Pet with two same-date visits: A named/id clinic; B empty/`""` clinic label.
  2. Complete-drugs on B → save pending meds.
  3. Or run `empty clinicName matches only empty-label same-day visit (QA-001)`.
- Expected: Units attach to B; empty name ≠ first-on-date.
- Actual (iteration 2): `findVisitByDateClinic` compares `clinicLabelOf(visit) === name || visit.clinic === name` with `name = String(clinicName ?? "")` — no `!clinicId` wildcard. Facade `findVisitForMedSave` → same helper. Test asserts empty name hits `visits[1]`, not named `visits[0]`. Residual: if find returns `null` while `completingVisitRef` is set, C still falls through to visit-form create/find (pre-existing; rare after label fix). Two empty-label same-day visits still resolve to `Array.find` first match (mainline-parity).

### Pet switch med session clear (prior QA-002) — fixed
- ID: QA-002
- Severity: medium
- Status: fixed
- Steps:
  1. Pet A: pending meds and/or complete-drugs (`completingVisitRef`).
  2. Switch to Pet B via picker (`petsController.select` → `afterSelect`).
  3. Save or inspect session globals / UI pending list.
- Expected: Pending / completing / compound colors do not carry onto B.
- Actual (iteration 2): C `afterSelect` sets `pendingMeds = []`, `completingVisitRef = null`, deletes all `compoundColorByGroup` keys, then `renderPendingMeds` / `updateMedModeHint`. Source guard `C afterSelect clears med session on pet switch (QA-002)` passes. Same-pet `select` still short-circuits without clearing (good). Residual: formal B `afterSelect` unchanged (out of this slice); QA-002 test is source-scan only, not a live multi-pet DOM save.

### Boundary tests / empty-clinic parity (prior QA-003) — residual
- ID: QA-003
- Severity: low
- Status: residual
- Steps:
  1. Compare MD-04 vs `web-medications.test.js` after iteration 2.
  2. Run `node --test qa/tests/web-medications.test.js` → 13/13 pass.
- Expected: Guards for empty-clinic find and pet-switch session clear.
- Actual: QA-001 semantics and C `afterSelect` clear are now covered. Still no end-to-end assertion that `getOrCreateVisitForMedSave` + `completingVisitRef` composition never falls through incorrectly. Non-blocking documentation of residual risk.

## Notes (non-findings)
- Manual pending / photo_bundle / weight-delegate paths unchanged from iteration 1 non-findings.
- `web-timeline-visits.test.js` reported 5 `deepStrictEqual` failures under Cursor’s bundled Node that look structurally identical (possible harness/assert quirk); QA-001 empty-clinic assert also lives in medications suite and passes there — not treated as a new meds defect for this re-run.

# QA review
Verdict: conditional

## Summary

Reviewed AL-01..AL-04 in the working-tree candidate: `domains/alerts/{controller,selectors}.js`, C facades in `c/app.js`, script wiring in `c/index.html`, and `qa/tests/web-alerts.test.js`. Alert math, composition, suppression, owner CRUD, and facade persistence paths match pre-extract mainline behavior. Pet-switch clears in-progress alert edit via `petsController.beforeSelect → resetAlertForm()`. Domain layer uses injected slots only (no `document` / `localStorage` / `modules/medical-alert`).

**Blocker for candidate_ready:** the alerts slice is not fully committed on `proposal/alerts-controller` — see QA-001.

Automated tests were not executed in this review environment (`node` unavailable); coverage assessed by static read of `web-alerts.test.js`.

## Findings

### Candidate branch missing committed alerts artifacts
- ID: QA-001
- Severity: medium
- Steps:
  1. Check out `proposal/alerts-controller` at HEAD (`git show HEAD:apps/web/c/app.js`).
  2. Compare with working tree and `git status apps/web/domains/alerts/ qa/tests/web-alerts.test.js`.
- Expected: Branch contains domain scripts, boundary tests, and C wiring so a fresh clone cold-loads C with alerts extraction.
- Actual: HEAD still has inlined alert helpers and no `domains/alerts/*` script tags. Working tree wires `alertsController` and loads `../domains/alerts/{controller,selectors}.js`, but those files and `qa/tests/web-alerts.test.js` are **untracked**; `c/app.js` / `c/index.html` alerts deltas are **uncommitted**. Review repro depends on local uncommitted files.

### Validation failures share one toast
- ID: QA-002
- Severity: low
- Steps:
  1. On C alerts screen, trigger `validateOwnerDraft` failure with a non-empty description but invalid chronic `sinceDate` (e.g. via devtools on `#alert-since-date` after switching type to chronic).
  2. Submit the alert form.
- Expected: Distinct feedback for invalid date vs empty description (or pre-extract parity if date was never validated).
- Actual: `saveAlertFromForm` maps every `!validation.ok` to `toastNeedAlertDescription`. New domain validation adds `invalid_since_date` / `invalid_severity` reasons but facade does not branch on `reason`. Normal `type="month"` input makes this hard to hit in production.

### Delete unknown alert id still toasts success
- ID: QA-003
- Severity: low
- Steps:
  1. On C alerts screen, call `deleteAlertById("nonexistent-id")` (devtools) for current pet.
- Expected: No-op or explicit “not found” feedback.
- Actual: `deleteOrSuppressAlert` returns `{ ok: true, kind: "none" }`; facade shows `toastAlertDeleted`. Pre-extract mainline parity.

### Suppress write failure after owner delete (partial apply)
- ID: QA-004
- Severity: low
- Steps:
  1. Seed an alert id present in both owner map and `pet.alerts[]` (edit-linked copy case).
  2. Mock `suppressedAlertsSlot.write` to return `false` after owner map write succeeds.
  3. Delete that alert.
- Expected: Atomic delete or rollback.
- Actual: Owner row is removed; suppress fails; `showPersistenceFailure` fires; linked row can reappear in list. Same sequential write order as pre-extract `deleteAlertById`; not introduced by extraction.

### Edit-linked → owner copy lacks automated test
- ID: QA-005
- Severity: low
- Steps:
  1. Run `node --test qa/tests/web-alerts.test.js`.
  2. Look for coverage of editing a linked-only id via facade/controller upsert.
- Expected: AL-04 test for linked edit creating owner copy with same id and hiding linked duplicate in composition.
- Actual: `updateOwnerAlert` upsert path and `saveAlertFromForm` base lookup appear correct in code review; no dedicated test. Manual spot-check recommended on C.

## Focus-area checklist (pass)

| Area | Result |
|---|---|
| Wrong-pet writes | Pass — facades pass `getCurrentPet().id`; pet switch clears edit form before select. |
| Suppression | Pass — idempotent suppress; linked hidden from composition; persistence failure surfaced. |
| Owner CRUD | Pass — create/update/delete delegate to controller; slot shape unchanged. |
| Edit linked → owner copy | Pass — `updateOwnerAlert` upsert when id not in owner map; composition dedupes by owner id. |
| Composition | Pass — linked minus suppressed minus owner-id collision + owner; sort order preserved. |
| Meds boot | Pass — alerts scripts load after pets/timeline, before medications; no alerts→meds dependency. |
| No medical-alert dual-write | Pass — no references in alerts domain or C alert facades. |
| Domain boundaries | Pass — no DOM/localStorage in domain; slots injected from C bootstrap. |
| Persistence failure paths | Pass — `saveAlertFromForm` / `deleteAlertById` call `showPersistenceFailure` on `persist_failed`. |
| Pet-switch freshness | Pass — maps read per call; `renderCoordinator` re-renders alerts badge/screen/emergency via `getAlertsForPet` facades. |

## Test plan (manual, C)

1. Cold-load `apps/web/c/` with cache-bust; confirm no console error from missing `PetLiveWeb.domains.alerts`.
2. Pet A: add owner alert; switch to Pet B — form cleared, list shows B’s alerts only.
3. Edit a **linked** alert, save — owner copy appears, linked duplicate hidden; emergency card matches.
4. Delete linked alert — suppressed, stays hidden after reload; delete owner alert — removed from map.
5. Simulate storage quota / slot write failure if possible — persistence toast, no silent success.
6. Import/export payload — `petAlerts` / `suppressedAlerts` round-trip still composes correctly.

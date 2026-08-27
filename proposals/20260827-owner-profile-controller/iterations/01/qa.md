# QA review

**Proposal:** `20260827-owner-profile-controller`  
**Candidate:** branch `proposal/owner-profile-controller`, commit `6b97b34`  
**Reviewed:** 2026-08-27

**Verdict: reject**

## Scope checked

| Check | Result |
|---|---|
| OW-01 selectors (`empty` / `demo` / `normalize` / `hasAny` / `copyRows` / `isDemoShowcase`) | Pass — `apps/web/domains/owner/selectors.js` matches proposal |
| OW-02 controller (slot-injected `load` / `save` / `hasAny`) | Pass — no direct `localStorage`; throws without slot |
| OW-03 C facades | Pass for owner slice — see findings for boot blockers |
| OW-04 `qa/tests/web-owner.test.js` | Fail — harness bugs (QA-004) |
| Same `ownerProfileSlot` → `ownerController` + `cloudController` | Pass — single const at ~3590, passed to cloud at ~7469 |
| Emergency copy uses `loadOwnerProfile()` | Pass — `buildEmergencyCopyText` at ~3640 |
| C facades: `loadOwnerProfile` / `saveOwnerProfile` / `ownerProfileHasAny` / `formatOwnerCopyLines` → `copyRows` | Pass |
| C script order (storage → owner → cloud → app.js) | Pass for owner tags |
| No formal B edits | Pass — `apps/web/app.js` / root `index.html` unchanged |
| Slot fork / data-loss (owner) | Pass — one slot, save normalizes (intentional); C key unchanged |

## Findings

### C boot fails — labs domain missing

- ID: QA-001
- Severity: high
- Steps:
  1. Check out commit `6b97b34`.
  2. Open `apps/web/c/index.html` script list and `apps/web/c/app.js` top-level init (~2584).
  3. Load C in browser or trace parse order.
- Expected: `app.js` only references domains present in script tags / tree.
- Actual: Top-level `PetLiveWeb.domains.labs.createSelectors` / `createController` run during `app.js` parse. No `domains/labs/*` in commit tree and no `<script>` tags for labs → `TypeError` before owner wiring executes.

### C boot fails — imaging domain missing

- ID: QA-002
- Severity: high
- Steps:
  1. At `6b97b34`, inspect `apps/web/c/app.js` ~4580 and imaging facades (~1056+).
  2. Compare to `index.html` scripts and `git ls-tree` for `domains/imaging/`.
- Expected: Imaging controller available if referenced.
- Actual: `const imagingController = PetLiveWeb.domains.imaging.createController()` at top level; `domains/imaging/` not in commit; no script tag → boot `TypeError`.

### Timeline view script missing; helpers never wired

- ID: QA-003
- Severity: high
- Steps:
  1. At `6b97b34`, note `index.html` adds `../domains/timeline/view.js?v=20260827-tl-lazy`.
  2. Confirm file in commit: `git cat-file -e 6b97b34:apps/web/domains/timeline/view.js` → not in tree.
  3. Search `app.js` for `timelineViewHelpers =` / `createViewHelpers` → absent.
  4. Open emergency or timeline screen (calls `timelineViewHelpers.notesIdForMed` at ~931).
- Expected: `view.js` shipped; `timelineViewHelpers` created before first drug-notes render; `findDrugByNameInCatalog` on `PetLiveWeb.domains.timeline`.
- Actual: Script 404; helpers undefined; `findDrugByMedName` calls `PetLiveWeb.domains.timeline.findDrugByNameInCatalog` which is not on selectors-only timeline bundle → runtime failure on timeline/emergency drug notes.

### OW-04 unit tests reference wrong harness properties

- ID: QA-004
- Severity: medium
- Steps:
  1. Read `qa/tests/web-owner.test.js` save / demo-mode / controller-hasAny cases.
  2. Compare to `loadOwner()` return shape (`stored`, `afterSaveCount` on harness, not on `controller`).
- Expected: Tests assert against harness slot state and `afterSaveCount`.
- Actual: Tests use `controller.stored`, `controller.afterSaveCount`, `controller.afterSaveProfile` — undefined on controller API. OW-04 acceptance (“tests pass”) not met.

### Out-of-scope diffs bundled into owner commit

- ID: QA-005
- Severity: medium
- Steps:
  1. `git diff ff76d43..6b97b34 --stat` on `apps/web/c/app.js` (~251 lines changed).
  2. Compare to `builder_scope` OW-01..04 (owner only).
- Expected: Owner extraction only; other domains shipped with their scripts/files.
- Actual: Same commit rewires timeline lazy notes, imaging facades, labs controller (`buildLabReport`, drops `source`/`createdAt`), without corresponding domain files or proposal scope. Blocks C boot and violates non-overwrite / scoped build.

## Owner slice — no material defects (when isolated)

When reviewing only the owner-profile wiring (ignoring bundled regressions):

- **Slot fork:** Single `ownerProfileSlot` shared by `ownerController` and `cloudController` — no second slot.
- **Emergency:** `buildEmergencyCopyText` still passes `profile: loadOwnerProfile()`; `formatOwnerCopyLines` maps `copyRows` kinds to existing `t()` keys (`copyOwnerLine`, `copyOwnerEmail`, `copyOwnerEmergency`, `copyOwnerAddress`).
- **Forms:** `owner-settings-form` submit still `readOwnerSettingsForm()` → `saveOwnerProfile()` → `renderEmergencyOwner()` → toast → `goBack()`.
- **Save semantics:** Controller normalizes before write (strips unknown keys, string coercion) — aligned with OW-02; no fork vs cloud backup slot.
- **C vs B:** `isDemoMode: () => false`; formal B untouched.

## Notes

- Node unavailable in review environment; OW-04 failure inferred from static analysis of test harness vs assertions.
- **Recommendation:** Rebuild candidate with owner-only `c/app.js` delta (or include labs/imaging/timeline files + script tags + `timelineViewHelpers` wiring in their own commits). Fix test harness destructuring; re-run `node --test qa/tests/*.test.js`.

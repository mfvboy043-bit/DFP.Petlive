# QA review

**Proposal:** `20260827-owner-profile-controller`  
**Candidate:** branch `proposal/storage-indexeddb`, commit `cf2893d` (iteration 2)  
**Reviewed:** 2026-08-27

**Verdict: pass**

## Scope checked

| Check | Result |
|---|---|
| OW-01 selectors (`empty` / `demo` / `normalize` / `hasAny` / `copyRows` / `isDemoShowcase`) | Pass — `apps/web/domains/owner/selectors.js` matches proposal |
| OW-02 controller (slot-injected `load` / `save` / `hasAny`) | Pass — no direct `localStorage`; throws without slot |
| OW-03 C facades | Pass — owner-only `c/app.js` delta; script tags added |
| OW-04 `qa/tests/web-owner.test.js` | Pass (static) — harness asserts `harness.stored` / `harness.afterSaveCount`; see Notes |
| Same `ownerProfileSlot` → `ownerController` + `cloudController` | Pass — single const ~3590, passed to cloud ~7460 |
| Emergency copy uses `loadOwnerProfile()` | Pass — `buildEmergencyCopyText` ~3640 |
| C facades: `loadOwnerProfile` / `saveOwnerProfile` / `ownerProfileHasAny` / `formatOwnerCopyLines` → `copyRows` | Pass |
| C script order (storage → owner → cloud → app.js) | Pass |
| No formal B edits | Pass — `apps/web/app.js` / root `index.html` unchanged |
| C boot — no missing domain refs | Pass — no `labs` / `imaging` / `timeline/view.js` / `timelineViewHelpers` in `c/app.js` |
| Owner-only diff (no scope creep in `c/app.js`) | Pass — `ff76d43..cf2893d` owner wiring only (~86 lines) |
| Slot fork / data-loss (owner) | Pass — one slot; save normalizes per OW-02; C key unchanged |

## Previous blockers — resolved

| ID | Iteration 1 issue | Iteration 2 (`cf2893d`) |
|---|---|---|
| QA-001 | Top-level `domains.labs` without scripts/files | Removed — no labs references in `c/app.js` or `index.html` |
| QA-002 | Top-level `domains.imaging` without scripts/files | Removed — no imaging references |
| QA-003 | Missing `timeline/view.js`; `timelineViewHelpers` unwired | Removed — no timeline view script tag or helper refs |
| QA-004 | Tests asserted `controller.stored` / `controller.afterSaveCount` | Fixed — tests use harness return (`harness.stored`, `harness.afterSaveCount`, `harness.afterSaveProfile`) |
| QA-005 | Out-of-scope domain rewires bundled in owner commit | Fixed — `c/app.js` diff is owner extraction + facades only |

## Findings

No material defects for the owner-profile slice at `cf2893d`.

## Owner flows verified (static)

- **Slot fork:** Single `ownerProfileSlot` shared by `ownerController` and `cloudController`.
- **Emergency:** `buildEmergencyCopyText` passes `profile: loadOwnerProfile()`; `formatOwnerCopyLines` maps `copyRows` kinds to existing `t()` keys.
- **Forms:** `owner-settings-form` submit → `readOwnerSettingsForm()` → `saveOwnerProfile()` → `renderEmergencyOwner()` → toast → `goBack()`.
- **Persistence failure:** `saveOwnerProfile` false → `showPersistenceFailure()` (unchanged).
- **Empty vs filled emergency card:** `renderEmergencyOwner` uses `ownerProfileHasAny(profile)` after domain `load()`.
- **Multi-pet:** Owner profile is account-scoped (not per-pet); pet switch does not fork owner slot.
- **Save semantics:** Controller normalizes before write (strips unknown keys, string coercion) — aligned with OW-02; intentional delta vs pre-extract direct slot write.
- **C vs B:** `isDemoMode: () => false`; formal B untouched.

## Notes

- Node unavailable in review environment; OW-04 pass inferred from static review of `qa/tests/web-owner.test.js` (harness shape matches assertions). Recommend Victor run `node --test qa/tests/*.test.js` before Gate B.
- Commit also carries shared-branch storage boot pieces (`storage-boot.js`, `core/storage.js` IDB hooks) for boot-order work on `proposal/storage-indexeddb`. At default C boot (no `storage-boot` script tag, backend `local`), owner slot read/write path remains synchronous localStorage — no owner-specific regression identified. IDB / `markBootComplete` wiring is out of this proposal’s scope.

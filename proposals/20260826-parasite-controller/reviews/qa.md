# QA review
Verdict: conditional

## Scope checked

- `apps/web/domains/parasite/controller.js` — catalog, status math, next-due, dual sync, validate/save, calendar payload data
- `apps/web/domains/parasite/selectors.js` — slot status (`optional`), stripFlags, hasApproaching / hasUnprotected
- `apps/web/c/app.js` — parasite facades (~1826–2320), past vs dosedToday save paths, strip/calendar chooser, other domain boots
- `apps/web/c/index.html` — parasite scripts after vaccines, before `c/app.js` (`?v=20260826-pa-ctrl`)
- `qa/tests/web-parasite.test.js` — PA-04 boundary suite (**12/12 pass** via available Node)
- Diff vs mainline inlined parasite helpers (behavior-preserving extract)

## Findings

### Candidate domain + tests not on branch commit
- ID: QA-001
- Severity: medium
- Steps: 1. `git checkout proposal/parasite-controller` on a clean clone (no dirty worktree). 2. Open `apps/web/c/index.html` (loads `../domains/parasite/controller.js` + `selectors.js`). 3. Boot C.
- Expected: Domain scripts load; `PetLiveWeb.domains.parasite.createController` runs during `c/app.js` bootstrap; `qa/tests/web-parasite.test.js` is present for PA-04.
- Actual: `apps/web/domains/parasite/*`, `qa/tests/web-parasite.test.js`, and proposal folder are **untracked**; `c/app.js` / `c/index.html` parasite wiring is **uncommitted**. Fresh checkout 404s domain scripts → boot throws before parasite UI. Iteration 1 is only reproducible from the current working tree, not from the named candidate branch alone.

### Pets-graph persist skipped after parasite save
- ID: QA-002
- Severity: low
- Steps: 1. On C, open parasite for a pet; save past or dosed-today for external (toast/strip update OK). 2. Do not switch pets / trigger any other `applySelectedPet` path. 3. Hard-reload the page.
- Expected (ideal): Saved `parasitePrevention` survives reload via pets-graph persist.
- Actual: Facade `saveParasiteKind` mutates `pet.parasitePrevention` and re-renders strip/forms but **does not** call `applySelectedPet` / `schedulePetsGraphPersist` (explicit Builder comment preserving pre-extract). Reload can drop the save until some other flow persists the graph. **Pre-existing** vs mainline; in-scope to document only (proposal follow-up #2). Not introduced by PA-01..04.

### Pet-switch while already on parasite screen does not re-fill forms
- ID: QA-003
- Severity: low
- Steps: 1. Enter parasite screen for Pet A (forms filled). 2. Switch to Pet B without leaving the screen (if a select path is available from chrome). 3. Inspect external/heartworm fields and `selectedParasiteProduct`.
- Expected (ideal): Forms/chips match Pet B immediately on select.
- Actual: `fillParasiteScreen` runs on `onEnter("parasite")` and language refresh only; no `renderCoordinator.register("parasite", …)`. Pet switch → `applySelectedPet` → `refreshSelection` updates home strip but does not re-fill parasite forms. Typical path (home picker → go parasite) still fills correctly via `onEnter`. **Pre-existing** mainline behavior; facades preserve it. Residual cross-pet draft risk only if select happens while parasite stays active.

## Behavior parity (no material parasite regressions found)

| Area | Result |
|---|---|
| Status lamps (`protected` / `approaching` / `unprotected`) | Matches mainline (`days < 0` unprotected; `<= 7` approaching; due-today = approaching). Contract text `<= 0` unprotected is pre-existing drift, not a new extract bug. |
| Cat heartworm unset → `optional` | Moved into `getParasiteSlotStatus`; strip uses selector; `hasUnprotected` ignores optional. |
| Dual-cover sync | Revolution / NexGard Spectra mirrors other kind; exclusive (Frontline) leaves other intact. Covered by tests. |
| dosedToday vs past | Past: `prepareParasiteNextDueFromLast` then quiet save. Today: `applyDosedToday` then quiet save. Calendar offer order unchanged. |
| Next-due math | `computeNextDue` / invalid interval → null; form normalize defaults interval 30. |
| validateDraft | `needProduct` / `needDates` / `order` → same toast keys in facade. |
| Calendar payload | Domain returns `{ title, details, nextDue }` or null; **no** `window.open`. Google/Apple open stay in C. |
| Multi-pet write target | `saveParasiteKind` uses `getCurrentPet()`; domain mutates only the passed pet (isolation test). |
| Other domain boots | alerts / meds / visits / timeline / vaccines / pets script tags + `createController` composition intact; parasite inserted after vaccines. |
| Formal B | Parasite domain not wired on B (out of scope). |
| Boundary tests | `web-parasite.test.js` 12/12 pass. |

## Notes

- Empty home-strip clear still iterates `"internal"` instead of `"heartworm"` when no pet — pre-existing typo, not introduced here.
- Worktree also has unrelated dirty files (`c/i18n.js`, `c/styles.css`, formal `apps/web/index.html`, other proposals); not treated as parasite regressions.
- Recommend committing PA-01..04 artifacts onto `proposal/parasite-controller` before Gate B so the branch alone boots and tests.

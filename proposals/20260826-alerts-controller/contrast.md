# Contrast: mainline vs Alerts candidate

## Candidate

- Branch: `proposal/alerts-controller`
- Path: `proposals/20260826-alerts-controller`
- Surface: **C only** + shared `domains/alerts`
- Status: `candidate_ready` (iteration 1)

## Mainline behaviors

1. Alert normalize / compose / suppress / owner CRUD logic inline in `c/app.js`.
2. Owner + suppressed maps via `PetLiveWeb.storage` slots (already present).
3. Render, form chips, nav badge, emergency list in `c/app.js`.
4. Formal B unchanged by this proposal’s Gate A scope.

## Candidate behaviors

1. Same alert rules; logic in `PetLiveWeb.domains.alerts` controller + selectors.
2. C facades keep same function names; `normalizeAlert` adds i18n `type` label in view layer.
3. `saveAlertFromForm` / `deleteAlertById` delegate CRUD to controller; DOM/toasts stay in C.
4. No `modules/medical-alert` dual-write; meds/visits/timeline boot preserved.

## Files to adopt (this proposal only)

### Add
- `apps/web/domains/alerts/controller.js`
- `apps/web/domains/alerts/selectors.js`
- `qa/tests/web-alerts.test.js`

### Change
- `apps/web/c/app.js` — alerts facades + compose
- `apps/web/c/index.html` — alerts script tags + cache `?v=`

### Exclude from adopt (hygiene)
- Unrelated C WIP in same worktree (parasite calendar, e-card chrome, `styles.css` tweaks — UI-001)
- Formal B until Victor confirms C → B cover

## Reviewer verdicts

- Pharmacist: pass
- QA: conditional → no blockers (QA-001 commit hygiene; QA-002–005 low/non-blocking)
- UI: pass (UI-001 unrelated WIP note)
- Arbiter: `candidate_ready`

## Merge checklist (after 採用 only)

- [x] Victor said 採用
- [x] Cherry-pick de1848b onto main (scoped; index conflicts kept main UI WIP)
- [x] Set proposal `status: adopted`
- [ ] C → B cover — ask Victor separately (not auto)

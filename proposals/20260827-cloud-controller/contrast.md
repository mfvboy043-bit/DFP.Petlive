# Contrast: mainline vs Cloud candidate

## Candidate

- Branch: `proposal/cloud-controller` (`88c8c3b` + QA-001 fix `bf25753`)
- Path: `proposals/20260827-cloud-controller`
- Surface: **C only** + shared `domains/cloud` (+ pets lifecycle/media files required for C boot)
- Status: `adopted` (Gate B Victor 採用 2026-08-27; surgical land on main)

## Mainline behaviors

1. Formal B owns full cloud brain inline (fingerprint, conflict, sync-meta, payload build/apply, reconcile orchestration).
2. C has thinner stub payload helpers; no sync-meta; design account preview; no Google scripts.
3. Drive transport lives in `auth/google-drive.js` (B).

## Candidate behaviors

1. Sync brain in `domains/cloud` (B semantics): fingerprints, conflict, dirty/bump/markSynced, status keys, strip/build/apply.
2. C wires domain with `petlive-c-sync-meta`; no auto Drive; DESIGN_ACCOUNT_PREVIEW chrome kept.
3. Formal B / auth untouched until cover.
4. Pets `lifecycle.js` / `media.js` included so C script tags resolve (QA-001).

## Files to adopt (this proposal)

### Add
- `apps/web/domains/cloud/selectors.js`
- `apps/web/domains/cloud/controller.js`
- `qa/tests/web-cloud.test.js`
- `apps/web/domains/pets/lifecycle.js` (if not already on target mainline)
- `apps/web/domains/pets/media.js` (if not already on target mainline)

### Change
- `apps/web/c/app.js` — cloud facades + sync-meta slot
- `apps/web/c/index.html` — cloud (+ pets lifecycle/media) script tags

### Exclude
- Formal B / Pages until Victor confirms cover
- `c/styles.css`, `c/i18n.js` unrelated WIP
- Moving `auth/google-drive.js`

## Reviewer verdicts

- UI: pass
- QA: conditional (QA-001 resolved; QA-002..005 non-blocking)
- Pharmacist: skipped
- Arbiter: `candidate_ready`

## Merge checklist (after 採用)

- [x] Victor said 採用 (2026-08-27)
- [x] Land CL files on main carefully (surgical if histories diverge)
- [x] Set proposal `status: adopted`
- [ ] Ask separately for C → B cover (swap B inline → domain; keep GIS)

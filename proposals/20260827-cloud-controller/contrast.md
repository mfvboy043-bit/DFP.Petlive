# Contrast: mainline vs Cloud candidate

## Candidate

- Branch: `proposal/cloud-controller` (`88c8c3b` + QA-001 fix `bf25753`)
- Path: `proposals/20260827-cloud-controller`
- Surface: **C** + shared `domains/cloud`; **C → B cover done** (Victor 覆蓋 2026-08-27)
- Status: `adopted` (Gate B Victor 採用 2026-08-27; surgical land on main)

## Mainline behaviors (after cover)

1. Sync brain in `domains/cloud` (fingerprints, conflict, dirty/bump/markSynced, status keys, strip/build/apply).
2. C wires domain with `petlive-c-sync-meta`; no auto Drive; DESIGN_ACCOUNT_PREVIEW chrome kept.
3. Formal B wires the same domain with `petlive-sync-meta` + live GIS (`auth/google-drive.js`); reconcile / intro / DEMO_MODE facades stay in `app.js`.
4. Pets `lifecycle.js` / `media.js` included so C script tags resolve (QA-001).

## Candidate behaviors (pre-cover)

1. Sync brain in `domains/cloud` (B semantics).
2. C wired first; B stayed inline until cover.
3. Drive transport stayed in `auth/google-drive.js` (B).

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

### C → B cover (Victor 覆蓋 2026-08-27)
- `apps/web/index.html` — load `domains/cloud` after vaccines; `app.js?v=20260827-cl-cover`; keep `config.public.js` + `auth/google-drive.js`
- `apps/web/app.js` — replace inline cloud helpers with domain facades; formal `petlive-sync-meta`; `liveGoogleSignedIn()` for status; QA-003 pull honors `applyCloudPayload` false

### Exclude
- Moving `auth/google-drive.js`
- Parasite / alerts / emergency script gaps on B (not part of this cover)
- `c/styles.css`, `c/i18n.js` unrelated WIP

## Reviewer verdicts

- UI: pass
- QA: conditional (QA-001 resolved; QA-002..005 non-blocking; QA-003 fixed on B cover pull path)
- Pharmacist: skipped
- Arbiter: `candidate_ready`

## Merge checklist (after 採用)

- [x] Victor said 採用 (2026-08-27)
- [x] Land CL files on main carefully (surgical if histories diverge)
- [x] Set proposal `status: adopted`
- [x] C → B cover (Victor 覆蓋 2026-08-27): swap B inline → domain; keep GIS + `petlive-sync-meta`

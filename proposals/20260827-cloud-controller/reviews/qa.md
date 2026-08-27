# QA review
Verdict: conditional

## Summary

Reran QA after QA-001 fix on `proposal/cloud-controller` @ `bf25753` (parent `88c8c3b`).

**QA-001 resolved:** `apps/web/domains/pets/lifecycle.js` and `media.js` are tracked in HEAD (`git cat-file` / `git ls-files` OK). `c/index.html` loads them (`?v=20260827-cl-qa001`) before `c/app.js`; both export `createLifecycle` / `createMedia`. Clean checkout no longer depends on untracked `??` files for C boot.

**Cloud wiring intact:** `domains/cloud/{selectors,controller}.js` unchanged by the fix commit; C facades still use `petlive-c-sync-meta`, `createSelectors` / `createController`, bump / markSynced / apply / strip / build. `node --test qa/tests/web-cloud.test.js` → 8/8 pass.

No new high defects. QA-002..005 remain as non-blocking notes (unchanged by this fix).

## Findings

### C boot depends on untracked pets lifecycle/media scripts
- ID: QA-001
- Severity: high
- Status: **resolved** (`bf25753`)
- Steps:
  1. Check out `proposal/cloud-controller` @ `bf25753` in a clean tree.
  2. Confirm `git cat-file -e HEAD:apps/web/domains/pets/lifecycle.js` and `…/media.js` succeed; both appear in `git ls-files`.
  3. Confirm `c/index.html` script tags for lifecycle/media precede `c/app.js`, and files export `createLifecycle` / `createMedia`.
- Expected: C boots; cloud domain scripts load; facades init without missing-script abort.
- Actual (after fix): Files are committed; script order and exports match `c/app.js` callsites. Prior failure mode (missing scripts → `createMedia is not a function`) no longer applies on clean HEAD.

### Account popover plan line shows false sync-dirty on C preview
- ID: QA-002
- Severity: medium
- Steps:
  1. Open C account popover (DESIGN_ACCOUNT_PREVIEW signed-in chrome).
  2. Note `#account-popover-plan-value` after cold load (seed pets, no live Google).
  3. Compare to pre-cloud C, which always set `t("accountPlanLocal")`.
- Expected: Discussion surface keeps stable local-plan copy without Drive, or at least does not alarm “dirty sync” when session is preview-only.
- Actual: Facade still uses `accountSyncStatusText()` → `accountSyncStatusKey({ signedIn: true, … })` via design preview (not `liveGoogleSignedIn()`). Boot `applySelectedPet()` → `schedulePetsGraphPersist()` → `bumpLocalDataRevision()` writes dirty `petlive-c-sync-meta`. Plan line becomes `accountSyncDirty` while Drive is absent and Sync/Restore still toast preview-only. Non-blocking for this slice.

### pullCloudBackup ignores applyCloudPayload false
- ID: QA-003
- Severity: medium
- Steps:
  1. Inspect C `pullCloudBackup`: after `downloadJson`, it calls `applyCloudPayload(payload)` then always `markCloudSynced` + success path.
  2. Domain `applyCloudPayload` rejects seed-only / demo (B parity).
  3. Mentally inject a non-null Drive adapter that returns a seed-only payload (or cover path later).
- Expected: If apply returns false, pull does not mark synced or toast restore success.
- Actual: Return value still ignored (~7685–7693); `markCloudSynced` still runs and pull returns true. Latent on C today (`googleDriveAuth` null → early return). Non-blocking for this slice.

### Early typeof cloudController is TDZ-fragile
- ID: QA-004
- Severity: low
- Steps:
  1. In `schedulePetsGraphPersist`, note `typeof cloudController !== "undefined"` before `const cloudController = …`.
  2. Invoke persist / `applySelectedPet` during top-level evaluate before that `const` initializes.
- Expected: Early boot falls back to `scheduleCloudBackup` without throwing.
- Actual: For `const`/`let`, `typeof cloudController` in the TDZ throws `ReferenceError`. Current boot only calls `applySelectedPet()` after cloudController exists, so not hit today; pattern remains fragile. Non-blocking.

### Legacy sync-meta synthesis untested
- ID: QA-005
- Severity: low
- Steps:
  1. Read `controller.readSyncMeta` when `hasStoredSyncMeta() === false` but pets graph has pets → synthesized `{ localRevision: 1, lastSyncedRevision: 0 }` (B parity).
  2. Run `qa/tests/web-cloud.test.js`.
- Expected: CL-04 asserts that legacy dirty synthesis path.
- Actual: Tests still cover empty/dirty/bump/markSynced and apply guards, but not “graph present, sync-meta absent”. Static read looks correct; coverage gap only. Non-blocking.

## Pass notes (no issue IDs)

- QA-001 fix commit touches lifecycle/media + C `?v=` + proposal state only; does not alter `domains/cloud/*` semantics.
- Seed-only / fingerprint / conflict / dirty / bump / markSynced / apply guards: domain + tests still align with B.
- No formal `petlive-sync-meta` / `petlive-pets-graph` writes from C; `SYNC_META_KEY = "petlive-c-sync-meta"`.
- `domains/cloud/*`: no `document`, `localStorage`, Google, GIS, or Drive HTTP.
- Formal B / `auth/google-drive.js` untouched by this candidate slice.
- Reconcile bar stays hidden; no auto Drive on C; push/pull/schedule no-op without session.
- Automated: `node --test qa/tests/web-cloud.test.js` → 8 pass @ `bf25753`.

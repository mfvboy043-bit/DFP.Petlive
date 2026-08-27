# QA review
Verdict: reject

## Summary

Reviewed iteration 1 candidate `88c8c3b` on `proposal/cloud-controller`: `domains/cloud/*`, C cloud facades / `petlive-c-sync-meta` wiring, `c/index.html`, `qa/tests/web-cloud.test.js`, and `proposal.md`.

Domain selectors/controller match B seed-only / fingerprint / conflict / dirty / bump / markSynced / strip / build / apply-guard semantics. `web-cloud.test.js` passes 8/8. Domain has no DOM, `localStorage`, GIS, or Drive. Commit does not touch formal B or `auth/google-drive.js`. C sync-meta key is `petlive-c-sync-meta` only.

**Blocker:** clean checkout of the committed candidate cannot boot C — see QA-001 (high).

## Findings

### C boot depends on untracked pets lifecycle/media scripts
- ID: QA-001
- Severity: high
- Steps:
  1. Check out `proposal/cloud-controller` @ `88c8c3b` in a clean tree (no untracked working-tree files).
  2. Confirm `git cat-file -e HEAD:apps/web/domains/pets/lifecycle.js` and `…/media.js` fail; files are not in `git ls-files`.
  3. Serve repo root and open `apps/web/c/`.
  4. Watch console / first paint.
- Expected: C boots; cloud domain scripts load; `createSelectors` / `createController` run; facades init without throw.
- Actual: Commit adds script tags for `domains/pets/lifecycle.js` and `media.js`, and `c/app.js` calls `PetLiveWeb.domains.pets.createMedia` / `createLifecycle` before cloud wiring — but those files are not in HEAD (local `??` only). Clean load → missing scripts → `createMedia is not a function` (or equivalent) → abort before `cloudController` / `initIntroAndCloud`. Scope bleed outside CL-01..04 and candidate is not bootable as committed.

### Account popover plan line shows false sync-dirty on C preview
- ID: QA-002
- Severity: medium
- Steps:
  1. With lifecycle/media present so C can boot, open C account popover (DESIGN_ACCOUNT_PREVIEW signed-in chrome).
  2. Note `#account-popover-plan-value` after cold load (seed pets, no live Google).
  3. Compare to pre-cloud C (`88c8c3b^`), which always set `t("accountPlanLocal")`.
- Expected: Discussion surface keeps stable local-plan copy without Drive, or at least does not alarm “dirty sync” when session is preview-only.
- Actual: Facade uses `accountSyncStatusText()` → `accountSyncStatusKey({ signedIn: true, … })` via design preview (not `liveGoogleSignedIn()`). Boot `applySelectedPet()` → `schedulePetsGraphPersist()` → `bumpLocalDataRevision()` writes dirty `petlive-c-sync-meta`. Plan line becomes `accountSyncDirty` while Drive is absent and Sync/Restore still toast preview-only.

### pullCloudBackup ignores applyCloudPayload false
- ID: QA-003
- Severity: medium
- Steps:
  1. Inspect C `pullCloudBackup`: after `downloadJson`, it calls `applyCloudPayload(payload)` then always `markCloudSynced` + success path.
  2. Domain `applyCloudPayload` now rejects seed-only / demo (B parity); C previously accepted seed payloads.
  3. Mentally inject a non-null Drive adapter that returns a seed-only payload (or cover path later).
- Expected: If apply returns false, pull does not mark synced or toast restore success.
- Actual: Return value ignored; `markCloudSynced` still runs and pull returns true. Latent on C today (`googleDriveAuth` null → early return), but new domain guards are not honored by the shell facade.

### Early typeof cloudController is TDZ-fragile
- ID: QA-004
- Severity: low
- Steps:
  1. In `schedulePetsGraphPersist`, note `typeof cloudController !== "undefined"` before `const cloudController = …`.
  2. Invoke persist / `applySelectedPet` during top-level evaluate before that `const` initializes.
- Expected: Early boot falls back to `scheduleCloudBackup` without throwing.
- Actual: For `const`/`let`, `typeof cloudController` in the TDZ throws `ReferenceError`. Current boot only calls `applySelectedPet()` after cloudController exists (~7910), so not hit today; pattern is fragile.

### Legacy sync-meta synthesis untested
- ID: QA-005
- Severity: low
- Steps:
  1. Read `controller.readSyncMeta` when `hasStoredSyncMeta() === false` but pets graph has pets → synthesized `{ localRevision: 1, lastSyncedRevision: 0 }` (B parity).
  2. Run `qa/tests/web-cloud.test.js`.
- Expected: CL-04 asserts that legacy dirty synthesis path.
- Actual: Tests cover empty/dirty/bump/markSynced and apply guards, but not “graph present, sync-meta absent”. Static read looks correct; coverage gap only.

## Pass notes (no issue IDs)

- Seed-only / fingerprint / conflict / dirty / bump / markSynced / apply guards: domain + tests align with B; apply rejects demo, invalid payload, and seed-only cloud; replace writes injected slots only.
- No formal `petlive-sync-meta` / `petlive-pets-graph` writes from C; `SYNC_META_KEY = "petlive-c-sync-meta"`.
- `domains/cloud/*`: no `document`, `localStorage`, Google, GIS, or Drive HTTP.
- Cloud commit file list for product: C + `domains/cloud` + proposal + `web-cloud.test.js` only — B/`auth` untouched this slice.
- When pets lifecycle/media exist: script order cloud selectors → controller → `c/app.js`; reconcile bar stays hidden; no auto Drive on C; push/pull/schedule no-op without session.
- Automated: `node --test qa/tests/web-cloud.test.js` → 8 pass. Other `web-*.test.js` failures on this branch are outside this commit’s delta.

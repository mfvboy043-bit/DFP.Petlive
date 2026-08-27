# Arbiter — 20260827-cloud-controller (iteration 1)

**Decision:** `revision_required`

## Reviews present

| Reviewer | File | Verdict |
|---|---|---|
| QA | `reviews/qa.md` | reject |
| UI | `reviews/ui.md` | pass |
| Pharmacist | — | skipped (no meds this slice) |

All assigned reviews present — proceed.

## Issue map

| ID | Source | Severity | Classification | Notes |
|---|---|---|---|---|
| QA-001 | QA | high | **blocking** | Clean checkout of `88c8c3b` cannot boot C: commit adds `lifecycle.js` / `media.js` script tags + `createMedia` / `createLifecycle` calls, but those files are untracked / not in HEAD. Scope bleed outside CL-01..04; candidate not bootable as committed. |
| QA-002 | QA | medium | non_blocking | Account plan line shows `accountSyncDirty` on DESIGN_ACCOUNT_PREVIEW after boot bump; misleading chrome, not data-loss / wrong-pet write. |
| QA-003 | QA | medium | non_blocking | `pullCloudBackup` ignores `applyCloudPayload` false then still `markCloudSynced`. Latent on C (`googleDriveAuth` null); not medical / not live data-loss this slice. |
| QA-004 | QA | low | non_blocking | `typeof cloudController` before `const` init is TDZ-fragile; not hit on current boot path. |
| QA-005 | QA | low | non_blocking | Legacy sync-meta synthesis path untested; static read OK. Coverage gap only. |
| (none) | UI | — | — | UI pass; no findings. |

## Blocking

- **QA-001** — high / reject root cause: C boot fail on clean candidate tree.

## Non-blocking

- QA-002
- QA-003
- QA-004
- QA-005

## Decision rationale

QA reject is driven by QA-001 (high): committed candidate is not a bootable C surface. That is blocking under protocol (high / reject item). Iteration 1 < `max_iterations` 3 → `revision_required`, not halt.

QA-002 / QA-003 are medium but do not break medical safety or lose user data on the current C stub path; kept non_blocking and out of `builder_scope`. UI pass adds nothing. Pharmacist skipped — no escalation.

## Rerun

`[qa]` — owns blocking QA-001; fix can regress C boot / cloud wire flow.

## Builder scope (revision)

`[QA-001]` only — restore bootable C on the committed candidate (remove stray pets lifecycle/media script/calls from this slice, or land those files if intentionally required for boot — without expanding into pets-domain feature work beyond what boot needs). Do not treat QA-002..005 as Builder must-fix this iteration.

## Halt

N/A (`iteration` 1 < `max_iterations` 3; blockers present → revise).

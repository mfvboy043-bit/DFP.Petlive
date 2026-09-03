# Phase 1 metrics — shared account/parasite CSS on C

Candidate baseline: worktree `/private/tmp/petlive-cb-shared-surface-p1` at `133d70c`, plus the Phase 1 CSS edits. Counts use the same migrated-selector definition as `qa/tests/web-shared-css-ownership.test.js`.

Migrated selectors are those starting with `.account-chip`, `.screen-head-actions .account`, `.parasite-strip`, or `.parasite-row`.

## This slice (duplicate ownership)

| Source | Before (HEAD surface copies) | After (Phase 1 candidate) |
|---|---|---|
| C `c/styles.css` migrated rules | 41 | 0 |
| C `c/styles.css` migrated declarations | 126 | 0 |
| B `styles.css` migrated rules | 41 | 41 (temporary allowlist) |
| B `styles.css` migrated declarations | 126 | 126 (temporary allowlist) |
| Canonical `shell/account-chrome.css` | (file did not exist) | 14 rules / 47 declarations |
| Canonical `shell/parasite-strip.css` layout/status slice | (lights overlay only) | 27 rules / 79 declarations |
| Canonical total for this slice | — | 41 rules / 126 declarations |
| Duplicate C copies of this slice | 41 rules / 126 declarations | 0 (resolved) |
| Duplicate B copies of this slice | 41 rules / 126 declarations | 41 / 126 (not resolved; Phase 2) |

Phase 1 removed the C copy only. Do not treat the remaining B duplicates as resolved.

Allowlist size: 29 selectors / 41 rules / 126 declarations in `qa/fixtures/web-shared-css-allowlist.json`, marked `delete_in: Phase 2`.

## Physical lines (candidate baseline)

| File | Before | After | Delta |
|---|---:|---:|---:|
| `apps/web/c/styles.css` | 8359 | 8024 | −335 |
| `apps/web/styles.css` | 8581 | 8581 | 0 |
| `apps/web/c/index.html` | 2138 | 2139 | +1 |
| `apps/web/index.html` | 2346 | 2346 | 0 |
| `apps/web/shell/account-chrome.css` | — | 96 | +96 |
| `apps/web/shell/parasite-strip.css` | 29 | 298 | +269 |

## Style assets and cache tokens

| Asset | Before | After |
|---|---|---|
| C `account-chrome.css` | not loaded | `../shell/account-chrome.css?v=20260903-cb-p1` (before `c/styles.css`) |
| C `parasite-strip.css` | `../shell/parasite-strip.css?v=20260830-strip-lights` (after `c/styles.css`) | `../shell/parasite-strip.css?v=20260903-cb-p1` (before `c/styles.css`) |
| C `styles.css` token | `20260830-perf-click-c` | `20260903-cb-p1` |
| B `account-chrome.css` | not loaded | not loaded |
| B `parasite-strip.css` | `./shell/parasite-strip.css?v=20260830-strip-lights` (after `styles.css`) | unchanged token and order |
| B `styles.css` token | `20260831-perf-click-cover` | unchanged |

Shared blocks this phase: C only loads the new `account-chrome.css`; both surfaces load `parasite-strip.css`; B-only activation of account chrome is deferred.

## Drift / allowlist

- Drift-test violations for migrated C selectors: 0 after this slice.
- Allowlist entries: 1 fixture covering B's matching 41-rule / 126-declaration account+parasite copy.
- Screenshots were not captured in this Builder pass (no browser). Cascade/computed-style proof is in `cascade-evidence.md`.
